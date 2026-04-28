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

  const debug = url.searchParams.get('debug') === '1'

  let browser: Awaited<ReturnType<typeof launchBrowser>> | null = null
  const logs: Array<{ kind: string; text: string }> = []
  const httpFailures: Array<{ status: number; url: string }> = []
  const pageErrors: string[] = []

  try {
    browser = await launchBrowser()
    const page = await browser.newPage()

    page.on('console', (msg) => {
      logs.push({ kind: msg.type(), text: msg.text() })
    })
    page.on('pageerror', (err) => {
      pageErrors.push(err.stack || err.message)
    })
    page.on('requestfailed', (r) => {
      httpFailures.push({ status: 0, url: `${r.url()} (${r.failure()?.errorText ?? 'failed'})` })
    })
    page.on('response', (res) => {
      if (res.status() >= 400) httpFailures.push({ status: res.status(), url: res.url() })
    })

    // Match the printed sheet pixel size at 96dpi so layout settles before
    // Chromium reflows for the @page rule. 297mm × 210mm ≈ 1123 × 794.
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 })

    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 45_000 })
    await page.evaluateHandle(() => document.fonts?.ready)

    // Detect Next.js error UI so we don't silently produce a "server error" PDF.
    const renderedError = await page.evaluate(() => {
      const text = document.body?.innerText ?? ''
      if (text.includes("This page couldn't load") || text.includes('A server error occurred')) {
        return text.slice(0, 500)
      }
      return null
    })

    if (debug || renderedError || pageErrors.length > 0) {
      return NextResponse.json(
        {
          ok: !renderedError && pageErrors.length === 0,
          printUrl,
          renderedError,
          pageErrors,
          httpFailures,
          logs,
        },
        { status: renderedError || pageErrors.length ? 500 : 200 }
      )
    }

    const pdf = await page.pdf({
      printBackground: true,
      format: 'A4',
      landscape: true,
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
    return NextResponse.json(
      {
        error: 'PDF generation failed',
        detail: err instanceof Error ? err.stack || err.message : String(err),
        printUrl,
        pageErrors,
        httpFailures,
        logs,
      },
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
