import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import crypto from 'node:crypto'

/**
 * Sanity webhook receiver. Configure in Sanity:
 *   - URL: https://brochures.grandprixgrandtours.com/api/revalidate
 *   - HTTP method: POST
 *   - Trigger on: Create, Update, Delete
 *   - Filter: _type == "brochure"
 *   - Projection: { slug, status, _id }
 *   - Secret: set as SANITY_REVALIDATE_SECRET in this app's env
 *
 * The secret is sent by Sanity as the `sanity-webhook-signature` header.
 * We verify the HMAC-SHA256 of the raw body matches before revalidating.
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
  let body: { slug?: { current?: string }; _id?: string; status?: string }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = body.slug?.current

  // Always revalidate the root (featured-brochure redirect may have changed)
  revalidatePath('/')

  // Revalidate the specific brochure if we have a slug
  if (slug) {
    revalidatePath(`/${slug}`)
  }

  return NextResponse.json({ ok: true, revalidated: slug ? ['/', `/${slug}`] : ['/'] })
}
