import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityClient } from '@/lib/sanity/client'
import { BROCHURE_BY_SLUG, BROCHURE_BY_SLUG_PREVIEW } from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import { verifyPreviewToken } from '@/lib/previewToken'
import type { Brochure } from '@/types/brochure'
import { BrochureReader } from '@/components/brochure/BrochureReader'

// ISR — revalidate every 60 seconds. Publishing fires a webhook to /api/revalidate
// for instant cache busts.
export const revalidate = 60

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

async function getBrochure(slug: string, isPreview: boolean): Promise<Brochure | null> {
  const query = isPreview ? BROCHURE_BY_SLUG_PREVIEW : BROCHURE_BY_SLUG
  return sanityClient.fetch<Brochure | null>(query, { slug })
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const sp = await searchParams
  const isPreview = await resolvePreview(slug, sp?.preview)

  const brochure = await getBrochure(slug, isPreview)
  if (!brochure) return { title: 'Not found' }

  const ogImageUrl = brochure.seo?.ogImage
    ? urlFor(brochure.seo.ogImage).width(1200).height(630).url()
    : undefined

  // Preview mode always forces noindex — nothing under review should be crawled.
  const noIndex = isPreview || brochure.seo?.noIndex

  return {
    title: brochure.seo?.metaTitle ?? brochure.title,
    description: brochure.seo?.metaDescription,
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

  const brochure = await getBrochure(slug, isPreview)
  if (!brochure) notFound()

  // Without a valid preview token, only `published` brochures are visible.
  // Archived/unpublished return 404 here; 410 Gone would be better for SEO but
  // requires middleware (logged as follow-up — see README).
  if (!isPreview && brochure.status !== 'published') notFound()

  return <BrochureReader brochure={brochure} />
}
