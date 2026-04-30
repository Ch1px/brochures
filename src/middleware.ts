import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { getCompanyByHost, normaliseHost } from '@/lib/companies/hostMap'

/**
 * Multi-host middleware.
 *
 * The app serves the canonical brochures host (brochures.grandprixgrandtours.com)
 * plus per-company subdomains like brochures.grandstandtickets.com. We:
 *
 *   1. Force /admin and /studio onto the canonical host. Sign-in cookies and
 *      Studio assets stay on a single domain — no cross-domain Clerk dance.
 *   2. Look the request host up in the company map. If it matches, set an
 *      `x-gpgt-company` header so server pages can scope GROQ to that company.
 *      Pages without the header behave canonically (no `company` ref).
 *
 * Edge runtime: hostMap caches in-memory per isolate (5 min TTL).
 */

const CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST || 'brochures.grandprixgrandtours.com'

const isProtectedRoute = createRouteMatcher(['/admin(.*)', '/studio(.*)'])

function isCanonicalHost(host: string): boolean {
  return (
    host === CANONICAL_HOST ||
    host === 'localhost' ||
    host.endsWith('.vercel.app') ||
    host === ''
  )
}

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url)
  const host = normaliseHost(req.headers.get('host'))
  const canonical = isCanonicalHost(host)

  // /admin and /studio live on the canonical host only.
  if (!canonical && isProtectedRoute(req)) {
    const target = new URL(url.pathname + url.search, `https://${CANONICAL_HOST}`)
    return NextResponse.redirect(target, 308)
  }

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Resolve company for this host. Canonical hosts get no header (canonical
  // behaviour). Child hosts that don't match a known company also get no
  // header — root will render the generic holding page.
  let companyId: string | null = null
  if (!canonical) {
    const company = await getCompanyByHost(host)
    companyId = company?._id ?? null
  }

  const requestHeaders = new Headers(req.headers)
  if (companyId) {
    requestHeaders.set('x-gpgt-company', companyId)
  } else {
    requestHeaders.delete('x-gpgt-company')
  }
  requestHeaders.set('x-gpgt-host', host)

  return NextResponse.next({ request: { headers: requestHeaders } })
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
