import type { CompanyHostEntry } from '@/types/brochure'

/**
 * Host -> Company lookup, used by middleware to scope requests to a tenant.
 *
 * Edge runtime constraints: middleware can't use the `@sanity/client` package
 * directly (Node deps) and `next: { revalidate }` on fetch isn't honoured in
 * middleware. So we cache in-memory per isolate with a short TTL. Webhook hits
 * `invalidateHostMap()` whenever a company doc changes.
 *
 * Cold isolates pay one Sanity round-trip; warm isolates serve from memory.
 */

const TTL_MS = 5 * 60 * 1000

let cache: { byHost: Map<string, CompanyHostEntry>; expires: number } | null = null

const HOST_MAP_QUERY = `*[_type == "company" && defined(domain)]{
  _id,
  domain,
  displayName,
  accentColor
}`

async function fetchCompanies(): Promise<CompanyHostEntry[]> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  if (!projectId) return []

  // Sanity API GROQ endpoint, public CDN. No auth needed for the public dataset.
  const url = new URL(`https://${projectId}.apicdn.sanity.io/v2024-10-01/data/query/${dataset}`)
  url.searchParams.set('query', HOST_MAP_QUERY)

  try {
    const res = await fetch(url.toString(), { cache: 'no-store' })
    if (!res.ok) return []
    const json = (await res.json()) as { result?: CompanyHostEntry[] }
    return Array.isArray(json.result) ? json.result : []
  } catch {
    return []
  }
}

async function ensureCache(): Promise<Map<string, CompanyHostEntry>> {
  const now = Date.now()
  if (cache && cache.expires > now) return cache.byHost
  const companies = await fetchCompanies()
  const byHost = new Map<string, CompanyHostEntry>()
  for (const c of companies) {
    if (c.domain) byHost.set(c.domain.toLowerCase(), c)
  }
  cache = { byHost, expires: now + TTL_MS }
  return byHost
}

/**
 * Strip port and trim. Returns lowercase hostname.
 */
export function normaliseHost(host: string | null | undefined): string {
  if (!host) return ''
  return host.split(':')[0].trim().toLowerCase()
}

export async function getCompanyByHost(
  host: string | null | undefined
): Promise<CompanyHostEntry | null> {
  const h = normaliseHost(host)
  if (!h) return null
  const byHost = await ensureCache()
  return byHost.get(h) ?? null
}

/**
 * Called by /api/revalidate when a company document changes so the next
 * request rebuilds the map from Sanity.
 */
export function invalidateHostMap(): void {
  cache = null
}
