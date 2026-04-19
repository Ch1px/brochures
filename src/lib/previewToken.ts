import 'server-only'
import { SignJWT, jwtVerify } from 'jose'

/**
 * Signed preview tokens for sharing draft/unpublished brochures.
 * The admin editor's "Copy preview link" button signs a JWT scoped to one slug
 * with a short expiry; the public /[slug] route verifies it before bypassing
 * the status check.
 *
 * HS256 / shared secret — PREVIEW_TOKEN_SECRET env var must be set in prod.
 * Rotating the secret invalidates all outstanding preview links.
 */

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

type PreviewPayload = {
  slug: string
  /** iat and exp handled by jose */
}

function secretKey(): Uint8Array {
  const secret = process.env.PREVIEW_TOKEN_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'PREVIEW_TOKEN_SECRET is not set (or too short). Generate one with `openssl rand -base64 32`.'
    )
  }
  return new TextEncoder().encode(secret)
}

/** Sign a preview token for a brochure slug. Returns the compact JWT string. */
export async function signPreviewToken(
  slug: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return await new SignJWT({ slug })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secretKey())
}

/**
 * Verify a preview token. Returns the payload if valid, or null if invalid/expired.
 * If `expectedSlug` is provided, also checks the token is for that specific slug
 * (prevents a token for brochure A being used to view brochure B).
 */
export async function verifyPreviewToken(
  token: string,
  expectedSlug?: string
): Promise<PreviewPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ['HS256'] })
    const slug = typeof payload.slug === 'string' ? payload.slug : null
    if (!slug) return null
    if (expectedSlug && slug !== expectedSlug) return null
    return { slug }
  } catch {
    return null
  }
}
