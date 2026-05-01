'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

type AiAssistBrief = {
  prompt: string
  sources?: string[]
}

type AiAssistContextValue = {
  brochureId: string
  brief: AiAssistBrief | null
  enabled: boolean
}

const AiAssistContext = createContext<AiAssistContextValue | null>(null)

type ProviderProps = {
  brochureId: string
  brief: { prompt?: string; sources?: string[] } | undefined
  /** Whether the server has ANTHROPIC_API_KEY configured. When false, all
   *  AI surfaces are gated off regardless of brief presence. */
  serverEnabled: boolean
  children: ReactNode
}

/**
 * Exposes the saved brief to per-field AI assist controls. The brief is read
 * from in-memory editor state (so live edits to the brief in the settings
 * modal take effect immediately, no Sanity round-trip needed).
 *
 * `enabled` is false when there's no brief on the doc OR when the server has
 * no Anthropic API key — sparkle buttons skip rendering rather than showing
 * an inert control.
 */
export function AiAssistProvider({ brochureId, brief, serverEnabled, children }: ProviderProps) {
  const value = useMemo<AiAssistContextValue>(() => {
    const promptTrimmed = brief?.prompt?.trim()
    const ready: AiAssistBrief | null = promptTrimmed
      ? { prompt: promptTrimmed, sources: brief?.sources }
      : null
    return {
      brochureId,
      brief: ready,
      enabled: serverEnabled && Boolean(ready),
    }
  }, [brochureId, brief?.prompt, brief?.sources, serverEnabled])

  return <AiAssistContext.Provider value={value}>{children}</AiAssistContext.Provider>
}

export function useAiAssistContext(): AiAssistContextValue {
  const ctx = useContext(AiAssistContext)
  if (!ctx) {
    return { brochureId: '', brief: null, enabled: false }
  }
  return ctx
}
