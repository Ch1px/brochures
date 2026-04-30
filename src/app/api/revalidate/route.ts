import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import crypto from 'node:crypto'
import { invalidateHostMap } from '@/lib/companies/hostMap'

/**
 * Sanity webhook receiver. Configure two webhooks in Sanity:
 *
 *   1. Brochure changes
 *      - URL: https://brochures.grandprixgrandtours.com/api/revalidate
 *      - Filter: _type == "brochure"
 *      - Projection: { _id, _type, slug, status }
 *
 *   2. Company changes
 *      - URL: https://brochures.grandprixgrandtours.com/api/revalidate
 *      - Filter: _type == "company"
 *      - Projection: { _id, _type, domain }
 *
 * Both share `SANITY_REVALIDATE_SECRET`. Sanity signs as
 * `sanity-webhook-signature: t=<timestamp>,v1=<hash>` against the raw body.
 *
 * Note: the host map cache lives per Edge isolate in middleware. Calling
 * `invalidateHostMap()` here only affects the Node runtime's in-memory copy
 * (which middleware doesn't share). Middleware isolates eat the 5-min TTL.
 * This is acceptable for an internal tool with rare company changes.
 */

export async function POST(req: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ ok: false, error: 'Revalidate secret not configured' }, { status: 500 })
  }

  const signature = req.headers.get('sanity-webhook-signature')
  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Missing signature' }, { status: 401 })
  }

  const raw = await req.text()

  // Sanity signs as `t=<timestamp>,v1=<hash>`. Extract the v1 hash and verify.
  const match = signature.match(/v1=([a-f0-9]+)/)
  if (!match) {
    return NextResponse.json({ ok: false, error: 'Invalid signature format' }, { status: 401 })
  }
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
  if (!crypto.timingSafeEqual(Buffer.from(match[1]), Buffer.from(expected))) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 })
  }

  // Parse the body
  let body: {
    _id?: string
    _type?: string
    slug?: { current?: string }
    status?: string
    domain?: string
  }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const revalidated: string[] = []

  if (body._type === 'company') {
    invalidateHostMap()
    revalidatePath('/')
    revalidated.push('/', 'host-map')
    return NextResponse.json({ ok: true, revalidated })
  }

  // Default: brochure changes.
  const slug = body.slug?.current
  revalidatePath('/')
  revalidated.push('/')
  if (slug) {
    revalidatePath(`/${slug}`)
    revalidated.push(`/${slug}`)
  }

  return NextResponse.json({ ok: true, revalidated })
}
