'use client'

import { useEffect, useRef, useState } from 'react'
import { BRAND_TOKENS, resolveColor, isBrandToken, tokenLabel, type BrandContext } from '@/lib/brandColorTokens'

type Props = {
  /** Click coords used as the anchor (clamped to viewport on render). */
  x: number
  y: number
  /** Currently-selected element ids. Picker applies its colour to all of them. */
  elementIds: string[]
  /** Current override colour shared by all selected elements, if uniform.
   *  Undefined means the elements have differing or no overrides. */
  value: string | undefined
  /** Default shown when no override exists yet — usually the brochure accent. */
  fallback?: string
  /** Recently-used colours from this circuit's overrides, most-recent first.
   *  Click a swatch to apply it without dialling the picker. */
  recentColors?: string[]
  /** Brand context for resolving variable tokens to current hex values. */
  brandContext?: BrandContext
  /** Live colour change. Fires on every drag of the native picker. */
  onChange: (color: string) => void
  /** Remove the override for the selected elements entirely. */
  onReset: () => void
  /** Close the popover. */
  onClose: () => void
}

const FALLBACK_DEFAULT = '#e10600'
const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Floating colour-picker for the Circuit Map recolour-mode flow.
 *
 * Persistent: stays open until Done or Escape. Clicking another recolourable
 * element updates the selection rather than closing the popover, so admins
 * can move from element to element without re-opening it. Multi-select via
 * Cmd/Ctrl/Shift-click; the chosen colour applies to every selected element.
 *
 * Picker is a controlled `<input type="color">` reading directly from the
 * `value` prop — no internal draft state — so live drags commit straight
 * through to Brochure state without sync races. Hex text input has its own
 * draft state so partial typing doesn't fire colour updates.
 */
export function RecolorPopover({
  x,
  y,
  elementIds,
  value,
  fallback,
  recentColors = [],
  brandContext,
  onChange,
  onReset,
  onClose,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  // Escape closes. Outside-click is intentionally NOT handled here — the
  // editor is the source of truth for when the popover should close, so
  // clicks elsewhere on the SVG re-target the popover instead of dismissing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Clamp to viewport so the popover doesn't overflow the screen edges.
  // Height grew with the recents strip + hex input; tune the estimate so
  // bottom-anchored clicks still get pushed up.
  const POPOVER_WIDTH = 280
  const POPOVER_HEIGHT = 240
  const margin = 12
  const vw = typeof window !== 'undefined' ? window.innerWidth : POPOVER_WIDTH * 4
  const vh = typeof window !== 'undefined' ? window.innerHeight : POPOVER_HEIGHT * 4
  const clampedX = Math.min(Math.max(margin, x), vw - POPOVER_WIDTH - margin)
  const clampedY = Math.min(Math.max(margin, y), vh - POPOVER_HEIGHT - margin)

  const isToken = value ? isBrandToken(value) : false
  const resolvedValue = value && isToken && brandContext ? resolveColor(value, brandContext) : value
  const swatchValue = resolvedValue && HEX_RE.test(resolvedValue) ? resolvedValue : fallback ?? FALLBACK_DEFAULT
  const count = elementIds.length

  const commit = (next: string) => {
    if (HEX_RE.test(next)) onChange(next.toLowerCase())
  }

  // Hex input has its own draft so partial typing ("#1a") doesn't fire the
  // change handler. We sync the draft when `value` changes externally.
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
      // Invalid input — revert draft to the current value so the field
      // shows something usable.
      setHexDraft(swatchValue)
    }
  }

  return (
    <div
      ref={ref}
      className="recolor-popover"
      style={{ left: clampedX, top: clampedY }}
      role="dialog"
      aria-label="Recolour element"
      // Stop clicks/mousedowns inside the popover from bubbling to document
      // listeners (e.g. the section-selection hitbox in the preview stage).
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="recolor-popover-header">
        <div className="recolor-popover-title">
          {count > 1 ? `Recolour ${count} elements` : 'Recolour element'}
        </div>
        <div className="recolor-popover-id">
          {count === 1 ? elementIds[0] : `${count} selected`}
        </div>
      </div>

      <div className="recolor-popover-picker">
        <label
          className="field-color-swatch"
          htmlFor="recolor-popover-color"
          style={{ background: swatchValue }}
        >
          <input
            id="recolor-popover-color"
            type="color"
            value={swatchValue}
            // Listen on input + change so live drags update the SVG immediately
            // (Firefox fires both, Chrome typically fires `change` only on
            // commit; covering both is the safe path). The input is controlled
            // entirely from the parent's value — no local draft state — so
            // every commit is the single source of truth.
            onInput={(e) => commit((e.target as HTMLInputElement).value)}
            onChange={(e) => commit(e.target.value)}
            aria-label="Element colour picker"
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

      {brandContext ? (
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
          {brandContext.customColors && brandContext.customColors.length > 0 ? (
            <>
              <div className="recolor-popover-recents-label" style={{ marginTop: 6 }}>Custom</div>
              <div className="recolor-popover-recents-grid">
                {brandContext.customColors.map((c) => {
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
      ) : null}

      <div className="recolor-popover-hint">
        Cmd/Ctrl-click another element to add it to the selection. Esc to close.
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
