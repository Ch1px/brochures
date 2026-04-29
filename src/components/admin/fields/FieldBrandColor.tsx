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
  /** Hex like `#e10600`, a brand token like `var:accent`, or undefined. */
  value: string | undefined
  onChange: (value: string | undefined) => void
  /** Hex shown in the swatch when no value is set. */
  fallback?: string
  /** Brand context for resolving brand tokens and showing custom colors. */
  brandContext?: BrandContext
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Colour picker with brand colour swatches — used in section style overrides.
 *
 * Shows a hex picker (swatch + text input) plus a grid of brand tokens
 * (Accent, Accent hover, Background, Text, White, Black) and any custom
 * colours defined in the brochure settings.
 *
 * Clicking a brand/custom swatch stores the **token** (e.g. `var:accent`,
 * `custom:<_key>`) so the colour updates live when brochure branding changes.
 * Using the hex picker or typing a hex stores the literal hex value.
 *
 * Calls `onChange(undefined)` when cleared so the consumer can distinguish
 * "use the default" from a stored value.
 */
export function FieldBrandColor({
  label,
  description,
  value,
  onChange,
  fallback = '#e10600',
  brandContext,
}: Props) {
  const id = useId()

  // Resolve the stored value to a hex for display. If it's a brand/custom
  // token, resolve via brandContext; otherwise it's already a hex (or empty).
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

  /** Commit a raw hex value (from picker or text input). */
  function commitHex(next: string) {
    setDraft(next)
    if (next === '') {
      onChange(undefined)
      return
    }
    if (HEX_RE.test(next)) onChange(next.toLowerCase())
  }

  /** Commit a brand or custom token. */
  function commitToken(token: string) {
    onChange(token)
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
          {customColors && customColors.length > 0 ? (
            <>
              <div className="field-brand-swatches-label" style={{ marginTop: 6 }}>Custom</div>
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
            </>
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
