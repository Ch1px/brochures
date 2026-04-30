'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BRAND_TOKENS,
  isBrandToken,
  resolveColor,
  tokenLabel,
  type BrandContext,
} from '@/lib/brandColorTokens'

type Option = { value: string; label: string }

export type SelectEntry = {
  kind: 'select'
  key: string
  label: string
  icon?: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  options: Option[]
}

export type ColorEntry = {
  kind: 'color'
  key: string
  label: string
  icon?: string
  description?: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  fallback?: string
}

export type ToggleEntry = {
  kind: 'toggle'
  key: string
  label: string
  icon?: string
  value: boolean | undefined
  onChange: (value: boolean | undefined) => void
}

export type StyleEntry = SelectEntry | ColorEntry | ToggleEntry

type Props = {
  entries: StyleEntry[]
  brandContext?: BrandContext
  onAddCustomColor?: (name: string, hex: string) => void
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Compact list of style rows. Two row kinds:
 *   - 'select' renders an inline native <select>.
 *   - 'color'  renders a swatch + value text and opens a popover with the
 *              full picker (brand swatches, custom palette, hex input).
 *
 * Used by SectionStylesEditor to render the Colours, Layout, Images, and
 * Foreground image groups with consistent visual chrome.
 */
export function FieldStyleList({ entries, brandContext, onAddCustomColor }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  const rowRefs = useRef<Record<string, HTMLElement | null>>({})

  const openEntry = entries.find(
    (e) => e.kind === 'color' && e.key === openKey,
  ) as ColorEntry | undefined

  const handleOpen = (key: string) => {
    const el = rowRefs.current[key]
    if (!el) return
    const rect = el.getBoundingClientRect()
    setAnchor({ x: rect.right + 6, y: rect.top })
    setOpenKey(key)
  }

  const handleClose = () => {
    setOpenKey(null)
    setAnchor(null)
  }

  return (
    <div className="brand-color-list-wrapper">
      <div className="brand-color-list">
        {entries.map((e) => {
          if (e.kind === 'select') {
            return (
              <div
                key={e.key}
                ref={(el) => {
                  rowRefs.current[e.key] = el
                }}
                className="brand-color-list-row brand-color-list-row-static"
              >
                <span className="brand-color-list-icon" aria-hidden="true">{e.icon ?? '•'}</span>
                <span className="brand-color-list-label">{e.label}</span>
                <span className="brand-color-list-value">
                  <select
                    className="scale-row-select"
                    value={e.value ?? ''}
                    onChange={(ev) => e.onChange(ev.target.value || undefined)}
                    aria-label={e.label}
                  >
                    {e.options.map((o) => (
                      <option key={o.value || 'default'} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </span>
              </div>
            )
          }

          if (e.kind === 'toggle') {
            return (
              <label
                key={e.key}
                ref={(el) => {
                  rowRefs.current[e.key] = el
                }}
                className="brand-color-list-row brand-color-list-row-static brand-color-list-row-toggle"
              >
                <span className="brand-color-list-icon" aria-hidden="true">{e.icon ?? '•'}</span>
                <span className="brand-color-list-label">{e.label}</span>
                <span className="brand-color-list-value">
                  <input
                    type="checkbox"
                    className="brand-color-list-checkbox"
                    checked={Boolean(e.value)}
                    onChange={(ev) => e.onChange(ev.target.checked || undefined)}
                    aria-label={e.label}
                  />
                </span>
              </label>
            )
          }

          // color row
          const isToken = e.value ? isBrandToken(e.value) : false
          const resolved =
            e.value && isToken && brandContext ? resolveColor(e.value, brandContext) : e.value
          const displayHex = resolved && HEX_RE.test(resolved) ? resolved : ''
          const swatch = displayHex || e.fallback || '#cf212a'
          const isActive = openKey === e.key
          const valueText = e.value
            ? (isToken && brandContext ? tokenLabel(e.value, brandContext) ?? e.value : e.value)
            : 'Default'
          return (
            <button
              key={e.key}
              ref={(el) => {
                rowRefs.current[e.key] = el
              }}
              type="button"
              className={`brand-color-list-row${isActive ? ' open' : ''}`}
              onMouseDown={(ev) => ev.stopPropagation()}
              onClick={() => (isActive ? handleClose() : handleOpen(e.key))}
            >
              <span className="brand-color-list-icon" aria-hidden="true">{e.icon ?? '◌'}</span>
              <span className="brand-color-list-label">{e.label}</span>
              <span className="brand-color-list-value">
                <span className="brand-color-list-swatch" style={{ background: swatch }} />
                <span className="brand-color-list-text">{valueText}</span>
              </span>
            </button>
          )
        })}
      </div>

      {openEntry && anchor ? (
        <BrandColorPopover
          x={anchor.x}
          y={anchor.y}
          entry={openEntry}
          brandContext={brandContext}
          onAddCustomColor={onAddCustomColor}
          onClose={handleClose}
        />
      ) : null}
    </div>
  )
}

/* ───────────────────── Popover ───────────────────── */

type PopoverProps = {
  x: number
  y: number
  entry: ColorEntry
  brandContext?: BrandContext
  onAddCustomColor?: (name: string, hex: string) => void
  onClose: () => void
}

function BrandColorPopover({ x, y, entry, brandContext, onAddCustomColor, onClose }: PopoverProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [addingColor, setAddingColor] = useState(false)
  const [newColorName, setNewColorName] = useState('')

  const isToken = entry.value ? isBrandToken(entry.value) : false
  const resolved =
    entry.value && isToken && brandContext ? resolveColor(entry.value, brandContext) : entry.value
  const displayHex = resolved && HEX_RE.test(resolved) ? resolved : ''
  const swatchValue = displayHex || entry.fallback || '#cf212a'

  const [hexDraft, setHexDraft] = useState<string>(displayHex || (entry.fallback ?? ''))

  useEffect(() => {
    setHexDraft(displayHex || (entry.fallback ?? ''))
  }, [displayHex, entry.fallback])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (e.target instanceof Node && ref.current.contains(e.target)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDocClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDocClick)
    }
  }, [onClose])

  const POPOVER_WIDTH = 280
  const POPOVER_HEIGHT = 320
  const margin = 12
  const vw = typeof window !== 'undefined' ? window.innerWidth : POPOVER_WIDTH * 4
  const vh = typeof window !== 'undefined' ? window.innerHeight : POPOVER_HEIGHT * 4
  let clampedX = x
  if (clampedX + POPOVER_WIDTH + margin > vw) clampedX = vw - POPOVER_WIDTH - margin
  if (clampedX < margin) clampedX = margin
  const clampedY = Math.min(Math.max(margin, y), vh - POPOVER_HEIGHT - margin)

  const commitHex = (next: string) => {
    if (next === '') {
      entry.onChange(undefined)
      return
    }
    if (HEX_RE.test(next)) entry.onChange(next.toLowerCase())
  }

  const commitToken = (token: string) => {
    entry.onChange(token)
  }

  const commitHexFromDraft = () => {
    const trimmed = hexDraft.trim()
    if (trimmed === '') {
      entry.onChange(undefined)
      return
    }
    const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (HEX_RE.test(withHash)) {
      entry.onChange(withHash.toLowerCase())
    } else {
      setHexDraft(displayHex || (entry.fallback ?? ''))
    }
  }

  const customColors = brandContext?.customColors
  const activeLabel = entry.value && brandContext ? tokenLabel(entry.value, brandContext) : null
  const canSave = onAddCustomColor && entry.value && HEX_RE.test(entry.value) && !isToken

  const handleConfirmSave = () => {
    if (!onAddCustomColor || !entry.value || !HEX_RE.test(entry.value)) return
    const name = newColorName.trim() || entry.value
    onAddCustomColor(name, entry.value)
    setAddingColor(false)
    setNewColorName('')
  }

  return (
    <div
      ref={ref}
      className="recolor-popover brand-color-popover"
      style={{ left: clampedX, top: clampedY }}
      role="dialog"
      aria-label={`Edit ${entry.label}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="recolor-popover-header">
        <div className="recolor-popover-title">{entry.label}</div>
        {entry.value !== undefined ? (
          <button
            type="button"
            className="field-brand-save-btn"
            onClick={() => entry.onChange(undefined)}
            title="Reset to default"
          >
            Reset
          </button>
        ) : (
          <div className="recolor-popover-id">Default</div>
        )}
      </div>

      {entry.description ? (
        <div className="brand-color-popover-description">{entry.description}</div>
      ) : null}

      <div className="recolor-popover-picker">
        <label
          className="field-color-swatch"
          htmlFor={`bcp-${entry.key}`}
          style={{ background: swatchValue }}
        >
          <input
            id={`bcp-${entry.key}`}
            type="color"
            value={swatchValue}
            onInput={(e) => commitHex((e.target as HTMLInputElement).value)}
            onChange={(e) => commitHex(e.target.value)}
            aria-label={`${entry.label} colour picker`}
          />
        </label>
        <input
          type="text"
          className="recolor-popover-hex-input"
          value={hexDraft}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHexFromDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              commitHexFromDraft()
            } else if (e.key === 'Escape') {
              setHexDraft(displayHex || (entry.fallback ?? ''))
              ;(e.target as HTMLInputElement).blur()
            }
          }}
          spellCheck={false}
          aria-label="Hex colour value"
          placeholder={entry.fallback || '#000000'}
        />
      </div>

      {brandContext ? (
        <div className="recolor-popover-recents">
          <div className="recolor-popover-recents-label">Brand colours</div>
          <div className="recolor-popover-recents-grid">
            {BRAND_TOKENS.map((t) => {
              const r = t.resolve(brandContext)
              const isActive = entry.value === t.token
              return (
                <button
                  key={t.token}
                  type="button"
                  className={`recolor-popover-recent-swatch${isActive ? ' active' : ''}`}
                  style={{ background: r }}
                  title={`${t.label} (${r})`}
                  onClick={() => commitToken(t.token)}
                  aria-label={`Apply ${t.label}`}
                />
              )
            })}
          </div>

          <div className="recolor-popover-recents-label" style={{ marginTop: 6 }}>
            Custom
            {canSave && !addingColor ? (
              <button
                type="button"
                className="field-brand-save-btn"
                onClick={() => {
                  setAddingColor(true)
                  setNewColorName('')
                }}
                title="Save current colour to palette"
              >
                + Save to palette
              </button>
            ) : null}
          </div>

          {customColors && customColors.length > 0 ? (
            <div className="recolor-popover-recents-grid">
              {customColors.map((c) => {
                const token = `custom:${c._key}`
                const isActive = entry.value === token
                return (
                  <button
                    key={c._key}
                    type="button"
                    className={`recolor-popover-recent-swatch${isActive ? ' active' : ''}`}
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
              <span
                className="field-brand-swatch"
                style={{ background: entry.value!, flexShrink: 0 }}
              />
              <input
                type="text"
                className="field-input"
                value={newColorName}
                onChange={(e) => setNewColorName(e.target.value)}
                placeholder="Colour name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleConfirmSave()
                  }
                  if (e.key === 'Escape') setAddingColor(false)
                }}
              />
              <button type="button" className="field-btn" onClick={handleConfirmSave}>
                Save
              </button>
              <button
                type="button"
                className="field-btn field-btn-ghost"
                onClick={() => setAddingColor(false)}
              >
                Cancel
              </button>
            </div>
          ) : null}

          {activeLabel ? (
            <div className="recolor-popover-token-label">
              Using: {activeLabel} ({displayHex || swatchValue})
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="recolor-popover-actions">
        <button type="button" className="field-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  )
}
