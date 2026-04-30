import { notFound } from 'next/navigation'
import { sanityClient } from '@/lib/sanity/client'
import {
  BROCHURE_BY_SLUG_ANY_COMPANY,
  BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW,
} from '@/lib/sanity/queries'
import { verifyPreviewToken } from '@/lib/previewToken'
import type { Brochure } from '@/types/brochure'
import { BrochureStaticView } from '@/components/brochure/BrochureStaticView'

/**
 * Static-export view of a brochure. Renders the same DOM as the public
 * reader (`/[slug]`) but without any client-side interactivity, so the
 * Puppeteer-based HTML export pipeline can capture a clean snapshot and
 * pair it with a hand-written vanilla-JS runtime.
 *
 * Status rules mirror /[slug]: published is public; anything else
 * requires a valid preview token. Always force-dynamic + noindex so this
 * route never gets cached or crawled.
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

// Static-export view ignores tenant scoping for the same reason the print
// view does: slugs are globally unique, the route is no-index, and the HTML
// export pipeline must render brochures owned by any company regardless of
// which host issued the export.
async function getBrochure(slug: string, isPreview: boolean): Promise<Brochure | null> {
  const query = isPreview ? BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW : BROCHURE_BY_SLUG_ANY_COMPANY
  return sanityClient.fetch<Brochure | null>(query, { slug })
}

export const metadata = {
  robots: { index: false, follow: false },
}

export default async function BrochureStaticExportPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = await resolvePreview(slug, sp?.preview)

  const brochure = await getBrochure(slug, isPreview)
  if (!brochure) notFound()
  if (!isPreview && brochure.status !== 'published') notFound()

  return <BrochureStaticView brochure={brochure} />
}
