'use client'

import { useEffect, useId, useState } from 'react'
import { FieldLabel } from './FieldLabel'
import {
  BRAND_TOKENS,
  isBrandToken,
  resolveColor,
  tokenLabel,
  type BrandContext,
} from '@/lib/brandColorTokens'

type Props = {
  label: string
  description?: string
  /** Hex like `#cf212a`, a brand token like `var:accent`, or undefined. */
  value: string | undefined
  onChange: (value: string | undefined) => void
  /** Hex shown in the swatch when no value is set. */
  fallback?: string
  /** Brand context for resolving brand tokens and showing custom colors. */
  brandContext?: BrandContext
  /** Callback to save the current hex as a new custom colour variable.
   *  When provided, a "+" button appears next to the custom swatches. */
  onAddCustomColor?: (name: string, hex: string) => void
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

export function FieldBrandColor({
  label,
  description,
  value,
  onChange,
  fallback = '#cf212a',
  brandContext,
  onAddCustomColor,
}: Props) {
  const id = useId()
  const [addingColor, setAddingColor] = useState(false)
  const [newColorName, setNewColorName] = useState('')

  const isToken = value ? isBrandToken(value) : false
  const resolvedValue =
    value && isToken && brandContext ? resolveColor(value, brandContext) : value
  const displayHex = resolvedValue && HEX_RE.test(resolvedValue) ? resolvedValue : ''

  const [draft, setDraft] = useState(displayHex)

  useEffect(() => {
    setDraft(displayHex)
  }, [displayHex])

  const isValid = draft === '' || HEX_RE.test(draft)
  const swatchColour = HEX_RE.test(draft) ? draft : fallback
  const isUsingDefault = !value

  function commitHex(next: string) {
    setDraft(next)
    if (next === '') {
      onChange(undefined)
      return
    }
    if (HEX_RE.test(next)) onChange(next.toLowerCase())
  }

  function commitToken(token: string) {
    onChange(token)
  }

  // Can save to palette when we have a literal hex value (not a token, not empty)
  const canSave = onAddCustomColor && value && HEX_RE.test(value) && !isToken

  function handleSaveColor() {
    if (!canSave) return
    setAddingColor(true)
    setNewColorName('')
  }

  function handleConfirmSave() {
    if (!onAddCustomColor || !value || !HEX_RE.test(value)) return
    const name = newColorName.trim() || value
    onAddCustomColor(name, value)
    setAddingColor(false)
    setNewColorName('')
  }

  const hasSwatches = !!brandContext
  const customColors = brandContext?.customColors
  const activeLabel = value && brandContext ? tokenLabel(value, brandContext) : null

  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <div className="field-color">
        <label className="field-color-swatch" htmlFor={`${id}-picker`} style={{ background: swatchColour }}>
          <input
            id={`${id}-picker`}
            type="color"
            value={swatchColour}
            onChange={(e) => commitHex(e.target.value)}
            aria-label={`${label} colour picker`}
          />
        </label>
        <input
          id={id}
          type="text"
          className="field-input field-color-hex"
          value={draft}
          onChange={(e) => commitHex(e.target.value.trim())}
          placeholder={fallback}
          spellCheck={false}
          maxLength={7}
        />
        {!isUsingDefault ? (
          <button
            type="button"
            className="field-btn field-btn-ghost field-color-reset"
            onClick={() => { setDraft(''); onChange(undefined) }}
          >
            Reset
          </button>
        ) : (
          <span className="field-color-hint">Default</span>
        )}
      </div>
      {!isValid ? (
        <div className="field-error">Use a 6-digit hex like {fallback}.</div>
      ) : null}

      {hasSwatches ? (
        <div className="field-brand-swatches">
          <div className="field-brand-swatches-label">Brand colours</div>
          <div className="field-brand-swatches-grid">
            {BRAND_TOKENS.map((t) => {
              const resolved = t.resolve(brandContext)
              const isActive = value === t.token
              return (
                <button
                  key={t.token}
                  type="button"
                  className={`field-brand-swatch${isActive ? ' active' : ''}`}
                  style={{ background: resolved }}
                  title={`${t.label} (${resolved})`}
                  onClick={() => commitToken(t.token)}
                  aria-label={`Apply ${t.label}`}
                />
              )
            })}
          </div>
          <div className="field-brand-swatches-label" style={{ marginTop: 6 }}>
            Custom
            {canSave && !addingColor ? (
              <button
                type="button"
                className="field-brand-save-btn"
                onClick={handleSaveColor}
                title="Save current colour to palette"
              >
                + Save to palette
              </button>
            ) : null}
          </div>
          {customColors && customColors.length > 0 ? (
            <div className="field-brand-swatches-grid">
              {customColors.map((c) => {
                const token = `custom:${c._key}`
                const isActive = value === token
                return (
                  <button
                    key={c._key}
                    type="button"
                    className={`field-brand-swatch${isActive ? ' active' : ''}`}
                    style={{ background: c.hex }}
                    title={`${c.name} (${c.hex})`}
                    onClick={() => commitToken(token)}
                    aria-label={`Apply ${c.name}`}
                  />
                )
              })}
            </div>
          ) : null}
          {addingColor ? (
            <div className="field-brand-save-row">
              <span className="field-brand-swatch" style={{ background: value!, flexShrink: 0 }} />
              <input
                type="text"
                className="field-input"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Colour name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleConfirmSave() }
                  if (e.key === 'Escape') setAddingColor(false)
                }}
              />
              <button type="button" className="field-btn" onClick={handleConfirmSave}>
                Save
              </button>
              <button type="button" className="field-btn field-btn-ghost" onClick={() => setAddingColor(false)}>
                Cancel
              </button>
            </div>
          ) : null}
          {activeLabel ? (
            <div className="field-brand-swatches-active">
              Using: {activeLabel} ({displayHex})
            </div>
          ) : null}
        </div>
      ) : null}
    </FieldLabel>
  )
}
