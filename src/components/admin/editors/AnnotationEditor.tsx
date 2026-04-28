'use client'

import { useRef } from 'react'
import type { Annotation, AnnotationKind, SectionCircuitMap } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FONT_PALETTE, weightOptionsForRole } from '@/lib/fontPalette'
import { BRAND_TOKENS, isBrandToken, resolveColor, tokenLabel, type BrandContext } from '@/lib/brandColorTokens'
import { useBrochureBranding } from '../../brochure/BrochureContext'
import { FieldInput, FieldSelect, FieldColor, FieldImage, FieldTextarea } from '../fields'

type Props = {
  annotations: Annotation[]
  onChange: (update: Partial<SectionCircuitMap>) => void
  selectedKey: string | null
  onSelect: (key: string | null) => void
  pendingKind: AnnotationKind | null
  onSetPending: (kind: AnnotationKind | null) => void
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

function weightOptionsForFont(slug?: string): { value: string; label: string }[] {
  const opts = weightOptionsForRole('body', slug)
  // For annotations, default is "Regular (400)" not role-based
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
  hideAddButtons,
}: Props) {
  function addAnnotation(kind: AnnotationKind) {
    onSetPending(kind)
  }

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
    const clone = { ...JSON.parse(JSON.stringify(src)), _key: nanokey(), x: Math.min(100, src.x + 3), y: Math.min(100, src.y + 3) } as Annotation
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
                        <FieldInput
                          label="Width (cqi)"
                          description="Set a fixed width for text wrapping. Leave empty for auto-width."
                          value={String((selected as Annotation & { kind: 'text' }).width ?? '')}
                          onChange={(v) => updateAnnotation(a._key, { width: v ? Number(v) : undefined } as Partial<Annotation>)}
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
                        <FieldInput
                          label="Width (cqi)"
                          description="Width in container query units. Default: 10"
                          value={String((selected as Annotation & { kind: 'image' }).width ?? '')}
                          onChange={(v) => updateAnnotation(a._key, { width: v ? Number(v) : undefined } as Partial<Annotation>)}
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
                    />
                    <FieldInput
                      label="Scale"
                      description="0.25 to 4. Default: 1"
                      value={String(selected.scale ?? '')}
                      onChange={(v) => {
                        const n = v ? Math.min(4, Math.max(0.25, Number(v))) : undefined
                        updateAnnotation(a._key, { scale: n })
                      }}
                    />
                    <FieldInput
                      label="Rotation (°)"
                      description="0 to 360"
                      value={String(selected.rotation ?? '')}
                      onChange={(v) => updateAnnotation(a._key, { rotation: v ? Number(v) : undefined })}
                    />
                    <FieldInput
                      label="Opacity"
                      description="0 (invisible) to 1 (fully visible). Default: 1"
                      value={String(selected.opacity ?? '')}
                      onChange={(v) => {
                        const n = v ? Math.min(1, Math.max(0, Number(v))) : undefined
                        updateAnnotation(a._key, { opacity: n })
                      }}
                    />
                    <div className="annotation-card-coords">
                      <FieldInput
                        label="X %"
                        value={String(Math.round(selected.x * 100) / 100)}
                        onChange={(v) => updateAnnotation(a._key, { x: Number(v) || 0 })}
                      />
                      <FieldInput
                        label="Y %"
                        value={String(Math.round(selected.y * 100) / 100)}
                        onChange={(v) => updateAnnotation(a._key, { y: Number(v) || 0 })}
                      />
                    </div>
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
    <>
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
      {a.svgText ? (
        <FieldTextarea
          label="SVG markup"
          description="Raw SVG XML. Colour is applied via CSS currentColor."
          value={a.svgText}
          onChange={(svgText) => onUpdate({ svgText })}
          rows={3}
        />
      ) : null}
      <FieldInput
        label="Width (cqi)"
        description="Width in container query units. Default: 6"
        value={String(a.width ?? '')}
        onChange={(v) => onUpdate({ width: v ? Number(v) : undefined })}
      />
    </>
  )
}

function AnnotationColorField({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (color: string | undefined) => void
}) {
  const { accentColor, backgroundColor, textColor, customColors, theme } = useBrochureBranding()
  const brandCtx: BrandContext = { accentColor, backgroundColor, textColor, theme, customColors }
  const isToken = value ? isBrandToken(value) : false
  const resolved = value && isToken ? resolveColor(value, brandCtx) : value

  return (
    <div className="annotation-color-field">
      <div className="annotation-color-field-label">
        <span className="field-label-text">Colour</span>
        {isToken ? (
          <span className="annotation-color-token-badge">{tokenLabel(value!, brandCtx) ?? value}</span>
        ) : null}
      </div>
      <div className="annotation-brand-swatches">
        {BRAND_TOKENS.map((t) => {
          const hex = t.resolve(brandCtx)
          const isActive = value === t.token
          return (
            <button
              key={t.token}
              type="button"
              className={`annotation-brand-swatch${isActive ? ' active' : ''}`}
              style={{ background: hex }}
              title={`${t.label} (${hex})`}
              onClick={() => onChange(t.token)}
            />
          )
        })}
        {(customColors ?? []).map((c) => {
          const token = `custom:${c._key}`
          const isActive = value === token
          return (
            <button
              key={c._key}
              type="button"
              className={`annotation-brand-swatch${isActive ? ' active' : ''}`}
              style={{ background: c.hex }}
              title={`${c.name} (${c.hex})`}
              onClick={() => onChange(token)}
            />
          )
        })}
      </div>
      <FieldColor
        label=""
        description="Or pick a custom colour"
        value={resolved}
        onChange={onChange}
      />
    </div>
  )
}
