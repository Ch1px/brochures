import { NextRequest, NextResponse } from 'next/server'

/**
 * Font proxy — serves custom font files from Sanity CDN through our own
 * domain to avoid CORS issues. @font-face requests require CORS headers
 * which Sanity CDN doesn't provide for non-whitelisted origins.
 *
 * Usage: /api/font?ref=file-abc123-ttf
 * Resolves to: https://cdn.sanity.io/files/{project}/{dataset}/{hash}.{ext}
 *
 * Cached aggressively (1 year) since font assets are immutable.
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')
  console.log('[font-proxy] ref:', ref)

  if (!ref) {
    console.log('[font-proxy] ERROR: missing ref')
    return NextResponse.json({ error: 'Missing ref parameter' }, { status: 400 })
  }

  const match = ref.match(/^file-([a-zA-Z0-9]+)-([a-z0-9]+)$/)
  if (!match) {
    console.log('[font-proxy] ERROR: invalid ref format:', ref)
    return NextResponse.json({ error: 'Invalid ref format' }, { status: 400 })
  }

  const [, hash, ext] = match
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  console.log('[font-proxy] projectId:', projectId, 'dataset:', dataset, 'hash:', hash, 'ext:', ext)

  if (!projectId) {
    console.log('[font-proxy] ERROR: no project ID')
    return NextResponse.json({ error: 'Missing project ID' }, { status: 500 })
  }

  const url = `https://cdn.sanity.io/files/${projectId}/${dataset}/${hash}.${ext}`
  console.log('[font-proxy] fetching:', url)

  const res = await fetch(url)
  console.log('[font-proxy] upstream status:', res.status, 'content-type:', res.headers.get('content-type'), 'content-length:', res.headers.get('content-length'))

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown')
    console.log('[font-proxy] ERROR: upstream failed:', errText.slice(0, 200))
    return NextResponse.json({ error: 'Font not found' }, { status: 404 })
  }

  const contentType =
    ext === 'woff2' ? 'font/woff2' :
    ext === 'woff' ? 'font/woff' :
    ext === 'ttf' ? 'font/ttf' :
    ext === 'otf' ? 'font/otf' :
    'application/octet-stream'

  const body = await res.arrayBuffer()
  console.log('[font-proxy] OK: serving', body.byteLength, 'bytes as', contentType)

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
