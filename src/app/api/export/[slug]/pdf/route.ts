import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import {
  BROCHURE_BY_SLUG_ANY_COMPANY,
  BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW,
} from '@/lib/sanity/queries'
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

// A4 landscape printed at ~150 DPI is 1754×1240. Capping image fetches at
// this width is the dominant lever for PDF size — components request up to
// 2000px which is wasted bytes once embedded.
const PDF_MAX_IMAGE_WIDTH = 1750
const PDF_IMAGE_QUALITY = 72

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: RouteContext) {
  const { slug } = await params
  const url = new URL(req.url)
  const supplied = url.searchParams.get('preview') ?? undefined

  const isPreview = supplied
    ? (await verifyPreviewToken(supplied, slug)) !== null
    : false

  // Tenant scoping is bypassed here: the PDF endpoint runs server-side and
  // slugs are globally unique across companies, so we look up the brochure
  // without a host context and let Puppeteer render it via the public route
  // (where host-based scoping does apply).
  const query = isPreview ? BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW : BROCHURE_BY_SLUG_ANY_COMPANY
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

  // Allow ?compress=0 to disable image rewriting for A/B comparison.
  const compress = url.searchParams.get('compress') !== '0'

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
      // Suppress media aborts we issue ourselves to keep PDFs lean — these
      // are intentional, not real failures.
      if (r.resourceType() === 'media') return
      httpFailures.push({ status: 0, url: `${r.url()} (${r.failure()?.errorText ?? 'failed'})` })
    })
    page.on('response', (res) => {
      if (res.status() >= 400) httpFailures.push({ status: res.status(), url: res.url() })
    })

    // Rewrite Sanity image URLs to a print-friendly profile: capped width,
    // q=72, forced JPEG. Chromium embeds JPEGs into the PDF without re-
    // encoding, so the source bytes flow through unchanged. WebP/AVIF
    // sources would otherwise get re-encoded by Chrome into a much larger
    // variant when embedded.
    //
    // We fetch the rewritten URL ourselves and reply via request.respond()
    // rather than overriding the URL in request.continue(). URL overrides
    // are inconsistently handled across Chromium builds for CSS background-
    // image fetches — responding with bytes against the original URL is the
    // robust path.
    // Always intercept so we can abort streaming media (videos) which would
    // otherwise prevent `networkidle0` from ever firing. PDFs can't embed
    // video — the poster image (already a separate request) covers any
    // visual fallback we need.
    await page.setRequestInterception(true)
    page.on('request', async (req) => {
      const original = req.url()

      // Abort video file streams from the Sanity CDN (and any other media
      // resource type Chromium classifies as media — this catches <video>
      // sources whatever URL pattern they use).
      if (
        req.resourceType() === 'media' ||
        /^https:\/\/cdn\.sanity\.io\/files\/.+\.(mp4|webm|mov|m4v)(\?|$)/i.test(original)
      ) {
        try { await req.abort() } catch {}
        return
      }

      if (!compress || !original.startsWith('https://cdn.sanity.io/images/')) {
        try { await req.continue() } catch {}
        return
      }
      try {
        const u = new URL(original)
        const w = Number(u.searchParams.get('w') ?? '0')
        if (!w || w > PDF_MAX_IMAGE_WIDTH) {
          u.searchParams.set('w', String(PDF_MAX_IMAGE_WIDTH))
        }
        u.searchParams.set('q', String(PDF_IMAGE_QUALITY))
        u.searchParams.set('fm', 'jpg')

        const upstream = await fetch(u.toString())
        if (!upstream.ok) {
          await req.continue()
          return
        }
        const body = Buffer.from(await upstream.arrayBuffer())
        await req.respond({
          status: upstream.status,
          headers: {
            'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
            'cache-control': 'public, max-age=3600',
          },
          body,
        })
      } catch {
        try { await req.continue() } catch {}
      }
    })

    // Match the printed sheet pixel size at 96dpi so layout settles before
    // Chromium reflows for the @page rule. 297mm × 210mm ≈ 1123 × 794.
    // deviceScaleFactor stays at 1 — page.pdf() output is vector with
    // embedded raster images at their fetched resolution; a higher DSF
    // doesn't sharpen the PDF, just wastes work on layout.
    await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 1 })

    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 45_000 })
    await page.evaluateHandle(() => document.fonts?.ready)
    // Wait for the client-side fit-to-page pass to mark itself ready.
    await page
      .waitForFunction(
        () => (window as unknown as { __brochurePrintReady?: boolean }).__brochurePrintReady === true,
        { timeout: 15_000 }
      )
      .catch(() => {})

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
