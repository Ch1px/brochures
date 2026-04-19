import { NextResponse } from 'next/server'

/**
 * Lead capture endpoint — called by the Enquire modal on public brochures.
 *
 * Expected payload:
 *   {
 *     brochureSlug: string,
 *     brochureTitle: string,
 *     hubspotFormId: string,
 *     hubspotPortalId: string,
 *     destinationEmail?: string,   // internal notification email
 *     fields: { email, firstname, phone, preferredEvent, ... }
 *   }
 *
 * Flow:
 *   1. Validate minimum fields
 *   2. POST to HubSpot Forms API: https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}
 *   3. Optionally fire Resend notification to the destinationEmail
 *   4. Return 200 with { ok: true } so the modal can show success
 *
 * Rate limiting is not yet implemented — add Upstash Redis once traffic picks up.
 */

export async function POST(req: Request) {
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const hubspotFormId = String(payload.hubspotFormId ?? '')
  const hubspotPortalId = String(payload.hubspotPortalId ?? process.env.HUBSPOT_PORTAL_ID ?? '')
  const fields = payload.fields as Record<string, string> | undefined
  const brochureSlug = String(payload.brochureSlug ?? '')
  const brochureTitle = String(payload.brochureTitle ?? '')
  const destinationEmail = payload.destinationEmail ? String(payload.destinationEmail) : null

  if (!hubspotFormId || !hubspotPortalId) {
    return NextResponse.json({ ok: false, error: 'Missing HubSpot form or portal ID' }, { status: 400 })
  }
  if (!fields?.email) {
    return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 })
  }

  // 1. Submit to HubSpot
  const hubspotPayload = {
    fields: [
      ...Object.entries(fields).map(([name, value]) => ({ name, value })),
      // Always track the source brochure
      { name: 'brochure_slug', value: brochureSlug },
      { name: 'brochure_title', value: brochureTitle },
    ],
    context: {
      pageUri: req.headers.get('referer') ?? '',
      pageName: brochureTitle,
    },
  }

  try {
    const hubspotRes = await fetch(
      `https://api.hsforms.com/submissions/v3/integration/submit/${hubspotPortalId}/${hubspotFormId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hubspotPayload),
      }
    )
    if (!hubspotRes.ok) {
      const text = await hubspotRes.text()
      console.error('HubSpot submission failed:', hubspotRes.status, text)
      return NextResponse.json({ ok: false, error: 'HubSpot submission failed' }, { status: 502 })
    }
  } catch (err) {
    console.error('HubSpot submission error:', err)
    return NextResponse.json({ ok: false, error: 'Network error' }, { status: 502 })
  }

  // 2. Fire internal notification (Resend). Non-fatal — log but don't fail the request.
  if (destinationEmail && process.env.RESEND_API_KEY) {
    void sendNotification(destinationEmail, brochureTitle, fields).catch((err) => {
      console.error('Resend notification failed:', err)
    })
  }

  return NextResponse.json({ ok: true })
}

async function sendNotification(to: string, brochureTitle: string, fields: Record<string, string>) {
  const from = process.env.RESEND_FROM_EMAIL ?? 'notifications@grandprixgrandtours.com'
  const body = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: `New enquiry: ${brochureTitle}`,
      text: `New enquiry received for "${brochureTitle}"\n\n${body}`,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}`)
}
