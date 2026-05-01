'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, Check, X, Loader2 } from 'lucide-react'
import { useAiAssist } from '@/hooks/useAiAssist'
import type { Section } from '@/types/brochure'

export type AiAssistConfig = {
  field: string
  sectionType?: string
  sectionContext?: Section | null
}

type Props = {
  config: AiAssistConfig
  currentValue?: string
  onAccept: (next: string) => void
}

/**
 * Sparkle button + popover + suggestion preview for per-field AI assist.
 * Designed to be absolutely-positioned over the top-right of an input or
 * textarea (parent should be `position: relative`).
 *
 * Renders nothing when the brief context is unavailable (no brief saved),
 * so editors can pass `aiAssist` unconditionally.
 */
export function FieldAiAssist({ config, currentValue, onAccept }: Props) {
  const assist = useAiAssist({
    field: config.field,
    sectionType: config.sectionType,
    sectionContext: config.sectionContext,
    currentValue,
  })
  const [open, setOpen] = useState(false)
  const [hint, setHint] = useState('')
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (popoverRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!assist.enabled) return null

  const generating = assist.status === 'generating'

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="field-ai-trigger"
        onClick={() => setOpen((v) => !v)}
        title="AI assist"
        aria-label="AI assist"
        disabled={generating}
      >
        {generating ? (
          <Loader2 size={12} strokeWidth={2.2} className="field-ai-spin" />
        ) : (
          <Sparkles size={12} strokeWidth={2.2} />
        )}
      </button>

      {open ? (
        <div ref={popoverRef} className="field-ai-popover" role="dialog" aria-label="AI assist">
          <textarea
            className="field-ai-hint"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Optional hint (e.g. shorter, more sensory, mention the paddock)…"
            rows={2}
            disabled={generating}
          />
          <div className="field-ai-popover-actions">
            <button
              type="button"
              className="field-ai-btn"
              onClick={() => setOpen(false)}
              disabled={generating}
            >
              Close
            </button>
            <button
              type="button"
              className="field-ai-btn primary"
              onClick={() => assist.generate(hint.trim() || undefined)}
              disabled={generating}
            >
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
          {assist.status === 'error' && assist.error ? (
            <div className="field-ai-error">{assist.error}</div>
          ) : null}
        </div>
      ) : null}

      {assist.status === 'ready' && assist.suggestion ? (
        <div className="field-ai-suggestion" role="region" aria-label="AI suggestion">
          <div className="field-ai-suggestion-label">Suggestion</div>
          <div className="field-ai-suggestion-text">{assist.suggestion}</div>
          <div className="field-ai-suggestion-actions">
            <button
              type="button"
              className="field-ai-btn"
              onClick={() => assist.reject()}
            >
              <X size={12} strokeWidth={2.2} />
              <span>Reject</span>
            </button>
            <button
              type="button"
              className="field-ai-btn primary"
              onClick={() => {
                const value = assist.accept()
                if (value !== null) onAccept(value)
                setHint('')
              }}
            >
              <Check size={12} strokeWidth={2.2} />
              <span>Accept</span>
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
