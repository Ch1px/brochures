'use client'

import { usePeersOnSection, type PeerInfo } from './PeerPresenceContext'

/**
 * Small coloured dot rendered next to a section row in `PagesPanel`
 * when one or more peers have it selected. Hovering shows the names.
 *
 * Sits next to the `.editor-section-type` label on the section row.
 * Multiple peers on the same section produce a small horizontal
 * stack of dots (rare; we don't bother deduping by colour).
 */
export function PagesPanelPeerDot({ sectionKey }: { sectionKey: string }) {
  const peers = usePeersOnSection(sectionKey)
  if (peers.length === 0) return null
  return (
    <span
      className="peer-pages-dot-stack"
      title={peers.map((p) => p.name).join(', ')}
    >
      {peers.map((peer: PeerInfo) => (
        <span
          key={peer.id}
          className="peer-pages-dot"
          style={{ background: peer.color }}
        />
      ))}
    </span>
  )
}
