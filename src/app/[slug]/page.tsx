import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { sanityClient } from '@/lib/sanity/client'
import { BROCHURE_BY_SLUG, BROCHURE_BY_SLUG_PREVIEW } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { verifyPreviewToken } from '@/lib/previewToken'
import type { Brochure } from '@/types/brochure'
import { BrochureReader } from '@/components/brochure/BrochureReader'

// Reads the host header (set by middleware) to scope the GROQ query to the
// matching company, so /[slug] on canonical and /[slug] on a child host are
// independently namespaced. Forces dynamic rendering — Sanity CDN handles
// underlying caching.
export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}

async function resolvePreview(
  slug: string,
  token: string | undefined
): Promise<boolean> {
  if (!token) return false
  const payload = await verifyPreviewToken(token, slug)
  return payload !== null
}

async function resolveCompanyId(): Promise<string> {
  const h = await headers()
  return h.get('x-gpgt-company') ?? ''
}

async function resolveHost(): Promise<string> {
  const h = await headers()
  return h.get('x-gpgt-host') ?? h.get('host') ?? ''
}

async function getBrochure(
  slug: string,
  isPreview: boolean,
  companyId: string
): Promise<Brochure | null> {
  const query = isPreview ? BROCHURE_BY_SLUG_PREVIEW : BROCHURE_BY_SLUG
  return sanityClient.fetch<Brochure | null>(query, { slug, companyId })
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = await resolvePreview(slug, sp?.preview)
  const companyId = await resolveCompanyId()
  const host = await resolveHost()

  const brochure = await getBrochure(slug, isPreview, companyId)
  if (!brochure) return { title: 'Not found' }

  const ogImageUrl = brochure.seo?.ogImage
    ? urlFor(brochure.seo.ogImage).width(1200).height(630).url()
    : undefined

  // Preview mode always forces noindex — nothing under review should be crawled.
  const noIndex = isPreview || brochure.seo?.noIndex

  // metadataBase resolves relative URLs (canonical, og:url) against the host
  // serving the request, so each child domain produces correct absolute URLs.
  const metadataBase = host ? new URL(`https://${host.split(':')[0]}`) : undefined

  return {
    title: brochure.seo?.metaTitle ?? brochure.title,
    description: brochure.seo?.metaDescription,
    metadataBase,
    alternates: { canonical: `/${slug}` },
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: brochure.seo?.metaTitle ?? brochure.title,
      description: brochure.seo?.metaDescription,
      images: ogImageUrl ? [{ url: ogImageUrl, width: 1200, height: 630 }] : undefined,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: brochure.seo?.metaTitle ?? brochure.title,
      description: brochure.seo?.metaDescription,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  }
}

export default async function BrochurePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = await resolvePreview(slug, sp?.preview)
  const companyId = await resolveCompanyId()

  const brochure = await getBrochure(slug, isPreview, companyId)
  if (!brochure) notFound()

  // Without a valid preview token, only `published` brochures are visible.
  // Archived/unpublished return 404 here; 410 Gone would be better for SEO but
  // requires middleware (logged as follow-up — see README).
  if (!isPreview && brochure.status !== 'published') notFound()

  return <BrochureReader brochure={brochure} />
}
