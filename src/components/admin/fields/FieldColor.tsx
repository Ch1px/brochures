'use client'

import { useEffect, useId, useState } from 'react'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  description?: string
  /** Hex like `#e10600`. Empty string / undefined means "use platform default". */
  value: string | undefined
  onChange: (value: string | undefined) => void
  /** Hex shown in the swatch when no value is set. Defaults to the platform brand red. */
  fallback?: string
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Hex colour picker — native colour input + text input, kept in sync.
 *
 * Calls `onChange(undefined)` when cleared so the consumer can distinguish
 * "use the default" from a stored hex value.
 */
export function FieldColor({ label, description, value, onChange, fallback = '#e10600' }: Props) {
  const id = useId()
  const [draft, setDraft] = useState(value ?? '')

  // Re-seed local draft if the upstream value changes (e.g. modal re-open).
  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  const isValid = draft === '' || HEX_RE.test(draft)
  const swatchColour = HEX_RE.test(draft) ? draft : fallback
  const isUsingDefault = draft === ''

  function commit(next: string) {
    setDraft(next)
    if (next === '') {
      onChange(undefined)
      return
    }
    if (HEX_RE.test(next)) onChange(next.toLowerCase())
  }

  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <div className="field-color">
        <label className="field-color-swatch" htmlFor={`${id}-picker`} style={{ background: swatchColour }}>
          <input
            id={`${id}-picker`}
            type="color"
            value={swatchColour}
            onChange={(e) => commit(e.target.value)}
            aria-label={`${label} colour picker`}
          />
        </label>
        <input
          id={id}
          type="text"
          className="field-input field-color-hex"
          value={draft}
          onChange={(e) => commit(e.target.value.trim())}
          placeholder={fallback}
          spellCheck={false}
          maxLength={7}
        />
        {!isUsingDefault ? (
          <button
            type="button"
            className="field-btn field-btn-ghost field-color-reset"
            onClick={() => commit('')}
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
    </FieldLabel>
  )
}
