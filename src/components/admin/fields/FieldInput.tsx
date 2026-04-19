'use client'

import { useId } from 'react'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
}

export function FieldInput({ label, description, value, onChange, placeholder, maxLength }: Props) {
  const id = useId()
  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <input
        id={id}
        type="text"
        className="field-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </FieldLabel>
  )
}
