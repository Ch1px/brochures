'use client'

import { useEffect, useRef, useState } from 'react'
import type { Annotation, AnnotationKind, SectionCircuitMap } from '@/types/brochure'
import { cloneWithNewKeys, nanokey } from '@/lib/nanokey'
import { FONT_PALETTE, weightOptionsForRole } from '@/lib/fontPalette'
import { BRAND_TOKENS, isBrandToken, resolveColor, tokenLabel, type BrandContext } from '@/lib/brandColorTokens'
import { FieldInput, FieldSelect, FieldImage } from '../fields'

type Props = {
  annotations: Annotation[]
  onChange: (update: Partial<SectionCircuitMap>) => void
  selectedKey: string | null
  onSelect: (key: string | null) => void
  pendingKind: AnnotationKind | null
  onSetPending: (kind: AnnotationKind | null) => void
  brandContext?: BrandContext
  /** When true, hides the add buttons (they live in the parent toolbar instead). */
  hideAddButtons?: boolean
}

const KIND_LABELS: Record<AnnotationKind, string> = {
  text: 'Text',
  image: 'Image',
  pin: 'Pin',
  svg: 'SVG',
  draw: 'Drawing',
}

const FONT_OPTIONS = [
  { value: '', label: 'Default (Body font)' },
  ...FONT_PALETTE.map((f) => ({ value: f.slug, label: f.label })),
]

const PIN_ICON_OPTIONS = [
  { value: 'pin', label: 'Pin' },
  { value: 'flag', label: 'Flag' },
  { value: 'dot', label: 'Dot' },
  { value: 'number', label: 'Number' },
]

const HEX_RE = /^#[0-9a-fA-F]{6}$/

function weightOptionsForFont(slug?: string): { value: string; label: string }[] {
  const opts = weightOptionsForRole('body', slug)
  if (opts[0]?.value === '') {
    opts[0] = { value: '', label: 'Default (400)' }
  }
  return opts
}

function annotationTitle(a: Annotation): string {
  if (a.kind === 'text') return a.label || 'Text'
  if (a.kind === 'pin') return a.label || `Pin (${a.icon ?? 'pin'})`
  if (a.kind === 'image') return 'Image'
  if (a.kind === 'svg') return 'SVG'
  return 'Annotation'
}

export function AnnotationEditor({
  annotations,
  onChange,
  selectedKey,
  onSelect,
  pendingKind,
  onSetPending,
  brandContext,
  hideAddButtons,
}: Props) {
  function updateAnnotation(key: string, update: Partial<Annotation>) {
    onChange({
      annotations: annotations.map((a) =>
        a._key === key ? ({ ...a, ...update } as Annotation) : a,
      ),
    })
  }

  function deleteAnnotation(key: string) {
    onChange({ annotations: annotations.filter((a) => a._key !== key) })
    if (selectedKey === key) onSelect(null)
  }

  function duplicateAnnotation(key: string) {
    const src = annotations.find((a) => a._key === key)
    if (!src) return
    const clone = { ...cloneWithNewKeys(src), _key: nanokey(), x: Math.min(100, src.x + 3), y: Math.min(100, src.y + 3) } as Annotation
    const idx = annotations.findIndex((a) => a._key === key)
    const next = [...annotations]
    next.splice(idx + 1, 0, clone)
    onChange({ annotations: next })
    onSelect(clone._key)
  }

  function moveAnnotation(key: string, direction: -1 | 1) {
    const idx = annotations.findIndex((a) => a._key === key)
    if (idx < 0) return
    const targetIdx = idx + direction
    if (targetIdx < 0 || targetIdx >= annotations.length) return
    const next = [...annotations]
    const [item] = next.splice(idx, 1)
    next.splice(targetIdx, 0, item)
    onChange({ annotations: next })
  }

  const selected = annotations.find((a) => a._key === selectedKey) ?? null

  // Recent colours: unique literal hexes used by other annotations on this map,
  // most-recent first. Tokens (var:* / custom:*) are excluded — those already
  // appear under Brand / Custom.
  const recentColors: string[] = (() => {
    const seen = new Set<string>()
    const out: string[] = []
    for (let i = annotations.length - 1; i >= 0; i--) {
      const c = annotations[i].color
      if (!c || isBrandToken(c)) continue
      const lower = c.toLowerCase()
      if (!HEX_RE.test(lower) || seen.has(lower)) continue
      seen.add(lower)
      out.push(lower)
      if (out.length >= 8) break
    }
    return out
  })()

  return (
    <div className={`annotation-editor${hideAddButtons ? ' annotation-editor-embedded' : ''}`}>
      {!hideAddButtons ? (
        <>
          <div className="annotation-editor-header">
            <span className="field-label-text">Annotations</span>
            <span className="field-label-description">
              {pendingKind
                ? `Click the map to place a ${pendingKind} annotation`
                : 'Click + to add, then click the map to place'}
            </span>
          </div>
          <div className="annotation-add-row">
            <button
              type="button"
              className={`annotation-add-btn${pendingKind === 'text' ? ' active' : ''}`}
              onClick={() => onSetPending(pendingKind === 'text' ? null : 'text')}
            >
              + Text
            </button>
            <button
              type="button"
              className={`annotation-add-btn${pendingKind === 'pin' ? ' active' : ''}`}
              onClick={() => onSetPending(pendingKind === 'pin' ? null : 'pin')}
            >
              + Pin
            </button>
            <button
              type="button"
              className={`annotation-add-btn${pendingKind === 'image' ? ' active' : ''}`}
              onClick={() => onSetPending(pendingKind === 'image' ? null : 'image')}
            >
              + Image
            </button>
            <button
              type="button"
              className={`annotation-add-btn${pendingKind === 'svg' ? ' active' : ''}`}
              onClick={() => onSetPending(pendingKind === 'svg' ? null : 'svg')}
            >
              + SVG
            </button>
          </div>
        </>
      ) : null}

      {annotations.length > 0 ? (
        <div className="annotation-list">
          {annotations.map((a) => {
            const isSelected = a._key === selectedKey
            return (
              <div key={a._key} className={`annotation-card${isSelected ? ' selected' : ''}`}>
                <div className="annotation-card-header" onClick={() => onSelect(isSelected ? null : a._key)}>
                  <span className="annotation-card-kind">{KIND_LABELS[a.kind]}</span>
                  <span className="annotation-card-title">{annotationTitle(a)}</span>
                  <div className="annotation-card-actions">
                    <button
                      type="button"
                      className="annotation-card-action"
                      onClick={(e) => { e.stopPropagation(); moveAnnotation(a._key, -1) }}
                      title="Move backward (lower z-order)"
                      disabled={annotations.indexOf(a) === 0}
                    >↓</button>
                    <button
                      type="button"
                      className="annotation-card-action"
                      onClick={(e) => { e.stopPropagation(); moveAnnotation(a._key, 1) }}
                      title="Move forward (higher z-order)"
                      disabled={annotations.indexOf(a) === annotations.length - 1}
                    >↑</button>
                    <button
                      type="button"
                      className="annotation-card-action"
                      onClick={(e) => { e.stopPropagation(); duplicateAnnotation(a._key) }}
                      title="Duplicate"
                    >⧉</button>
                    <button
                      type="button"
                      className="annotation-card-delete"
                      onClick={(e) => { e.stopPropagation(); deleteAnnotation(a._key) }}
                      title="Delete"
                    >×</button>
                  </div>
                </div>
                {isSelected && selected ? (
                  <div className="annotation-card-body">
                    {/* Per-kind fields */}
                    {a.kind === 'text' ? (
                      <>
                        <FieldInput
                          label="Label"
                          value={(selected as Annotation & { kind: 'text' }).label}
                          onChange={(label) => updateAnnotation(a._key, { label } as Partial<Annotation>)}
                        />
                        <FieldSelect
                          label="Font"
                          value={(selected as Annotation & { kind: 'text' }).fontFamily ?? ''}
                          onChange={(v) => updateAnnotation(a._key, { fontFamily: v || undefined, fontWeight: undefined } as Partial<Annotation>)}
                          options={FONT_OPTIONS}
                        />
                        <FieldSelect
                          label="Font weight"
                          value={(selected as Annotation & { kind: 'text' }).fontWeight ?? ''}
                          onChange={(v) => updateAnnotation(a._key, { fontWeight: v || undefined } as Partial<Annotation>)}
                          options={weightOptionsForFont((selected as Annotation & { kind: 'text' }).fontFamily)}
                        />
                        <FieldInput
                          label="Font size (cqi)"
                          description="Container query units. Default: 2"
                          value={String((selected as Annotation & { kind: 'text' }).fontSize ?? '')}
                          onChange={(v) => updateAnnotation(a._key, { fontSize: v ? Number(v) : undefined } as Partial<Annotation>)}
                        />
                      </>
                    ) : null}
                    {a.kind === 'image' ? (
                      <>
                        <FieldImage
                          label="Image"
                          value={(selected as Annotation & { kind: 'image' }).image}
                          onChange={(image) => updateAnnotation(a._key, { image } as Partial<Annotation>)}
                        />
                        <FieldSelect
                          label="Border radius"
                          value={String((selected as Annotation & { kind: 'image' }).borderRadius ?? '')}
                          onChange={(v) => updateAnnotation(a._key, { borderRadius: v ? Number(v) : undefined } as Partial<Annotation>)}
                          options={[
                            { value: '', label: 'None (default)' },
                            { value: '4', label: 'Small' },
                            { value: '12', label: 'Medium' },
                            { value: '24', label: 'Large' },
                            { value: '50', label: 'Round' },
                          ]}
                        />
                        <FieldSelect
                          label="Greyscale"
                          value={(selected as Annotation & { kind: 'image' }).mediaGrayscale ?? ''}
                          onChange={(v) => updateAnnotation(a._key, { mediaGrayscale: (v || undefined) as 'none' | 'light' | 'medium' | 'full' | undefined } as Partial<Annotation>)}
                          options={[
                            { value: '', label: 'None (default)' },
                            { value: 'light', label: 'Light' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'full', label: 'Full' },
                          ]}
                        />
                        <FieldSelect
                          label="Blur"
                          value={(selected as Annotation & { kind: 'image' }).mediaBlur ?? ''}
                          onChange={(v) => updateAnnotation(a._key, { mediaBlur: (v || undefined) as 'none' | 'light' | 'medium' | 'strong' | undefined } as Partial<Annotation>)}
                          options={[
                            { value: '', label: 'None (default)' },
                            { value: 'light', label: 'Light' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'strong', label: 'Strong' },
                          ]}
                        />
                      </>
                    ) : null}
                    {a.kind === 'pin' ? (
                      <>
                        <FieldInput
                          label="Label"
                          value={(selected as Annotation & { kind: 'pin' }).label}
                          onChange={(label) => updateAnnotation(a._key, { label } as Partial<Annotation>)}
                        />
                        <FieldSelect
                          label="Icon"
                          value={(selected as Annotation & { kind: 'pin' }).icon ?? 'pin'}
                          onChange={(icon) => updateAnnotation(a._key, { icon } as Partial<Annotation>)}
                          options={PIN_ICON_OPTIONS}
                        />
                        {(selected as Annotation & { kind: 'pin' }).icon === 'number' ? (
                          <FieldInput
                            label="Number"
                            value={String((selected as Annotation & { kind: 'pin' }).number ?? 1)}
                            onChange={(v) => updateAnnotation(a._key, { number: Number(v) || 1 } as Partial<Annotation>)}
                          />
                        ) : null}
                      </>
                    ) : null}
                    {a.kind === 'svg' ? (
                      <SvgAnnotationFields
                        annotation={selected as Annotation & { kind: 'svg' }}
                        onUpdate={(update) => updateAnnotation(a._key, update as Partial<Annotation>)}
                      />
                    ) : null}

                    {/* Common fields */}
                    <AnnotationColorField
                      value={selected.color}
                      onChange={(color) => updateAnnotation(a._key, { color })}
                      brandContext={brandContext}
                      recentColors={recentColors}
                    />
                    <OpacitySlider
                      value={selected.opacity}
                      onChange={(opacity) => updateAnnotation(a._key, { opacity })}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function SvgAnnotationFields({
  annotation: a,
  onUpdate,
}: {
  annotation: Annotation & { kind: 'svg' }
  onUpdate: (update: Partial<Annotation & { kind: 'svg' }>) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleSvgFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.svg') && file.type !== 'image/svg+xml') return
    const text = await file.text()
    if (!text.includes('<svg')) return
    onUpdate({ svgText: text })
  }

  return (
    <div className="annotation-svg-upload">
      <button
        type="button"
        className="annotation-add-btn"
        onClick={() => fileRef.current?.click()}
        style={{ width: '100%' }}
      >
        {a.svgText ? 'Replace SVG' : 'Upload SVG'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".svg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleSvgFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}

/**
 * Opacity slider 0–100% (stored as 0–1 on the annotation).
 */
export function OpacitySlider({
  value,
  onChange,
}: {
  value: number | undefined
  onChange: (next: number | undefined) => void
}) {
  const pct = Math.round((value ?? 1) * 100)
  return (
    <div className="annotation-opacity-field">
      <div className="annotation-opacity-header">
        <span className="field-label-text">Opacity</span>
        <span className="annotation-opacity-value">{pct}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={pct}
        className="annotation-opacity-slider"
        onChange={(e) => {
          const next = Number(e.target.value) / 100
          onChange(next >= 1 ? undefined : next)
        }}
      />
    </div>
  )
}

/**
 * Inline colour control for an annotation. Shows the active swatch + a
 * "Pick…" button which opens a popover anchored to the swatch with the same
 * Recent / Brand / Custom layout as the recolour-element popover.
 */
export function AnnotationColorField({
  value,
  onChange,
  brandContext,
  recentColors,
}: {
  value: string | undefined
  onChange: (color: string | undefined) => void
  brandContext?: BrandContext
  recentColors: string[]
}) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const ctx: BrandContext = brandContext ?? {}
  const isToken = value ? isBrandToken(value) : false
  const resolved = value && isToken ? resolveColor(value, ctx) : value
  const swatchBg = resolved && HEX_RE.test(resolved) ? resolved : value && HEX_RE.test(value) ? value : 'transparent'

  function openPopover() {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) setAnchor({ x: rect.left, y: rect.bottom + 6 })
    setOpen(true)
  }

  return (
    <div className="annotation-color-field">
      <div className="annotation-color-field-label">
        <span className="field-label-text">Colour</span>
        {isToken && brandContext ? (
          <span className="annotation-color-token-badge">{tokenLabel(value!, ctx) ?? value}</span>
        ) : null}
      </div>
      <button
        ref={buttonRef}
        type="button"
        className="annotation-color-trigger"
        onClick={openPopover}
        aria-label="Pick colour"
      >
        <span className="annotation-color-trigger-swatch" style={{ background: swatchBg }} />
        <span className="annotation-color-trigger-label">
          {value ? (isToken ? (tokenLabel(value, ctx) ?? value) : value) : 'Default'}
        </span>
      </button>
      {open && anchor ? (
        <AnnotationColorPopover
          x={anchor.x}
          y={anchor.y}
          value={value}
          recentColors={recentColors}
          brandContext={ctx}
          onChange={onChange}
          onReset={() => onChange(undefined)}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  )
}

/**
 * Floating colour-picker for annotations — same layout as RecolorPopover
 * (Recent / Brand / Custom + native picker + hex input) but scoped to a
 * single annotation.
 */
function AnnotationColorPopover({
  x,
  y,
  value,
  recentColors,
  brandContext,
  onChange,
  onReset,
  onClose,
}: {
  x: number
  y: number
  value: string | undefined
  recentColors: string[]
  brandContext: BrandContext
  onChange: (color: string | undefined) => void
  onReset: () => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouseDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouseDown)
    }
  }, [onClose])

  const POPOVER_WIDTH = 280
  const POPOVER_HEIGHT = 280
  const margin = 12
  const vw = typeof window !== 'undefined' ? window.innerWidth : POPOVER_WIDTH * 4
  const vh = typeof window !== 'undefined' ? window.innerHeight : POPOVER_HEIGHT * 4
  const clampedX = Math.min(Math.max(margin, x), vw - POPOVER_WIDTH - margin)
  const clampedY = Math.min(Math.max(margin, y), vh - POPOVER_HEIGHT - margin)

  const isToken = value ? isBrandToken(value) : false
  const resolvedValue = value && isToken ? resolveColor(value, brandContext) : value
  const swatchValue = resolvedValue && HEX_RE.test(resolvedValue) ? resolvedValue : '#cf212a'

  const commit = (next: string) => {
    if (HEX_RE.test(next)) onChange(next.toLowerCase())
  }

  const [hexDraft, setHexDraft] = useState<string>(swatchValue)
  useEffect(() => {
    setHexDraft(swatchValue)
  }, [swatchValue])

  const commitHex = () => {
    const trimmed = hexDraft.trim()
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (HEX_RE.test(withHash)) {
      onChange(withHash.toLowerCase())
    } else {
      setHexDraft(swatchValue)
    }
  }

  const customColors = brandContext.customColors ?? []

  return (
    <div
      ref={ref}
      className="recolor-popover"
      style={{ position: 'fixed', left: clampedX, top: clampedY }}
      role="dialog"
      aria-label="Annotation colour"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="recolor-popover-header">
        <div className="recolor-popover-title">Colour</div>
      </div>

      <div className="recolor-popover-picker">
        <label
          className="field-color-swatch"
          htmlFor="annotation-color-popover"
          style={{ background: swatchValue }}
        >
          <input
            id="annotation-color-popover"
            type="color"
            value={swatchValue}
            onInput={(e) => commit((e.target as HTMLInputElement).value)}
            onChange={(e) => commit(e.target.value)}
            aria-label="Annotation colour picker"
          />
        </label>
        <input
          type="text"
          className="recolor-popover-hex-input"
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitHex()
            } else if (e.key === 'Escape') {
              setHexDraft(swatchValue)
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          spellCheck={false}
          aria-label="Hex colour value"
          placeholder="#000000"
        />
      </div>

      {recentColors.length > 0 ? (
        <div className="recolor-popover-recents">
          <div className="recolor-popover-recents-label">Recent</div>
          <div className="recolor-popover-recents-grid">
            {recentColors.map((c) => (
              <button
                key={c}
                type="button"
                className={`recolor-popover-recent-swatch${
                  c.toLowerCase() === swatchValue.toLowerCase() ? ' active' : ''
                }`}
                style={{ background: c }}
                title={c}
                onClick={() => onChange(c.toLowerCase())}
                aria-label={`Apply ${c}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="recolor-popover-recents">
        <div className="recolor-popover-recents-label">Brand colours</div>
        <div className="recolor-popover-recents-grid">
          {BRAND_TOKENS.map((t) => {
            const resolved = t.resolve(brandContext)
            const isActive = value === t.token
            return (
              <button
                key={t.token}
                type="button"
                className={`recolor-popover-recent-swatch${isActive ? ' active' : ''}`}
                style={{ background: resolved }}
                title={`${t.label} (${resolved})`}
                onClick={() => onChange(t.token)}
                aria-label={`Apply ${t.label}`}
              />
            )
          })}
        </div>
        {customColors.length > 0 ? (
          <>
            <div className="recolor-popover-recents-label" style={{ marginTop: 6 }}>Custom</div>
            <div className="recolor-popover-recents-grid">
              {customColors.map((c) => {
                const token = `custom:${c._key}`
                const isActive = value === token
                return (
                  <button
                    key={c._key}
                    type="button"
                    className={`recolor-popover-recent-swatch${isActive ? ' active' : ''}`}
                    style={{ background: c.hex }}
                    title={`${c.name} (${c.hex})`}
                    onClick={() => onChange(token)}
                    aria-label={`Apply ${c.name}`}
                  />
                )
              })}
            </div>
          </>
        ) : null}
        {isToken ? (
          <div className="recolor-popover-token-label">
            Using: {tokenLabel(value!, brandContext) ?? value}
          </div>
        ) : null}
      </div>

      <div className="recolor-popover-actions">
        <button
          type="button"
          className="field-btn field-btn-ghost"
          onClick={onReset}
        >
          Reset
        </button>
        <button type="button" className="field-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
