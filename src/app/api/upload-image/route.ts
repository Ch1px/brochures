import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { uploadImageAsset } from '@/lib/sanity/mutations'

export const runtime = 'nodejs'
// Route handlers stream the request body; not subject to the server-action
// `bodySizeLimit` default of 1MB. Vercel still caps at ~4.5MB on Hobby/Pro
// in production — for prod uploads above that, switch to a signed
// direct-to-Sanity flow.

const MAX_IMAGE_BYTES = 30 * 1024 * 1024 // 30MB

async function assertAdmin() {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!email || !allowlist.includes(email.toLowerCase())) {
    throw new Error('Not authorised')
  }
}

export async function POST(req: Request) {
  try {
    await assertAdmin()
  } catch {
    return NextResponse.json({ ok: false, error: 'Not authorised' }, { status: 401 })
  }

  // Raw-binary protocol: client sends the file as the request body with
  // Content-Type set to the file's MIME type and X-Filename carrying the
  // original filename (URI-encoded).
  const contentType = req.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    return NextResponse.json({ ok: false, error: 'File is not an image' }, { status: 400 })
  }
  const filenameHeader = req.headers.get('x-filename')
  const filename = filenameHeader ? decodeURIComponent(filenameHeader) : 'image'

  let buffer: Buffer
  try {
    const arrayBuffer = await req.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB)` },
        { status: 413 }
      )
    }
    buffer = Buffer.from(arrayBuffer)
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Could not read body' },
      { status: 400 }
    )
  }

  try {
    const asset = await uploadImageAsset(buffer, { filename, contentType })
    return NextResponse.json({
      ok: true,
      image: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      },
    })
  } catch (err) {
    console.error('upload-image failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
