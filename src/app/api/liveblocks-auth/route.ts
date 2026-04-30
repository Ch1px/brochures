import { NextResponse } from 'next/server'
import { Liveblocks } from '@liveblocks/node'
import { currentUser } from '@clerk/nextjs/server'
import { optionalEnv } from '@/lib/env'
import {
  brochureIdFromRoomId,
  colorForUser,
  roomIdForBrochure,
} from '@/lib/liveblocks-shared'
import { sanityWriteClient } from '@/lib/sanity/client'

/**
 * Liveblocks auth endpoint.
 *
 * Liveblocks calls this from the browser whenever a client wants to
 * connect to a room. We:
 *   1. Confirm the user is signed in via Clerk and on the admin
 *      allowlist — same gate as every other admin mutation.
 *   2. Confirm the room id maps to a real brochure (so a malicious
 *      client can't probe arbitrary room ids).
 *   3. Issue a token that grants access to that one room only, with
 *      `userInfo` (name, avatar, colour) baked in so peers see a
 *      trusted identity rather than whatever the client claims.
 *
 * If `LIVEBLOCKS_SECRET_KEY` isn't configured we return 503 — the
 * editor's `<RoomProvider>` will fall back gracefully and the avatar
 * stack just won't render. This keeps the editor functional in dev
 * environments without the key.
 */
export async function POST(req: Request) {
  const secret = optionalEnv('LIVEBLOCKS_SECRET_KEY')
  if (!secret) {
    return NextResponse.json(
      { error: 'Liveblocks not configured' },
      { status: 503 }
    )
  }

  const user = await currentUser()
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!user || !email || !allowlist.includes(email.toLowerCase())) {
    return NextResponse.json({ error: 'Not authorised' }, { status: 401 })
  }

  let body: { room?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const room = typeof body.room === 'string' ? body.room : ''
  const brochureId = brochureIdFromRoomId(room)
  if (!brochureId) {
    return NextResponse.json({ error: 'Invalid room' }, { status: 400 })
  }

  // Confirm the brochure actually exists. Without this, a client could
  // join a "brochure-{nonexistent}" room and broadcast presence to any
  // other client that joined the same fake id. Cheap GROQ count.
  const exists = await sanityWriteClient.fetch<number>(
    `count(*[_type == "brochure" && _id == $id])`,
    { id: brochureId }
  )
  if (exists === 0) {
    return NextResponse.json({ error: 'Brochure not found' }, { status: 404 })
  }

  const liveblocks = new Liveblocks({ secret })

  // Display identity. Prefer Clerk's first/last name, fall back to the
  // pre-@ part of the email so we never show a blank pill.
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    email.split('@')[0]

  const session = liveblocks.prepareSession(user.id, {
    userInfo: {
      name: displayName,
      avatarUrl: user.imageUrl ?? null,
      color: colorForUser(user.id),
    },
  })
  // Full access scoped to this one room — never the wildcard.
  session.allow(roomIdForBrochure(brochureId), session.FULL_ACCESS)

  const { status, body: tokenBody } = await session.authorize()
  return new NextResponse(tokenBody, { status })
}
