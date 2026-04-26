'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveBrochureAction } from '@/lib/sanity/actions'
import type { Brochure } from '@/types/brochure'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

type Options = {
  /** Debounce window in ms before firing a save (default 1000). */
  debounceMs?: number
}

/**
 * Autosave hook for the brochure editor.
 *
 * Subscribes to the brochure state; whenever editable fields change, it
 * schedules a debounced save via the server action. Save state is exposed
 * so the topbar can show a "Saved · Saving · Unsaved" indicator.
 *
 * Usage:
 *   const { status, flushNow } = useAutosave(brochure)
 */
export function useAutosave(brochure: Brochure | null, options: Options = {}) {
  const { debounceMs = 1000 } = options
  const [status, setStatus] = useState<SaveStatus>('saved')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRef = useRef<Brochure | null>(brochure)
  const firstRunRef = useRef(true)

  // Track latest state without retriggering the effect every render
  latestRef.current = brochure

  const performSave = useCallback(async () => {
    const current = latestRef.current
    if (!current) return
    setStatus('saving')
    const result = await saveBrochureAction(current._id, {
      title: current.title,
      pages: current.pages,
      seo: current.seo,
      leadCapture: current.leadCapture,
      season: current.season,
      event: current.event,
      theme: current.theme,
      accentColor: current.accentColor,
      logo: current.logo,
    })
    setStatus(result.ok ? 'saved' : 'error')
  }, [])

  // Schedule save whenever the brochure body changes
  useEffect(() => {
    if (!brochure) return
    // Skip the save on mount — the initial load isn't an edit
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    setStatus('unsaved')
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void performSave()
    }, debounceMs)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // We intentionally serialize the edit-relevant fields so the effect
    // only fires when content changes, not on referential changes of
    // unrelated props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    brochure?._id,
    brochure?.title,
    JSON.stringify(brochure?.pages),
    JSON.stringify(brochure?.seo),
    JSON.stringify(brochure?.leadCapture),
    brochure?.season,
    brochure?.event,
    brochure?.theme,
    brochure?.accentColor,
    JSON.stringify(brochure?.logo),
    debounceMs,
    performSave,
  ])

  // Warn the user if they try to close the tab while a save is pending
  useEffect(() => {
    if (status === 'saved') return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [status])

  /** Force an immediate save, bypassing the debounce. */
  const flushNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    await performSave()
  }, [performSave])

  return { status, flushNow }
}
