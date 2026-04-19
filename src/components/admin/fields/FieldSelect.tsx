'use client'

import { useId } from 'react'
import { FieldLabel } from './FieldLabel'

type Option = { value: string; label: string }

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  options: Option[]
}

export function FieldSelect({ label, description, value, onChange, options }: Props) {
  const id = useId()
  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <select
        id={id}
        className="field-input field-select"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldLabel>
  )
}
