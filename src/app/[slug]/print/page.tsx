import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity/client'
import {
  BROCHURE_BY_SLUG_ANY_COMPANY,
  BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW,
} from '@/lib/sanity/queries'
import { verifyPreviewToken } from '@/lib/previewToken'
import type { Brochure } from '@/types/brochure'
import { BrochurePrintView } from '@/components/brochure/BrochurePrintView'

/**
 * Print-only view of a brochure. No nav, no slider, no animations — just
 * stacked A4-landscape pages. Used both for direct browser printing and as
 * the source URL the Puppeteer PDF pipeline navigates to.
 *
 * Status rules mirror /[slug]: published is public; anything else requires
 * a valid preview token.
 */

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

async function resolvePreview(slug: string, token: string | undefined): Promise<boolean> {
  if (!token) return false
  const payload = await verifyPreviewToken(token, slug)
  return payload !== null
}

// Print view ignores tenant scoping. Slugs are globally unique across
// companies and the route is no-index, so we serve the matching brochure
// regardless of which host hit /[slug]/print. This lets the PDF pipeline
// (which runs on whatever host issued the export) render brochures owned by
// any company without rewriting the URL host first.
async function getBrochure(slug: string, isPreview: boolean): Promise<Brochure | null> {
  const query = isPreview ? BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW : BROCHURE_BY_SLUG_ANY_COMPANY
  return sanityClient.fetch<Brochure | null>(query, { slug })
}

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function BrochurePrintPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = await resolvePreview(slug, sp?.preview)

  const brochure = await getBrochure(slug, isPreview)
  if (!brochure) notFound()
  if (!isPreview && brochure.status !== 'published') notFound()

  return <BrochurePrintView brochure={brochure} />
}
