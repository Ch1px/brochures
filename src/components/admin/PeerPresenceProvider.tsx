'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import { useOthersMapped, useUpdateMyPresence } from '@/lib/liveblocks'
import {
  PeerPresenceContextProvider,
  type PeerInfo,
  type PeerSelections,
} from './PeerPresenceContext'

type Props = {
  /** The local user's currently-selected section. Broadcast to peers
   *  so their PagesPanel / PreviewStage can highlight it. */
  selectedSectionKey: string | null
  /** `_key` of the page the local user is viewing. Broadcast so peer
   *  cursors only render for users on the same page. */
  currentPageKey: string | null
  /** When false the provider is a no-op passthrough — used in dev
   *  environments where `LIVEBLOCKS_SECRET_KEY` isn't set, so we
   *  don't call Liveblocks hooks outside a room. */
  liveblocksEnabled: boolean
  children: ReactNode
}

/**
 * Bridges Liveblocks room presence into the editor's component tree.
 *
 * - Broadcasts the local user's `selectedSectionKey` whenever it
 *   changes (debounced naturally by React effect timing).
 * - Projects peers' `selectedSectionKey` + `info` into a stable map
 *   exposed via `PeerPresenceContext`. Cursor changes from peers
 *   don't invalidate the projection (we use `useOthersMapped` with a
 *   custom equality check), so a peer waving their cursor around
 *   doesn't cause `PagesPanel` and `PreviewStage` to re-render.
 *
 * Cursor *display* lives in `OthersCursors` and consumes presence
 * directly — re-renders there are local to the cursor overlay layer
 * and don't ripple into the heavy editor surface.
 */
export function PeerPresenceProvider({ selectedSectionKey, currentPageKey, liveblocksEnabled, children }: Props) {
  if (!liveblocksEnabled) return <>{children}</>
  return (
    <Inner selectedSectionKey={selectedSectionKey} currentPageKey={currentPageKey}>
      {children}
    </Inner>
  )
}

function Inner({
  selectedSectionKey,
  currentPageKey,
  children,
}: {
  selectedSectionKey: string | null
  currentPageKey: string | null
  children: ReactNode
}) {
  const updateMyPresence = useUpdateMyPresence()

  // Broadcast our selection. The Liveblocks SDK throttles outgoing
  // updates (100ms by client config) so even if `selectedSectionKey`
  // changes rapidly we won't flood the wire.
  useEffect(() => {
    updateMyPresence({ selectedSectionKey })
  }, [selectedSectionKey, updateMyPresence])

  // Broadcast which page we're viewing. Peer cursors filter on this
  // — without it, a peer scrolling around page 2 would have their
  // cursor render in our page 1 view at the wrong semantic position.
  useEffect(() => {
    updateMyPresence({ currentPageKey })
  }, [currentPageKey, updateMyPresence])

  // Project only the fields we care about, with custom equality so
  // cursor updates don't cause this hook to re-render. `info` is
  // server-set and stable for the life of the connection, so
  // reference-equality on it is safe.
  const projected = useOthersMapped(
    (other) => ({
      id: other.id,
      key: other.presence?.selectedSectionKey ?? null,
      info: other.info,
    }),
    (a, b) => a.id === b.id && a.key === b.key && a.info === b.info,
  )

  const peerSelections: PeerSelections = useMemo(() => {
    const map: PeerSelections = {}
    for (const [, p] of projected) {
      if (!p.key || !p.info || !p.id) continue
      const peer: PeerInfo = {
        id: p.id,
        name: p.info.name,
        color: p.info.color,
        avatarUrl: p.info.avatarUrl,
      }
      const list = map[p.key]
      if (list) list.push(peer)
      else map[p.key] = [peer]
    }
    return map
  }, [projected])

  return (
    <PeerPresenceContextProvider value={peerSelections}>
      {children}
    </PeerPresenceContextProvider>
  )
}
