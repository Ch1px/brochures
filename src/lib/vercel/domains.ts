import 'server-only'
import { optionalEnv } from '@/lib/env'

/**
 * Thin Vercel Domains API client.
 *
 * Reads `VERCEL_API_TOKEN`, `VERCEL_PROJECT_ID`, optional `VERCEL_TEAM_ID`.
 * If any of the required vars are missing, every call returns a
 * `{ ok: false, error: 'Vercel not configured' }` result so local dev still
 * works without a token. Production `/admin/companies` should always have it.
 *
 * All operations are idempotent at the HTTP level:
 *   - addDomain treats 409 (already attached to this project) as success
 *   - removeDomain treats 404 (not on project) as success
 *
 * Domain attached to a different Vercel project surfaces as a typed error so
 * the UI can prompt the admin to detach it manually.
 */

export type VercelResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string }

type Env = {
  token: string
  projectId: string
  teamId: string | undefined
}

function readEnv(): Env | null {
  const token = optionalEnv('VERCEL_API_TOKEN')
  const projectId = optionalEnv('VERCEL_PROJECT_ID')
  if (!token || !projectId) return null
  return { token, projectId, teamId: optionalEnv('VERCEL_TEAM_ID') }
}

function teamQuery(env: Env): string {
  return env.teamId ? `?teamId=${encodeURIComponent(env.teamId)}` : ''
}

function authHeaders(env: Env): HeadersInit {
  return {
    Authorization: `Bearer ${env.token}`,
    'Content-Type': 'application/json',
  }
}

export type DomainConfig = {
  /** True when DNS still needs work (no/incorrect CNAME, missing A record, etc). */
  misconfigured: boolean
  /** True when domain is verified, certs issued, traffic routes. */
  verified: boolean
  /** What Vercel wants the CNAME / A records to look like. */
  recommendedCNAME?: string
  recommendedIPv4?: string[]
}

/**
 * Attach a domain to the configured Vercel project.
 *
 * Vercel response codes we care about:
 *   200/201 — attached
 *   409 + code 'domain_already_in_use' (this project) — treat as success
 *   409 + code 'domain_already_in_use' (another project) — error, surface
 *   403 — token lacks permission
 */
export async function addDomain(host: string): Promise<VercelResult> {
  const env = readEnv()
  if (!env) return { ok: false, error: 'Vercel not configured', code: 'not_configured' }

  const url = `https://api.vercel.com/v10/projects/${env.projectId}/domains${teamQuery(env)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(env),
    body: JSON.stringify({ name: host }),
  })

  if (res.ok) return { ok: true, data: undefined }

  // Vercel's 409 body for `domain_already_in_use` has changed shape across
  // API versions: sometimes `error.project` is `{ id }`, sometimes a bare
  // string ID, sometimes `error.projectId`. Read all of them.
  type ConflictBody = {
    error?: {
      code?: string
      message?: string
      projectId?: string
      project?: string | { id?: string }
    }
  }
  let body: ConflictBody = {}
  try { body = await res.json() } catch { /* ignore */ }
  const code = body.error?.code
  const message = body.error?.message ?? `Vercel returned ${res.status}`

  if (res.status === 409 && code === 'domain_already_in_use') {
    const ownerId =
      body.error?.projectId ??
      (typeof body.error?.project === 'string'
        ? body.error.project
        : body.error?.project?.id)

    if (ownerId && ownerId === env.projectId) {
      return { ok: true, data: undefined }
    }
    // Either Vercel didn't tell us the owner, or it's a different project.
    // Surface enough info so the admin can find and detach it.
    const ownerHint = ownerId ? ` (project: ${ownerId})` : ''
    return {
      ok: false,
      error: `Domain "${host}" is already attached to a different Vercel project${ownerHint}. Detach it there first, or fix VERCEL_PROJECT_ID if it's pointing at the wrong project.`,
      code,
    }
  }

  return { ok: false, error: message, code }
}

/**
 * Remove a domain from the configured Vercel project. 404 (not present) is
 * treated as success so callers can fire-and-forget on company delete.
 */
export async function removeDomain(host: string): Promise<VercelResult> {
  const env = readEnv()
  if (!env) return { ok: false, error: 'Vercel not configured', code: 'not_configured' }

  const url = `https://api.vercel.com/v9/projects/${env.projectId}/domains/${encodeURIComponent(host)}${teamQuery(env)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers: authHeaders(env),
  })

  if (res.ok || res.status === 404) return { ok: true, data: undefined }

  let body: { error?: { code?: string; message?: string } } = {}
  try { body = await res.json() } catch { /* ignore */ }
  return {
    ok: false,
    error: body.error?.message ?? `Vercel returned ${res.status}`,
    code: body.error?.code,
  }
}

/**
 * Fetch DNS verification status for a domain on the configured project.
 * Used by the company modal to render "verified / pending / misconfigured"
 * with the right CNAME instructions.
 */
export async function getDomainConfig(host: string): Promise<VercelResult<DomainConfig>> {
  const env = readEnv()
  if (!env) return { ok: false, error: 'Vercel not configured', code: 'not_configured' }

  const url = `https://api.vercel.com/v9/projects/${env.projectId}/domains/${encodeURIComponent(host)}/config${teamQuery(env)}`
  const res = await fetch(url, {
    method: 'GET',
    headers: authHeaders(env),
  })

  if (!res.ok) {
    // 404 here means "domain isn't on this Vercel project". The caller can
    // recover by offering to attach it, so use a distinct code rather than
    // surfacing a raw "Not Found" string.
    if (res.status === 404) {
      return { ok: false, error: 'Domain not attached to project', code: 'not_attached' }
    }
    let body: { error?: { code?: string; message?: string } } = {}
    try { body = await res.json() } catch { /* ignore */ }
    return {
      ok: false,
      error: body.error?.message ?? `Vercel returned ${res.status}`,
      code: body.error?.code,
    }
  }

  const data = (await res.json()) as {
    misconfigured?: boolean
    cnames?: string[]
    aValues?: string[]
    recommendedCNAME?: string
    recommendedIPv4?: string[]
  }

  // A second hit on /domains/{host} tells us whether SSL provisioning has
  // verified ownership. Without this we can't distinguish "DNS pointed but
  // cert still issuing" from "fully live".
  const ownershipUrl = `https://api.vercel.com/v9/projects/${env.projectId}/domains/${encodeURIComponent(host)}${teamQuery(env)}`
  const ownershipRes = await fetch(ownershipUrl, { headers: authHeaders(env) })
  let verified = false
  if (ownershipRes.ok) {
    const ownershipData = (await ownershipRes.json()) as { verified?: boolean }
    verified = Boolean(ownershipData.verified)
  }

  return {
    ok: true,
    data: {
      misconfigured: Boolean(data.misconfigured),
      verified,
      recommendedCNAME: data.recommendedCNAME ?? 'cname.vercel-dns.com',
      recommendedIPv4: data.recommendedIPv4,
    },
  }
}

/** True when the env vars are present. UI can use this to hide DNS sections in dev. */
export function isVercelConfigured(): boolean {
  return readEnv() !== null
}
