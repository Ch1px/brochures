/**
 * Liveblocks shared types and pure helpers.
 *
 * NO imports from `@liveblocks/react` here — this module is also pulled
 * in by the server-side auth route handler, where evaluating the React
 * package fails with `createContext is not a function` because the RSC
 * bundle doesn't include it.
 *
 * Anything that needs `@liveblocks/react` (hooks, providers) lives in
 * `./liveblocks.ts` and is marked `'use client'`.
 */

/**
 * Per-user mutable state broadcast to other clients in the room.
 *
 * Identity (name, avatar, colour) lives on the server-signed
 * `userInfo` instead, so peers can't spoof their identity by mutating
 * presence — see `UserMeta` below.
 *
 * - `cursor` is normalised to (0,1) of the preview frame's
 *   *scroll-content* dimensions, not the visible viewport. This means
 *   a peer with a tall page that's scrolled past section 1 still
 *   broadcasts the correct semantic position even if the local user
 *   has a different window size. Null when the cursor leaves the
 *   preview area.
 * - `selectedSectionKey` is the brochure section the peer currently
 *   has focused in the right-hand properties panel; we render a
 *   coloured outline + name pill inside that section's preview hitbox
 *   and a coloured dot next to its row in the pages panel.
 */
export type Presence = {
  cursor: { x: number; y: number } | null
  selectedSectionKey: string | null
  /**
   * `_key` of the page the local user is currently viewing in the
   * preview stage. Used to filter peer cursors so we only render
   * them when peers are looking at the same page — without this,
   * A's cursor coords (normalised to page 1) would render at the
   * same relative position over page 2 in B's view, which is
   * misleading. Page `_key` is stable across reorderings; index is
   * not, which is why we use the key here.
   */
  currentPageKey: string | null
}

/** Document-shared storage. Empty in Tier 1 (no co-editing). */
export type Storage = Record<string, never>

/** Per-user metadata supplied by `/api/liveblocks-auth`. Read-only on
 *  the client; we trust the server to set it correctly. */
export type UserMeta = {
  id: string
  info: {
    name: string
    avatarUrl: string | null
    color: string
  }
}

/** Room events. Unused at Tier 1; reserved for future broadcast pings. */
export type RoomEvent = never

/**
 * Curated palette used to deterministically colour a peer. Picks read
 * well on both dark and light brochure themes and stay distinct from
 * `--brand-red` so cursor/selection colours don't collide with the
 * brochure's own accent.
 */
const PRESENCE_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#8b5cf6', // violet
] as const

/** Stable colour for a Clerk user id. Same input → same output across
 *  sessions, so a peer's cursor and selection outline stay one colour
 *  for a human reader rather than reshuffling per connection. */
export function colorForUser(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0
  }
  return PRESENCE_PALETTE[Math.abs(hash) % PRESENCE_PALETTE.length]
}

/** Stable room id for a brochure. Centralised so client and server
 *  agree on the format and so the auth endpoint can validate it. */
export function roomIdForBrochure(brochureId: string): string {
  return `brochure-${brochureId}`
}

/** Inverse of `roomIdForBrochure`. Returns `null` if the room id
 *  doesn't match the expected shape — the auth endpoint uses this to
 *  refuse access to anything that isn't a brochure room. */
export function brochureIdFromRoomId(roomId: string): string | null {
  if (!roomId.startsWith('brochure-')) return null
  return roomId.slice('brochure-'.length) || null
}
