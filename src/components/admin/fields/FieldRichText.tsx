'use client'

import { useId, useRef } from 'react'
import { FieldLabel } from './FieldLabel'
import { FieldAiAssist, type AiAssistConfig } from './FieldAiAssist'

type Props = {
  label: string
  description?: string
  value: string | undefined
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
  aiAssist?: AiAssistConfig
}

const BULLET = '- '
const BULLET_RE = /^([\t ]*)[-*]\s+/
const NUMBERED_RE = /^([\t ]*)\d+\.\s+/

export function FieldRichText({
  label,
  description,
  value,
  onChange,
  rows = 6,
  placeholder,
  aiAssist,
}: Props) {
  const id = useId()
  const ref = useRef<HTMLTextAreaElement>(null)

  const applyPrefix = (kind: 'bullet' | 'numbered') => {
    const ta = ref.current
    if (!ta) return
    const text = value ?? ''
    const start = ta.selectionStart
    const end = ta.selectionEnd

    const lineStart = text.lastIndexOf('\n', Math.max(0, start - 1)) + 1
    let lineEnd = text.indexOf('\n', end)
    if (lineEnd === -1) lineEnd = text.length

    const before = text.slice(0, lineStart)
    const block = text.slice(lineStart, lineEnd)
    const after = text.slice(lineEnd)

    const lines = block.length === 0 ? [''] : block.split('\n')
    const allBulleted = lines.every((l) => BULLET_RE.test(l))
    const allNumbered = lines.every((l) => NUMBERED_RE.test(l))

    let counter = 1
    const transformed = lines.map((line) => {
      const stripped = line.replace(BULLET_RE, '$1').replace(NUMBERED_RE, '$1')
      if (kind === 'bullet') {
        return allBulleted ? stripped : BULLET + stripped
      }
      return allNumbered ? stripped : `${counter++}. ${stripped}`
    })

    const newBlock = transformed.join('\n')
    const newValue = before + newBlock + after
    onChange(newValue)

    requestAnimationFrame(() => {
      const ta2 = ref.current
      if (!ta2) return
      const caret = before.length + newBlock.length
      ta2.focus()
      ta2.setSelectionRange(caret, caret)
    })
  }

  return (
    <FieldLabel label={label} description={description} htmlFor={id}>
      <div className="field-richtext">
        <div className="field-richtext-toolbar">
          <button
            type="button"
            className="field-richtext-btn"
            onClick={() => applyPrefix('bullet')}
            title="Bulleted list"
          >
            • List
          </button>
          <button
            type="button"
            className="field-richtext-btn"
            onClick={() => applyPrefix('numbered')}
            title="Numbered list"
          >
            1. List
          </button>
          <span className="field-richtext-hint">
            Tip: start a line with <code>- </code> for a bullet
          </span>
        </div>
        <div className={aiAssist ? 'field-with-ai' : undefined}>
          <textarea
            ref={ref}
            id={id}
            className="field-textarea"
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
          />
          {aiAssist ? (
            <FieldAiAssist
              config={aiAssist}
              currentValue={value}
              onAccept={(next) => onChange(next)}
            />
          ) : null}
        </div>
      </div>
    </FieldLabel>
  )
}
