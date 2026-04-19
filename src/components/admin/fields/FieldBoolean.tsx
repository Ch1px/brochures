'use client'

import { useId } from 'react'

type Props = {
  label: string
  description?: string
  value: boolean | undefined
  onChange: (value: boolean) => void
}

/**
 * Boolean toggle rendered as a row with the label on the right of the checkbox,
 * since boolean fields are typically short affirmative/negative choices.
 */
export function FieldBoolean({ label, description, value, onChange }: Props) {
  const id = useId()
  return (
    <div className="field-group">
      <label className="field-boolean-row" htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          className="field-boolean-input"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="field-label field-label-inline">{label}</span>
      </label>
      {description ? <div className="field-description">{description}</div> : null}
    </div>
  )
}
