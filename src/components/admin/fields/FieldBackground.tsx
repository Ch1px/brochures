'use client'

import { useId } from 'react'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string | undefined) => void
}

function toHex(value: string | undefined): string {
  if (!value) return '#000000'
  const v = value.trim()
  const m6 = v.match(/^#([0-9a-f]{6})$/i)
  if (m6) return '#' + m6[1].toLowerCase()
  const m3 = v.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (m3) return ('#' + m3[1] + m3[1] + m3[2] + m3[2] + m3[3] + m3[3]).toLowerCase()
  return '#000000'
}

export function FieldBackground({ label, description, value, onChange }: Props) {
  const textId = useId()
  const colorId = useId()
  const hex = toHex(value)
  const isTransparent = (value ?? '').trim().toLowerCase() === 'transparent'

  return (
    <FieldLabel label={label} description={description} htmlFor={textId}>
      <div className="field-background-row">
        <label
          className="field-background-swatch"
          htmlFor={colorId}
          style={{ background: value || 'transparent' }}
          aria-label="Pick a colour"
        >
          {isTransparent ? <span className="field-background-swatch-none">∅</span> : null}
          <input
            id={colorId}
            type="color"
            className="field-background-color"
            value={hex}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
        <input
          id={textId}
          type="text"
          className="field-input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Theme default"
          spellCheck={false}
        />
        <button
          type="button"
          className="field-background-preset"
          onClick={() => onChange('transparent')}
          title="Set to transparent"
        >
          None
        </button>
        <button
          type="button"
          className="field-background-clear"
          onClick={() => onChange(undefined)}
          disabled={value === undefined || value === ''}
          title="Use brochure theme default"
        >
          Reset
        </button>
      </div>
    </FieldLabel>
  )
}
