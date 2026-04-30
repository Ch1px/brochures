import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { sanityClient } from '@/lib/sanity/client'
import {
  COMPANY_BY_ID,
  COMPANY_FEATURED_BROCHURE_SLUG,
  FEATURED_BROCHURE_SLUG,
} from '@/lib/sanity/queries'
import { urlFor } from '@/lib/sanity/image'
import type { Company, SanityImage } from '@/types/brochure'

// Reads request headers, so this route is dynamic per host. No ISR — Sanity
// CDN caches the underlying GROQ responses anyway.
export const dynamic = 'force-dynamic'

type CompanyForHolding = Pick<
  Company,
  '_id' | 'displayName' | 'website' | 'accentColor'
> & {
  favicon?: SanityImage
  featuredBrochure?: { slug?: string; status?: string }
}

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers()
  const companyId = h.get('x-gpgt-company')
  if (!companyId) return {}
  const company = await sanityClient.fetch<CompanyForHolding | null>(
    COMPANY_BY_ID,
    { companyId }
  )
  if (!company) return {}
  const faviconUrl = company.favicon
    ? urlFor(company.favicon).width(128).height(128).format('png').url()
    : undefined
  return {
    title: company.displayName,
    icons: faviconUrl ? { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl } : undefined,
  }
}

export default async function RootPage() {
  const h = await headers()
  const companyId = h.get('x-gpgt-company')

  if (companyId) {
    const company = await sanityClient.fetch<CompanyForHolding | null>(
      COMPANY_BY_ID,
      { companyId }
    )

    // Prefer a brochure self-flagging as featured for this company. Fall back
    // to the company's manual featuredBrochure ref if it exists and is
    // published. Otherwise show the company-branded holding page.
    const selfFeatured = await sanityClient.fetch<{ slug: string } | null>(
      COMPANY_FEATURED_BROCHURE_SLUG,
      { companyId }
    )
    if (selfFeatured?.slug) redirect(`/${selfFeatured.slug}`)

    const refFeatured = company?.featuredBrochure
    if (refFeatured?.slug && refFeatured.status === 'published') {
      redirect(`/${refFeatured.slug}`)
    }

    return <HoldingPage company={company} />
  }

  const featured = await sanityClient.fetch<{ slug: string } | null>(FEATURED_BROCHURE_SLUG)
  if (featured?.slug) redirect(`/${featured.slug}`)

  return <HoldingPage company={null} />
}

function HoldingPage({ company }: { company: CompanyForHolding | null }) {
  const accent = company?.accentColor || '#cf212a'
  const displayName = company?.displayName || 'Grand Prix Grand Tours'
  const website = company?.website || 'https://grandprixgrandtours.com'
  const websiteLabel = website.replace(/^https?:\/\//, '').replace(/\/$/, '')

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0b',
        color: '#fff',
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div>
        <h1 style={{ marginBottom: 12, fontWeight: 900, letterSpacing: '0.02em' }}>
          {displayName}
        </h1>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          No brochure featured yet. Visit{' '}
          <a
            href={website}
            style={{ color: accent, textDecoration: 'none' }}
          >
            {websiteLabel}
          </a>
        </p>
      </div>
    </main>
  )
}
