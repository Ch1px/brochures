import 'server-only'

/**
 * Fetches a list of URLs in parallel and reduces each to visible text.
 * Used to inject source material into the AI brochure builder prompt.
 *
 * Failures are swallowed per-URL — a partial context is better than none.
 * Text is not truncated here; the prompt builder caps per-source length.
 */

const FETCH_TIMEOUT_MS = 15_000
const MAX_BYTES = 2_000_000 // 2MB per URL — stop runaway responses

export type FetchedSource = { url: string; content: string; error?: string }

export async function fetchSources(urls: string[]): Promise<FetchedSource[]> {
  return Promise.all(urls.map(fetchOne))
}

async function fetchOne(url: string): Promise<FetchedSource> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; GPGT-Brochure-Builder/1.0; +https://brochures.grandprixgrandtours.com)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })
    if (!res.ok) {
      return { url, content: '', error: `HTTP ${res.status}` }
    }
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      return { url, content: '', error: `Unsupported content-type: ${contentType}` }
    }
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) {
      return { url, content: '', error: `Response too large (${buf.byteLength} bytes)` }
    }
    const html = new TextDecoder('utf-8', { fatal: false }).decode(buf)
    const content = htmlToText(html)
    return { url, content }
  } catch (err) {
    return {
      url,
      content: '',
      error: err instanceof Error ? err.message : 'Fetch failed',
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Minimal HTML → text pass. Not a full sanitiser — just good enough to feed
 * marketing-page copy into the LLM. Strips:
 *   - script/style/noscript/svg/iframe blocks (including contents)
 *   - HTML tags
 *   - HTML entities (decoded to their text equivalents)
 *   - excessive whitespace
 */
function htmlToText(html: string): string {
  let s = html

  // Drop <script>, <style>, <noscript>, <svg>, <iframe>, <template> with contents
  s = s.replace(
    /<(script|style|noscript|svg|iframe|template)\b[^>]*>[\s\S]*?<\/\1>/gi,
    ' '
  )
  // Drop HTML comments
  s = s.replace(/<!--[\s\S]*?-->/g, ' ')
  // Convert line-break tags to newlines before stripping everything else
  s = s.replace(/<(br|\/p|\/div|\/h[1-6]|\/li|\/tr)[^>]*>/gi, '\n')
  // Drop remaining tags
  s = s.replace(/<[^>]+>/g, ' ')
  // Decode a handful of common entities
  s = s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&pound;/g, '£')
    .replace(/&euro;/g, '€')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
  // Collapse whitespace
  s = s.replace(/[ \t\f\v]+/g, ' ')
  s = s.replace(/\n[ \t]*/g, '\n')
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}
