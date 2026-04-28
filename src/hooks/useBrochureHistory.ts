'use client'

import { useCallback, useRef, useState } from 'react'
import type { Brochure } from '@/types/brochure'

const MAX_HISTORY = 50
const COMMIT_GAP_MS = 800

type History = {
  past: Brochure[]
  present: Brochure
  future: Brochure[]
}

/**
 * Brochure state with bounded undo/redo. Edits within COMMIT_GAP_MS of each
 * other coalesce into a single history entry — typing a sentence is one
 * undo step, not one per keystroke. Capped at MAX_HISTORY entries each side.
 */
export function useBrochureHistory(initial: Brochure) {
  const [history, setHistory] = useState<History>({
    past: [],
    present: initial,
    future: [],
  })

  // The state at the start of the current edit burst; flushed to `past`
  // after the user pauses for COMMIT_GAP_MS so rapid edits coalesce.
  const burstStartRef = useRef<Brochure | null>(null)
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushBurst = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current)
      commitTimerRef.current = null
    }
    const burstStart = burstStartRef.current
    if (burstStart === null) return
    burstStartRef.current = null
    setHistory((h) => ({
      past: [...h.past, burstStart].slice(-MAX_HISTORY),
      present: h.present,
      future: [],
    }))
  }, [])

  const setBrochure = useCallback(
    (updater: (prev: Brochure) => Brochure) => {
      setHistory((h) => {
        const next = updater(h.present)
        if (next === h.present) return h
        if (burstStartRef.current === null) {
          burstStartRef.current = h.present
        }
        return { ...h, present: next, future: [] }
      })
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current)
      commitTimerRef.current = setTimeout(flushBurst, COMMIT_GAP_MS)
    },
    [flushBurst]
  )

  const undo = useCallback(() => {
    flushBurst()
    setHistory((h) => {
      if (h.past.length === 0) return h
      const target = h.past[h.past.length - 1]
      return {
        past: h.past.slice(0, -1),
        present: target,
        future: [h.present, ...h.future].slice(0, MAX_HISTORY),
      }
    })
  }, [flushBurst])

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h
      const [target, ...rest] = h.future
      return {
        past: [...h.past, h.present].slice(-MAX_HISTORY),
        present: target,
        future: rest,
      }
    })
  }, [])

  return {
    brochure: history.present,
    setBrochure,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  }
}
