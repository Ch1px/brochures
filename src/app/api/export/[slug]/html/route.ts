import { NextResponse } from 'next/server'
import { sanityClient } from '@/lib/sanity/client'
import { BROCHURE_BY_SLUG, BROCHURE_BY_SLUG_PREVIEW } from '@/lib/sanity/queries'
import { signPreviewToken, verifyPreviewToken } from '@/lib/previewToken'
import { launchBrowser } from '@/lib/pdf/browser'
import {
  composeStandaloneHtml,
  extractStylesheets,
  inlineSanityImages,
  stripNextRuntime,
} from '@/lib/htmlExport/inline'
import { offlineRuntime } from '@/lib/htmlExport/runtime'
import type { Brochure } from '@/types/brochure'

/**
 * Generate a self-contained `index.html` of a brochure that mirrors the
 * live public reader (slider, nav, keyboard arrows, fade-up animations)
 * but works entirely offline.
 *
 * Pipeline:
 *   1. Verify access. Same rules as the PDF export and the public route:
 *      published is open, anything else needs a valid `?preview=<token>`.
 *   2. Sign a fresh internal preview token so Puppeteer can fetch
 *      drafts/unpublished content regardless of how the request was
 *      authorised.
 *   3. Drive Puppeteer to /[slug]/static-export, wait for fonts.
 *   4. Pull the merged stylesheet text out of the browser, then capture
 *      the rendered body markup.
 *   5. Strip Next.js runtime/scripts/links and base64-inline every
 *      Sanity CDN image so the file is portable.
 *   6. Compose into a clean shell with the inlined CSS in <head> and
 *      the offline runtime as a single inline <script> before </body>.
 *
 * `?debug=1` mirrors the PDF route — returns JSON diagnostics instead
 * of the file so failures are inspectable from the browser console.
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

  const token = await signPreviewToken(slug, 5 * 60)
  const origin = url.origin
  const sourceUrl = `${origin}/${encodeURIComponent(slug)}/static-export?preview=${encodeURIComponent(token)}`

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

    // Render at a desktop-width viewport so layout-sensitive container
    // queries pick the desktop branch when the file is opened later.
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

    await page.goto(sourceUrl, { waitUntil: 'networkidle0', timeout: 45_000 })
    await page.evaluateHandle(() => document.fonts?.ready)

    // Detect Next.js error UI so we don't silently produce a broken file.
    const renderedError = await page.evaluate(() => {
      const text = document.body?.innerText ?? ''
      if (text.includes("This page couldn't load") || text.includes('A server error occurred')) {
        return text.slice(0, 500)
      }
      return null
    })

    if (renderedError || pageErrors.length > 0) {
      return NextResponse.json(
        { ok: false, sourceUrl, renderedError, pageErrors, httpFailures, logs },
        { status: 500 }
      )
    }

    const css = (await page.evaluate(extractStylesheets)) as string
    const rawHtml = await page.content()

    if (debug) {
      return NextResponse.json(
        {
          ok: true,
          sourceUrl,
          cssLength: css.length,
          htmlLength: rawHtml.length,
          httpFailures,
          logs,
        },
        { status: 200 }
      )
    }

    const cleanedHtml = stripNextRuntime(rawHtml)
    const inlinedHtml = await inlineSanityImages(cleanedHtml)

    const themeBg = brochure.theme === 'light' ? '#f5f5f3' : '#0a0a0b'
    const finalHtml = composeStandaloneHtml({
      title: brochure.title || 'Brochure',
      bodyHtml: inlinedHtml,
      css,
      runtime: offlineRuntime,
      themeBgColor: themeBg,
    })

    const filename = htmlFilename(brochure)
    return new NextResponse(finalHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    return NextResponse.json(
      {
        error: 'HTML export failed',
        detail: err instanceof Error ? err.stack || err.message : String(err),
        sourceUrl,
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

function htmlFilename(brochure: Brochure): string {
  const base = (brochure.slug?.current || brochure.title || 'brochure')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${base || 'brochure'}.html`
}
