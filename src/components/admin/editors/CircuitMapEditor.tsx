'use client'

import { useRef, useState } from 'react'
import type { AnnotationKind, SectionCircuitMap, StatItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { themeCircuitSvg } from '@/lib/themeCircuitSvg'
import { FieldInput, FieldTextarea, FieldRichText, FieldObjectArray, FieldLabel } from '../fields'
import { AnnotationEditor } from './AnnotationEditor'

type Props = {
  section: SectionCircuitMap
  onChange: (update: Partial<SectionCircuitMap>) => void
  accentColor?: string
  mapEditMode?: boolean
  onMapEditModeChange?: (on: boolean) => void
  recolorMode?: boolean
  onRecolorModeChange?: (next: boolean) => void
  onPickByColor?: (color: string) => void
  selectedAnnotationKey?: string | null
  onSelectAnnotation?: (key: string | null) => void
  pendingAnnotationKind?: AnnotationKind | null
  onSetPendingAnnotation?: (kind: AnnotationKind | null) => void
}

export function CircuitMapEditor({
  section,
  onChange,
  accentColor,
  mapEditMode = false,
  onMapEditModeChange,
  recolorMode = false,
  onRecolorModeChange,
  onPickByColor,
  selectedAnnotationKey,
  onSelectAnnotation,
  pendingAnnotationKind,
  onSetPendingAnnotation,
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
      <FieldInput
        label="Eyebrow"
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldInput
        label="Title"
        description="Circuit name, e.g. “Circuit de Monaco”."
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldRichText
        label="Caption"
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        rows={2}
      />

      <FieldLabel
        label="Circuit SVG"
        description="Upload an SVG and the palette is auto-remapped to the brochure theme (brand red + whites). You can also paste the themed XML directly into the textarea below."
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

      {/* ── Map Editor: unified recolour + annotations ── */}
      <div className="map-editor">
        <button
          type="button"
          className={`map-editor-toggle${mapEditMode ? ' active' : ''}`}
          onClick={() => onMapEditModeChange?.(!mapEditMode)}
          disabled={!hasOriginal}
        >
          {mapEditMode ? 'Exit map editor' : 'Edit map'}
        </button>
        {!hasOriginal ? (
          <span className="field-color-hint" style={{ marginTop: 4, display: 'block' }}>Upload an SVG to enable</span>
        ) : null}

        {mapEditMode ? (
        <>
        <div className="map-editor-header">
          <span className="field-label-description">
            {pendingAnnotationKind
              ? `Click the map to place a ${pendingAnnotationKind}`
              : 'Click circuit elements to recolour, or add annotations below'}
          </span>
        </div>

        {/* Tool bar — annotation placement tools */}
        <div className="map-editor-toolbar">
          <button
            type="button"
            className={`map-editor-tool${pendingAnnotationKind === 'text' ? ' active' : ''}`}
            onClick={() => { onSetPendingAnnotation?.(pendingAnnotationKind === 'text' ? null : 'text'); onRecolorModeChange?.(false) }}
            title="Click map to place text"
          >
            + Text
          </button>
          <button
            type="button"
            className={`map-editor-tool${pendingAnnotationKind === 'pin' ? ' active' : ''}`}
            onClick={() => { onSetPendingAnnotation?.(pendingAnnotationKind === 'pin' ? null : 'pin'); onRecolorModeChange?.(false) }}
            title="Click map to place pin"
          >
            + Pin
          </button>
          <button
            type="button"
            className={`map-editor-tool${pendingAnnotationKind === 'image' ? ' active' : ''}`}
            onClick={() => { onSetPendingAnnotation?.(pendingAnnotationKind === 'image' ? null : 'image'); onRecolorModeChange?.(false) }}
            title="Click map to place image"
          >
            + Image
          </button>
          <button
            type="button"
            className={`map-editor-tool${pendingAnnotationKind === 'svg' ? ' active' : ''}`}
            onClick={() => { onSetPendingAnnotation?.(pendingAnnotationKind === 'svg' ? null : 'svg'); onRecolorModeChange?.(false) }}
            title="Click map to place SVG"
          >
            + SVG
          </button>
          <div className="map-editor-tool-divider" />
          <button
            type="button"
            className={`map-editor-tool${pendingAnnotationKind === 'draw' ? ' active' : ''}`}
            onClick={() => { onSetPendingAnnotation?.(pendingAnnotationKind === 'draw' ? null : 'draw'); onRecolorModeChange?.(false) }}
            title="Freehand draw on the map"
          >
            Draw
          </button>
        </div>

        {pendingAnnotationKind === 'draw' ? (
          <div className="map-editor-draw-settings">
            <span className="field-label-description">Draw on the map. Release to finish.</span>
          </div>
        ) : null}

        {/* Colour overrides list */}
        {overrides.length > 0 ? (
          <div className="map-editor-section">
            <div className="map-editor-section-label">Colour overrides</div>
            <ul className="recolor-overrides-list">
              {groupOverridesByColor(overrides).map((group) => (
                <li key={group.color} className="recolor-overrides-item">
                  <button
                    type="button"
                    className="recolor-overrides-swatch is-button"
                    style={{ background: group.color }}
                    onClick={() => onPickByColor?.(group.color)}
                    title={`Select ${group.count} element${group.count > 1 ? 's' : ''} using ${group.color}`}
                    aria-label={`Select elements using ${group.color}`}
                  />
                  <span className="recolor-overrides-hex">{group.color}</span>
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
              ))}
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
          pendingKind={pendingAnnotationKind ?? null}
          onSetPending={onSetPendingAnnotation ?? (() => {})}
          hideAddButtons
        />
        </>
        ) : null}
      </div>

      <FieldObjectArray<StatItem>
        label="Stats"
        description="Up to 4 stats show beneath the map."
        value={section.stats}
        onChange={(stats) => onChange({ stats })}
        maxItems={4}
        addLabel="+ Add stat"
        itemTitle={(i, it) => (it.label ? it.label : `Stat ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({ _key: nanokey(), value: '', unit: '', label: '' })}
        renderItem={(stat, update) => (
          <>
            <FieldInput
              label="Value"
              value={stat.value}
              onChange={(value) => update({ value })}
            />
            <FieldInput
              label="Unit"
              value={stat.unit}
              onChange={(unit) => update({ unit })}
            />
            <FieldInput
              label="Label"
              value={stat.label}
              onChange={(label) => update({ label })}
            />
          </>
        )}
      />
    </>
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
