'use client'

import { createContext, useContext } from 'react'

/**
 * Lightweight, per-section peer info consumed by `PagesPanel` and
 * `PreviewStage` to decorate sections that another admin currently
 * has selected in their properties panel.
 *
 * Identity fields mirror the server-signed `userInfo` from the
 * Liveblocks token — peers can't spoof these.
 */
export type PeerInfo = {
  /** Clerk user id; the same person across multiple tabs collapses
   *  to a single entry here. */
  id: string
  name: string
  color: string
  avatarUrl: string | null
}

/** Map of brochure section `_key` → peers that currently have that
 *  section selected. Multiple peers per section are allowed (rare but
 *  legal — happens when two admins both click into the same section
 *  before either edits anything). */
export type PeerSelections = Record<string, PeerInfo[]>

/**
 * Default value is an empty map so consumers (`usePeerSelections()`)
 * Just Work outside a Liveblocks room — used in dev environments
 * without `LIVEBLOCKS_SECRET_KEY` and as a safe fallback if the
 * provider ever fails to mount.
 */
const PeerPresenceCtx = createContext<PeerSelections>({})

export const PeerPresenceContextProvider = PeerPresenceCtx.Provider

export function usePeerSelections(): PeerSelections {
  return useContext(PeerPresenceCtx)
}

/** Convenience: peers (if any) that currently have a given section
 *  selected. Returns an empty array when nobody is on that section
 *  or when peer presence isn't wired up at all. */
export function usePeersOnSection(sectionKey: string | null): PeerInfo[] {
  const map = useContext(PeerPresenceCtx)
  if (!sectionKey) return EMPTY
  return map[sectionKey] ?? EMPTY
}

const EMPTY: PeerInfo[] = []
