'use client'

import { useRef, useState } from 'react'
import type { CircuitDrawing, SectionCircuitMap, StatItem } from '@/types/brochure'
import { isBrandToken, resolveColor, tokenLabel, type BrandContext } from '@/lib/brandColorTokens'
import { nanokey } from '@/lib/nanokey'
import { themeCircuitSvg } from '@/lib/themeCircuitSvg'
import { FieldInput, FieldRichText, FieldObjectArray, FieldLabel } from '../fields'
import { AnnotationEditor, AnnotationColorField, OpacitySlider } from './AnnotationEditor'

type Props = {
  section: SectionCircuitMap
  onChange: (update: Partial<SectionCircuitMap>) => void
  accentColor?: string
  onPickByColor?: (color: string) => void
  selectedAnnotationKey?: string | null
  onSelectAnnotation?: (key: string | null) => void
  selectedDrawingKey?: string | null
  onSelectDrawing?: (key: string | null) => void
  brandContext?: BrandContext
}

export function CircuitMapEditor({
  section,
  onChange,
  accentColor,
  onPickByColor,
  selectedAnnotationKey,
  onSelectAnnotation,
  selectedDrawingKey,
  onSelectDrawing,
  brandContext,
}: Props) {
  const svgInputRef = useRef<HTMLInputElement>(null)
  const [svgError, setSvgError] = useState<string | null>(null)
  const [svgLoading, setSvgLoading] = useState(false)

  async function handleSvgFile(file: File) {
    setSvgError(null)
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') {
      setSvgError('File must be an SVG')
      return
    }
    setSvgLoading(true)
    try {
      const text = await file.text()
      if (!text.includes('<svg')) {
        setSvgError('File does not contain an <svg> element')
        return
      }
      // Store the original alongside the themed copy so accent changes can
      // re-theme at render time without losing the source. Clear any existing
      // colour overrides since their elementIds reference indices in the
      // previous SVG and would otherwise apply to the wrong elements.
      const themed = themeCircuitSvg(text, accentColor)
      onChange({ svg: themed, svgOriginal: text, colorOverrides: [] })
    } catch (err) {
      setSvgError(err instanceof Error ? err.message : 'Could not read SVG')
    } finally {
      setSvgLoading(false)
    }
  }

  const overrides = section.colorOverrides ?? []
  const hasOriginal = Boolean(section.svgOriginal && section.svgOriginal.trim().length > 0)

  return (
    <>
      <div className="field-section-heading">Content</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Small script label above the title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="The circuit"
          aiAssist={{ field: 'eyebrow', sectionType: 'circuitMap', sectionContext: section }}
        />
        <FieldInput
          label="Title"
          description="Circuit name."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="Circuit de Monaco"
          aiAssist={{ field: 'title', sectionType: 'circuitMap', sectionContext: section }}
        />
      </div>
      <FieldRichText
        label="Caption"
        description="Short description beneath the title. Supports bullets and numbered lists."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        rows={2}
        aiAssist={{ field: 'caption', sectionType: 'circuitMap', sectionContext: section }}
      />

      <div className="field-section-heading">Circuit SVG</div>
      <FieldLabel
        label="SVG Upload"
        description="Upload an SVG and the palette is auto-remapped to the brochure theme. You can also paste the themed XML directly into the textarea below."
      >
        <div className="field-svg-upload">
          <button
            type="button"
            className="field-btn"
            onClick={() => svgInputRef.current?.click()}
            disabled={svgLoading}
          >
            {svgLoading
              ? 'Reading…'
              : section.svg && section.svg.trim().length > 0
                ? 'Replace SVG'
                : 'Upload SVG'}
          </button>
          {section.svg && section.svg.trim().length > 0 ? (
            <button
              type="button"
              className="field-btn field-btn-ghost"
              onClick={() => onChange({ svg: '', svgOriginal: '' })}
            >
              Clear
            </button>
          ) : null}
          <input
            ref={svgInputRef}
            type="file"
            accept=".svg,image/svg+xml"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleSvgFile(file)
              e.target.value = ''
            }}
          />
        </div>
        {svgError ? <div className="field-error">{svgError}</div> : null}
        <textarea
          className="field-textarea field-svg-textarea"
          value={section.svg ?? ''}
          onChange={(e) => onChange({ svg: e.target.value })}
          rows={6}
          placeholder="<svg>…</svg>"
          spellCheck={false}
        />
      </FieldLabel>

      {/* ── Map Editor sections (toolbar lives on the preview stage) ── */}
      <div className="map-editor">
        {!hasOriginal ? (
          <span className="field-color-hint">Upload an SVG to start editing the map.</span>
        ) : (
        <>
        <div className="map-editor-header">
          <span className="field-label-description">
            Use the toolbar on the preview to add annotations or draw. Click a circuit element to recolour it.
          </span>
        </div>

        {/* Colour overrides list */}
        {overrides.length > 0 ? (
          <div className="map-editor-section">
            <div className="map-editor-section-label">Colour overrides</div>
            <ul className="recolor-overrides-list">
              {groupOverridesByColor(overrides).map((group) => {
                const ctx = brandContext ?? { accentColor: '#cf212a', theme: 'dark' as const }
                const resolved = isBrandToken(group.color) ? resolveColor(group.color, ctx) : group.color
                const label = tokenLabel(group.color, ctx) ?? group.color
                return (
                <li key={group.color} className="recolor-overrides-item">
                  <button
                    type="button"
                    className="recolor-overrides-swatch is-button"
                    style={{ background: resolved }}
                    onClick={() => onPickByColor?.(group.color)}
                    title={`Select ${group.count} element${group.count > 1 ? 's' : ''} using ${label}`}
                    aria-label={`Select elements using ${label}`}
                  />
                  <span className="recolor-overrides-hex">{label}</span>
                  <span className="recolor-overrides-count">
                    {group.count} {group.count === 1 ? 'element' : 'elements'}
                  </span>
                  <button
                    type="button"
                    className="field-btn field-btn-ghost"
                    onClick={() =>
                      onChange({
                        colorOverrides: overrides.filter(
                          (x) => x.color?.toLowerCase() !== group.color,
                        ),
                      })
                    }
                  >
                    Reset
                  </button>
                </li>
                )
              })}
              <li>
                <button
                  type="button"
                  className="field-btn field-btn-ghost"
                  onClick={() => onChange({ colorOverrides: [] })}
                >
                  Reset all
                </button>
              </li>
            </ul>
          </div>
        ) : null}

        {/* Annotations list */}
        <AnnotationEditor
          annotations={section.annotations ?? []}
          onChange={onChange}
          selectedKey={selectedAnnotationKey ?? null}
          onSelect={onSelectAnnotation ?? (() => {})}
          pendingKind={null}
          onSetPending={() => {}}
          brandContext={brandContext}
          hideAddButtons
        />

        {/* Drawings list */}
        <DrawingsList
          drawings={section.drawings ?? []}
          onChange={(drawings) => onChange({ drawings })}
          brandContext={brandContext}
          selectedKey={selectedDrawingKey ?? null}
          onSelect={onSelectDrawing}
        />
        </>
        )}
      </div>

      <div className="field-section-heading">Stats strip</div>
      <FieldObjectArray<StatItem>
        label="Stats"
        description="Up to 4 key facts displayed in a strip beneath the map."
        value={section.stats}
        onChange={(stats) => onChange({ stats })}
        maxItems={4}
        addLabel="+ Add stat"
        itemTitle={(i, it) => (it.label ? `${it.value || '-'} ${it.unit || ''} · ${it.label}` : `Stat ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({ _key: nanokey(), value: '', unit: '', label: '' })}
        renderItem={(stat, update) => (
          <>
            <div className="field-row-2">
              <FieldInput
                label="Value"
                description="The number, e.g. '3.337'."
                value={stat.value}
                onChange={(value) => update({ value })}
                placeholder="3.337"
              />
              <FieldInput
                label="Unit"
                description="e.g. 'KM', 'KM/H'."
                value={stat.unit}
                onChange={(unit) => update({ unit })}
                placeholder="KM"
              />
            </div>
            <FieldInput
              label="Label"
              description="Descriptor shown below the number."
              value={stat.label}
              onChange={(label) => update({ label })}
              placeholder="Circuit length"
            />
          </>
        )}
      />
    </>
  )
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function DrawingsList({
  drawings,
  onChange,
  brandContext,
  selectedKey,
  onSelect,
}: {
  drawings: CircuitDrawing[]
  onChange: (next: CircuitDrawing[]) => void
  brandContext?: BrandContext
  selectedKey?: string | null
  onSelect?: (key: string | null) => void
}) {
  if (drawings.length === 0) return null

  const recentColors: string[] = (() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (let i = drawings.length - 1; i >= 0; i--) {
      const c = drawings[i].color
      if (!c || isBrandToken(c)) continue
      const lower = c.toLowerCase()
      if (!HEX_RE.test(lower) || seen.has(lower)) continue
      seen.add(lower)
      out.push(lower)
      if (out.length >= 8) break
    }
    return out
  })()

  const updateDrawing = (key: string, update: Partial<CircuitDrawing>) => {
    onChange(drawings.map((d) => (d._key === key ? { ...d, ...update } : d)))
  }
  const deleteDrawing = (key: string) => {
    onChange(drawings.filter((d) => d._key !== key))
  }

  return (
    <div className="map-editor-section">
      <div className="map-editor-section-label">
        Drawings
        <button
          type="button"
          className="field-btn field-btn-ghost"
          onClick={() => onChange([])}
          style={{ marginLeft: 'auto' }}
        >
          Clear all
        </button>
      </div>
      <div className="annotation-list">
        {drawings.map((d, i) => {
          const isSelected = selectedKey === d._key
          return (
            <div
              key={d._key}
              className={`annotation-card${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect?.(isSelected ? null : d._key)}
              role="button"
              tabIndex={0}
            >
              <div className="annotation-card-header">
                <span className="annotation-card-kind">Drawing</span>
                <span className="annotation-card-title">
                  {d.dash ?? 'solid'} · {String(i + 1).padStart(2, '0')}
                </span>
                <div className="annotation-card-actions">
                  <button
                    type="button"
                    className="annotation-card-delete"
                    onClick={(e) => { e.stopPropagation(); deleteDrawing(d._key); if (isSelected) onSelect?.(null) }}
                    title="Delete"
                  >×</button>
                </div>
              </div>
              {isSelected ? (
                <div className="annotation-card-body" onClick={(e) => e.stopPropagation()}>
                  <AnnotationColorField
                    value={d.color}
                    onChange={(color) => updateDrawing(d._key, { color })}
                    brandContext={brandContext}
                    recentColors={recentColors}
                  />
                  <OpacitySlider
                    value={d.opacity}
                    onChange={(opacity) => updateDrawing(d._key, { opacity })}
                  />
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Collapse the per-element overrides list to one row per unique colour, so
 * the panel scales when an admin has recoloured 20+ elements with the same
 * 3 brand colours. Order follows first-appearance in the original array.
 */
function groupOverridesByColor(
  overrides: NonNullable<SectionCircuitMap['colorOverrides']>,
): { color: string; count: number }[] {
  const buckets = new Map<string, number>()
  overrides.forEach((o) => {
    const c = o.color?.toLowerCase()
    if (!c) return
    buckets.set(c, (buckets.get(c) ?? 0) + 1)
  })
  return Array.from(buckets.entries()).map(([color, count]) => ({ color, count }))
}
