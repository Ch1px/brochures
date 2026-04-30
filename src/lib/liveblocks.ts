'use client'

/**
 * Liveblocks typed React hooks for the brochure editor.
 *
 * This module is client-only — it imports `@liveblocks/react`, which
 * evaluates `React.createContext` at module load and breaks when
 * pulled into a server bundle (e.g. the auth route handler). Any code
 * that runs on the server should import from `./liveblocks-shared`
 * instead.
 */

import { createClient } from '@liveblocks/client'
import { createRoomContext, createLiveblocksContext } from '@liveblocks/react'
import type { Presence, Storage, UserMeta, RoomEvent } from './liveblocks-shared'

export type { Presence, Storage, UserMeta, RoomEvent } from './liveblocks-shared'
export { colorForUser, roomIdForBrochure, brochureIdFromRoomId } from './liveblocks-shared'

const client = createClient({
  authEndpoint: '/api/liveblocks-auth',
  // Throttle outgoing presence updates. Default is 100ms; that's fine
  // for Tier 1 (presence rarely changes) and reasonable for Tier 2
  // cursor updates too.
  throttle: 100,
})

export const {
  RoomProvider,
  useOthers,
  useSelf,
  useUpdateMyPresence,
  useRoom,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client)

export const { LiveblocksProvider } = createLiveblocksContext<UserMeta>(client)
