'use client'

import { useOthers, useSelf } from '@/lib/liveblocks'

const MAX_VISIBLE = 4
const AVATAR_SIZE = 28

/**
 * Stack of avatars showing other admins currently viewing this
 * brochure. Only renders when there's at least one peer.
 *
 * Identity comes from `userInfo` baked into the Liveblocks token by
 * `/api/liveblocks-auth` — peers can't spoof name/avatar/colour by
 * mutating presence. Multiple tabs from the same user are deduped by
 * Liveblocks user id so the topbar shows one avatar per real human.
 */
export function PresenceAvatars() {
  // useSelf returns null until the auth handshake completes. We don't
  // render the local user — they don't need to see their own avatar
  // here — but reading useSelf forces the room connection to start.
  useSelf()
  const others = useOthers()

  // Dedup multiple tabs/sessions of the same user by Clerk user id
  // (Liveblocks puts that on `other.id` because the auth route called
  // `prepareSession(user.id)`). First connection wins on ordering.
  const seen = new Set<string>()
  const unique = others.filter((other) => {
    if (seen.has(other.id)) return false
    seen.add(other.id)
    return true
  })

  if (unique.length === 0) return null

  const visible = unique.slice(0, MAX_VISIBLE)
  const overflow = unique.length - visible.length

  return (
    <div className="editor-presence-stack" aria-label={`${unique.length} other admin${unique.length === 1 ? '' : 's'} viewing`}>
      {visible.map((other) => (
        <Avatar
          key={other.connectionId}
          name={other.info?.name ?? 'Admin'}
          avatarUrl={other.info?.avatarUrl ?? null}
          color={other.info?.color ?? '#888'}
        />
      ))}
      {overflow > 0 ? (
        <span
          className="editor-presence-avatar editor-presence-overflow"
          title={unique
            .slice(MAX_VISIBLE)
            .map((o) => o.info?.name ?? 'Admin')
            .join(', ')}
        >
          +{overflow}
        </span>
      ) : null}
    </div>
  )
}

function Avatar({ name, avatarUrl, color }: { name: string; avatarUrl: string | null; color: string }) {
  // Initials fallback when Clerk has no image. Two letters max.
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

  return (
    <span
      className="editor-presence-avatar"
      title={name}
      style={{ borderColor: color }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={name}
          width={AVATAR_SIZE}
          height={AVATAR_SIZE}
          loading="lazy"
        />
      ) : (
        <span className="editor-presence-initials" style={{ background: color }}>
          {initials}
        </span>
      )}
    </span>
  )
}
