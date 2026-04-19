'use client'

import { useId } from 'react'
import { FieldLabel } from './FieldLabel'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
}

export function FieldTextarea({
  label,
  description,
  value,
  onChange,
  rows = 3,
  placeholder,
  maxLength,
}: Props) {
  const id = useId()
  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <textarea
        id={id}
        className="field-textarea"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </FieldLabel>
  )
}
