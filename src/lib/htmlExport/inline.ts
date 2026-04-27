import 'server-only'

/**
 * Server-side helpers for the offline `index.html` export.
 *
 * The export pipeline (`/api/export/[slug]/html`):
 *   1. Drives Puppeteer to /[slug]/static-export.
 *   2. Calls `extractStylesheets` inside the browser to merge every
 *      stylesheet the page loaded (including Next.js's compiled
 *      globals.css) into a single string.
 *   3. Reads the rendered HTML, then runs it through the helpers below
 *      to remove anything that won't work offline (Next runtime
 *      scripts, external <link>s) and base64-inline every Sanity CDN
 *      image referenced by the markup.
 *   4. Wraps the result via `composeStandaloneHtml`.
 */

/**
 * Browser-side function passed to `page.evaluate` *by reference* so
 * Puppeteer serialises and invokes it. (Passing it as a string would
 * evaluate it as an expression — yielding the function value, not its
 * return — which is a silent foot-gun.)
 *
 * Two-pass strategy because Next.js dev (Turbopack) and prod can both
 * produce sheets whose `cssRules` access throws (cross-origin chunk URLs,
 * constructed sheets, sheets still settling). Pass 1 reads everything we
 * can via the CSSOM. Pass 2 falls back to `fetch()` for any
 * `<link rel="stylesheet">` we didn't already capture, which works because
 * the request is same-origin from the page context.
 */
export async function extractStylesheets(): Promise<string> {
  const parts: string[] = []
  const captured = new Set<string>()

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = Array.from(sheet.cssRules)
      const text = rules.map((r) => r.cssText).join('\n')
      if (text) {
        parts.push(text)
        if (sheet.href) captured.add(sheet.href)
      }
    } catch {
      // unreadable — fall through to the fetch pass
    }
  }

  const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[]
  for (const link of links) {
    const href = link.href
    if (!href || captured.has(href)) continue
    try {
      const res = await fetch(href)
      if (res.ok) parts.push(await res.text())
    } catch {
      // best effort
    }
  }

  return parts.join('\n')
}

const SANITY_URL_RE = /https?:\/\/cdn\.sanity\.io\/[^\s"'`)<>]+/g

/**
 * Find every Sanity CDN URL in the HTML, fetch each one, base64-encode
 * the bytes, and replace every occurrence with a `data:` URI. Caches by
 * URL so an image referenced 10 times is only fetched once.
 *
 * Failures are non-fatal — if an asset can't be fetched the original URL
 * stays in place, which means that image won't render offline but the
 * rest of the file still works.
 */
export async function inlineSanityImages(html: string): Promise<string> {
  const urls = Array.from(new Set(html.match(SANITY_URL_RE) ?? []))
  if (urls.length === 0) return html

  const cache = new Map<string, string>()
  await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url)
        if (!res.ok) return
        const contentType = res.headers.get('content-type') ?? guessContentType(url)
        const buf = Buffer.from(await res.arrayBuffer())
        cache.set(url, `data:${contentType};base64,${buf.toString('base64')}`)
      } catch {
        // leave the URL untouched; downstream replace will skip it
      }
    })
  )

  return html.replace(SANITY_URL_RE, (match) => cache.get(match) ?? match)
}

function guessContentType(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('.png')) return 'image/png'
  if (lower.includes('.webp')) return 'image/webp'
  if (lower.includes('.gif')) return 'image/gif'
  if (lower.includes('.svg')) return 'image/svg+xml'
  return 'image/jpeg'
}

/**
 * Inline any root-relative `src="/..."` references (e.g. the default GPGT
 * logo at `/textures/GPGT - LOGO -dark.png`) by fetching them from the
 * page origin and rewriting to data URIs. Without this, /public assets
 * stay as `/textures/...` paths that 404 when the file is opened offline.
 */
export async function inlineLocalImages(html: string, origin: string): Promise<string> {
  const re = /(\bsrc=["'])(\/[^"'#?]+(?:\?[^"']*)?)(["'])/g
  const matches = Array.from(html.matchAll(re))
  const paths = Array.from(new Set(matches.map((m) => m[2])))
  if (paths.length === 0) return html

  const cache = new Map<string, string>()
  await Promise.all(
    paths.map(async (path) => {
      try {
        const res = await fetch(`${origin}${path}`)
        if (!res.ok) return
        const contentType = res.headers.get('content-type') ?? guessContentType(path)
        const buf = Buffer.from(await res.arrayBuffer())
        cache.set(path, `data:${contentType};base64,${buf.toString('base64')}`)
      } catch {
        // best effort
      }
    })
  )

  return html.replace(re, (full, prefix, path, suffix) => {
    const data = cache.get(path)
    return data ? `${prefix}${data}${suffix}` : full
  })
}

/**
 * Strip everything that ties the document to a running Next.js server:
 *   - All <script> tags (Next runtime, hydration data, our own nothing).
 *   - All <link> tags (preloads, stylesheet refs — we inline a single
 *     <style> ourselves).
 *   - The Next.js hydration data island and prefetch hints.
 *
 * We do this with regex on the raw HTML rather than a full parser to
 * keep the route handler dependency-free and fast. The patterns are
 * conservative — they match Next's actual emitted markup and nothing
 * the section components themselves render.
 */
export function stripNextRuntime(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\s+name="next-[^"]*"[^>]*>/gi, '')
    .replace(/<template\s+id="__next_error__"[^>]*>[\s\S]*?<\/template>/gi, '')
}

type ComposeOptions = {
  title: string
  bodyHtml: string
  css: string
  runtime: string
  lang?: string
  themeBgColor?: string
}

/**
 * Assemble the final standalone HTML around a clean shell. Drops the
 * extra attributes Next.js adds to <html>/<body> (data-next-hydrate,
 * data-mode, etc.) and leaves us with a minimal document the offline
 * runtime owns.
 */
export function composeStandaloneHtml({
  title,
  bodyHtml,
  css,
  runtime,
  lang = 'en',
  themeBgColor = '#0a0a0b',
}: ComposeOptions): string {
  const bodyInner = extractBodyInner(bodyHtml)
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(title)}</title>
<style>${css}</style>
<style>html,body{margin:0;padding:0;background:${themeBgColor};}</style>
</head>
<body>
${bodyInner}
<script>${runtime}</script>
</body>
</html>`
}

function extractBodyInner(html: string): string {
  const m = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  return m ? m[1] : html
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
