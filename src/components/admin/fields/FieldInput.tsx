'use client'

import { useId } from 'react'
import { FieldLabel } from './FieldLabel'
import { FieldAiAssist, type AiAssistConfig } from './FieldAiAssist'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  maxLength?: number
  aiAssist?: AiAssistConfig
}

export function FieldInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  maxLength,
  aiAssist,
}: Props) {
  const id = useId()
  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <div className={aiAssist ? 'field-with-ai' : undefined}>
        <input
          id={id}
          type="text"
          className="field-input"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
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
