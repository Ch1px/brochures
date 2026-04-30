'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { saveBrochureAction } from '@/lib/sanity/actions'
import type { Brochure } from '@/types/brochure'

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error' | 'conflict'

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
 * Concurrent-edit guard: every save passes the last-known `_rev` to Sanity
 * via `ifRevisionID`. If another admin's save lands first the document's
 * `_rev` will have moved on, Sanity rejects with 409, and we transition
 * into `'conflict'` — autosave halts and the editor surfaces a banner so
 * the user can reload (losing in-memory edits) rather than silently
 * overwriting the other admin's work.
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

  // Latest committed _rev. Used to gate the next save with `ifRevisionID`.
  // Initialised lazily on first mount of a brochure so the very first save
  // is also guarded.
  const lastRevRef = useRef<string | undefined>(brochure?._rev)
  const inFlightRef = useRef(false)
  const pendingRef = useRef(false)
  const conflictRef = useRef(false)

  // Track latest state without retriggering the effect every render
  latestRef.current = brochure

  // Keep lastRevRef seeded with whatever the server hands us on initial
  // load. Once we start saving, we manage rev ourselves from the patch
  // response — so we only adopt a fresh server rev when the brochure id
  // changes (e.g. opening a different brochure).
  useEffect(() => {
    lastRevRef.current = brochure?._rev
    conflictRef.current = false
    setStatus('saved')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brochure?._id])

  const performSave = useCallback(async () => {
    if (conflictRef.current) return
    if (inFlightRef.current) {
      // A save is already running. Mark dirty so we run again once it
      // completes — using the freshly-returned _rev. Without this, two
      // saves could race using the same stale rev and the second would
      // 409 against ourselves.
      pendingRef.current = true
      return
    }
    const current = latestRef.current
    if (!current) return
    inFlightRef.current = true
    setStatus('saving')
    const result = await saveBrochureAction(
      current._id,
      {
        title: current.title,
        pages: current.pages,
        seo: current.seo,
        leadCapture: current.leadCapture,
        season: current.season,
        event: current.event,
        theme: current.theme,
        accentColor: current.accentColor,
        backgroundColor: current.backgroundColor,
        textColor: current.textColor,
        titleColor: current.titleColor,
        bodyColor: current.bodyColor,
        eyebrowItalic: current.eyebrowItalic,
        eyebrowTransform: current.eyebrowTransform,
        titleItalic: current.titleItalic,
        titleTransform: current.titleTransform,
        fontOverrides: current.fontOverrides,
        customColors: current.customColors,
        navColor: current.navColor,
        textureImage: current.textureImage,
        hideTexture: current.hideTexture,
        logo: current.logo,
      },
      lastRevRef.current
    )
    inFlightRef.current = false

    if (result.ok) {
      lastRevRef.current = result.rev
      setStatus('saved')
      if (pendingRef.current) {
        pendingRef.current = false
        void performSave()
      }
    } else if (result.conflict) {
      conflictRef.current = true
      pendingRef.current = false
      setStatus('conflict')
    } else {
      pendingRef.current = false
      setStatus('error')
    }
  }, [])

  // Schedule save whenever the brochure body changes
  useEffect(() => {
    if (!brochure) return
    // Skip the save on mount — the initial load isn't an edit
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    if (conflictRef.current) return
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
    brochure?.backgroundColor,
    brochure?.textColor,
    brochure?.titleColor,
    brochure?.bodyColor,
    brochure?.eyebrowItalic,
    brochure?.eyebrowTransform,
    brochure?.titleItalic,
    brochure?.titleTransform,
    JSON.stringify(brochure?.fontOverrides),
    JSON.stringify(brochure?.customColors),
    brochure?.navColor,
    JSON.stringify(brochure?.textureImage),
    brochure?.hideTexture,
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
