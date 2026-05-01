'use client'

import { useCallback, useState } from 'react'
import { generateFieldAction } from '@/lib/sanity/actions'
import { useAiAssistContext } from '@/components/admin/AiAssistProvider'
import type { Section } from '@/types/brochure'

type Status = 'idle' | 'generating' | 'ready' | 'error'

type Args = {
  field: string
  sectionType?: string
  sectionContext?: Section | null
  currentValue?: string
}

type Result = {
  enabled: boolean
  status: Status
  suggestion: string | null
  error: string | null
  generate: (hint?: string) => Promise<void>
  accept: () => string | null
  reject: () => void
  reset: () => void
}

/**
 * Per-field AI assist state machine. Wraps generateFieldAction with idle →
 * generating → ready/error transitions and lets the caller wire Accept/Reject.
 *
 * The actual `onChange` is the caller's responsibility — `accept()` returns
 * the suggestion string and clears local state; the caller passes it to the
 * field's onChange.
 */
export function useAiAssist(args: Args): Result {
  const ctx = useAiAssistContext()
  const [status, setStatus] = useState<Status>('idle')
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStatus('idle')
    setSuggestion(null)
    setError(null)
  }, [])

  const generate = useCallback(
    async (hint?: string) => {
      if (!ctx.enabled || !ctx.brief) return
      setStatus('generating')
      setError(null)
      setSuggestion(null)
      try {
        const res = await generateFieldAction({
          brochureId: ctx.brochureId,
          brief: ctx.brief,
          field: args.field,
          sectionType: args.sectionType,
          sectionContext: args.sectionContext ?? undefined,
          currentValue: args.currentValue,
          hint,
        })
        if (res.ok) {
          setSuggestion(res.value)
          setStatus('ready')
        } else {
          setError(res.error)
          setStatus('error')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed')
        setStatus('error')
      }
    },
    [ctx.enabled, ctx.brief, ctx.brochureId, args.field, args.sectionType, args.sectionContext, args.currentValue]
  )

  const accept = useCallback((): string | null => {
    const value = suggestion
    reset()
    return value
  }, [suggestion, reset])

  const reject = useCallback(() => {
    reset()
  }, [reset])

  return {
    enabled: ctx.enabled,
    status,
    suggestion,
    error,
    generate,
    accept,
    reject,
    reset,
  }
}
