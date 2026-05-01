'use client'

import { useId } from 'react'
import { FieldLabel } from './FieldLabel'
import { FieldAiAssist, type AiAssistConfig } from './FieldAiAssist'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  maxLength?: number
  aiAssist?: AiAssistConfig
}

export function FieldTextarea({
  label,
  description,
  value,
  onChange,
  rows = 3,
  placeholder,
  maxLength,
  aiAssist,
}: Props) {
  const id = useId()
  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <div className={aiAssist ? 'field-with-ai' : undefined}>
        <textarea
          id={id}
          className="field-textarea"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          maxLength={maxLength}
        />
        {aiAssist ? (
          <FieldAiAssist
            config={aiAssist}
            currentValue={value}
            onAccept={(next) => onChange(next)}
          />
        ) : null}
      </div>
    </FieldLabel>
  )
}
