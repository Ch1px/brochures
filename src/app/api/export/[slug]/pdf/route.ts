import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { BROCHURE_BY_SLUG, BROCHURE_BY_SLUG_PREVIEW } from '@/lib/sanity/queries'
import { signPreviewToken, verifyPreviewToken } from '@/lib/previewToken'
import { launchBrowser } from '@/lib/pdf/browser'
import type { Brochure } from '@/types/brochure'

/**
 * Generate a PDF of a brochure by driving headless Chromium against
 * /[slug]/print. A4 landscape, one sheet per page.
 *
 * Access rules mirror the public reader:
 *   - status === 'published' → anyone may export
 *   - any other status → caller must supply a valid ?preview=<token>
 *
 * Internally we always sign a fresh short-lived preview token and pass it to
 * Chromium so the print route renders draft/unpublished content correctly
 * regardless of how the request itself was authorised.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: RouteContext) {
  const { slug } = await params
  const url = new URL(req.url)
  const supplied = url.searchParams.get('preview') ?? undefined

  const isPreview = supplied
    ? (await verifyPreviewToken(supplied, slug)) !== null
    : false

  const query = isPreview ? BROCHURE_BY_SLUG_PREVIEW : BROCHURE_BY_SLUG
  const brochure = await sanityClient.fetch<Brochure | null>(query, { slug })
  if (!brochure) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!isPreview && brochure.status !== 'published') {
    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  }

  // Sign an internal token so Puppeteer can render any status.
  const token = await signPreviewToken(slug, 5 * 60)
  const origin = url.origin
  const printUrl = `${origin}/${encodeURIComponent(slug)}/print?preview=${encodeURIComponent(token)}`

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    // Match the printed sheet pixel size at 96dpi so layout settles before
    // Chromium reflows for the @page rule. 297mm × 210mm ≈ 1123 × 794.
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 })

    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 45_000 })
    await page.evaluateHandle(() => document.fonts?.ready)

    const pdf = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    const filename = pdfFilename(brochure)
    return new NextResponse(pdf as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('PDF export failed:', err)
    return NextResponse.json(
      { error: 'PDF generation failed', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    )
  } finally {
    if (browser) await browser.close().catch(() => {})
  }
}

function pdfFilename(brochure: Brochure): string {
  const base = (brochure.slug?.current || brochure.title || 'brochure')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'brochure'}.pdf`
}
