import { redirect } from 'next/navigation'
import { sanityClient } from '@/lib/sanity/client'
import { FEATURED_BROCHURE_SLUG } from '@/lib/sanity/queries'

// Revalidate the featured-brochure lookup every 60 seconds.
export const revalidate = 60

export default async function RootPage() {
  const featured = await sanityClient.fetch<{ slug: string } | null>(FEATURED_BROCHURE_SLUG)

  if (featured?.slug) {
    redirect(`/${featured.slug}`)
  }

  // Fallback if no featured brochure is set — minimal holding page.
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
          Grand Prix Grand Tours
        </h1>
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          No brochure featured yet. Visit{' '}
          <a
            href="https://grandprixgrandtours.com"
            style={{ color: '#e10600', textDecoration: 'none' }}
          >
            grandprixgrandtours.com
          </a>
        </p>
      </div>
    </main>
  )
}
