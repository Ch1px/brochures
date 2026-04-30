'use client'

import { useEffect, useState, type RefObject } from 'react'
import { useOthers, useUpdateMyPresence } from '@/lib/liveblocks'

type Props = {
  /** Ref to `.preview-stage-frame`. Cursor coordinates are normalised
   *  against the frame's *scroll-content* dimensions so peers with
   *  different viewport sizes render the cursor at the same semantic
   *  position. */
  frameRef: RefObject<HTMLDivElement | null>
  /** `_key` of the page the local user is viewing. Peer cursors are
   *  only rendered when the peer's `presence.currentPageKey` matches
   *  this — otherwise their (page-1-relative) coords would render
   *  ghost-like over our (page-2) content. */
  currentPageKey: string | null
  /** `_key` of the section the local user has selected, or `null` if
   *  none. Peer cursors are dimmed (not hidden) when the peer's
   *  `selectedSectionKey` differs from this — keeps awareness of
   *  what peers are doing without their cursor competing for
   *  attention while you're focused on a different section. */
  currentSectionKey: string | null
}

/**
 * Figma-style live cursors over the preview stage.
 *
 * Two responsibilities:
 *   1. Listens for `mousemove` on the frame and broadcasts the local
 *      cursor's normalised position via `useUpdateMyPresence`.
 *   2. Reads `useOthers()` and renders one cursor pill per peer whose
 *      `presence.cursor` is non-null.
 *
 * Lives as a child of `.preview-stage-frame` so it scrolls with
 * brochure content — peer cursors over a section that's offscreen
 * stay attached to that section instead of floating over the
 * viewport.
 *
 * No throttling here beyond the SDK's 100ms outgoing-update throttle
 * (set in `lib/liveblocks.ts`). For 2–3 peers this is fine; if we
 * ever scale up we'd add a `requestAnimationFrame` guard.
 */
export function OthersCursors({ frameRef, currentPageKey, currentSectionKey }: Props) {
  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()

  // Track scroll-content dimensions so peer cursors stay correctly
  // positioned when our own viewport resizes or when the brochure
  // page grows / shrinks. ResizeObserver fires on element resize,
  // MutationObserver on subtree changes — together they cover the
  // common cases without polling.
  const [bounds, setBounds] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const update = () => setBounds({ w: frame.scrollWidth, h: frame.scrollHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(frame)
    const mo = new MutationObserver(update)
    mo.observe(frame, { childList: true, subtree: true, attributes: false })
    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [frameRef])

  // Broadcast local cursor position, normalised to the same scroll-
  // content space the renderer denormalises against. Setting cursor
  // to `null` on leave / unmount keeps a frozen cursor from haunting
  // peers' screens after we navigate away.
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const onMove = (e: MouseEvent) => {
      const rect = frame.getBoundingClientRect()
      const w = frame.scrollWidth
      const h = frame.scrollHeight
      if (w === 0 || h === 0) return
      const x = (e.clientX - rect.left + frame.scrollLeft) / w
      const y = (e.clientY - rect.top + frame.scrollTop) / h
      // Defensively clamp — getBoundingClientRect is viewport-relative
      // so a fast swipe outside the frame can still produce one stray
      // event before mouseleave fires.
      if (x < 0 || x > 1 || y < 0 || y > 1) return
      updateMyPresence({ cursor: { x, y } })
    }
    const onLeave = () => updateMyPresence({ cursor: null })
    frame.addEventListener('mousemove', onMove)
    frame.addEventListener('mouseleave', onLeave)
    return () => {
      frame.removeEventListener('mousemove', onMove)
      frame.removeEventListener('mouseleave', onLeave)
      updateMyPresence({ cursor: null })
    }
  }, [frameRef, updateMyPresence])

  if (!bounds) return null

  return (
    <div className="preview-cursors-layer" aria-hidden>
      {others.map((other) => {
        const cursor = other.presence?.cursor
        if (!cursor) return null
        // Hide peer cursors when they're viewing a different page —
        // their normalised coords belong to a different content space
        // and would render over our content at the wrong position.
        // A null `currentPageKey` (peer hasn't broadcast it yet, e.g.
        // mid-handshake) is treated as "unknown page" and hidden too.
        const peerPage = other.presence?.currentPageKey ?? null
        if (!peerPage || peerPage !== currentPageKey) return null
        // Dim (don't hide) peers whose selected section differs from
        // ours. Both-null counts as equal: when neither user has
        // committed to a section, we're both browsing and full
        // awareness is welcome. Strict equality on the keys keeps
        // co-editors of the same section at full brightness.
        const peerSection = other.presence?.selectedSectionKey ?? null
        const dim = peerSection !== currentSectionKey
        const name = other.info?.name ?? 'Admin'
        const color = other.info?.color ?? '#888'
        return (
          <PeerCursor
            key={other.connectionId}
            x={cursor.x * bounds.w}
            y={cursor.y * bounds.h}
            name={name}
            color={color}
            dim={dim}
          />
        )
      })}
    </div>
  )
}

function PeerCursor({
  x,
  y,
  name,
  color,
  dim,
}: {
  x: number
  y: number
  name: string
  color: string
  dim: boolean
}) {
  return (
    <div
      className={`preview-cursor${dim ? ' dim' : ''}`}
      style={{ transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      <svg
        className="preview-cursor-arrow"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill={color}
        aria-hidden
      >
        <path
          d="M3 2 L17 9.5 L10 11 L8.5 18 Z"
          stroke="white"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
      <span className="preview-cursor-pill" style={{ background: color }}>
        {name}
      </span>
    </div>
  )
}
