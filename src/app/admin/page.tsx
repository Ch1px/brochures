import { sanityWriteClient } from '@/lib/sanity/client'
import { ALL_BROCHURES, COMPANIES_FOR_PICKER } from '@/lib/sanity/queries'
import { AdminLibraryClient } from '@/components/admin/AdminLibraryClient'

type BrochureRow = {
  _id: string
  title: string
  slug: string
  season: string
  event?: string
  status: 'draft' | 'published' | 'unpublished' | 'archived'
  publishedAt?: string
  featured?: boolean
  pageCount: number
  company?: { _id: string; name: string; accentColor?: string; domain?: string } | null
}

type CompanyOption = { _id: string; name: string; domain: string }

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [brochures, companies] = await Promise.all([
    sanityWriteClient.fetch<BrochureRow[]>(ALL_BROCHURES),
    sanityWriteClient.fetch<CompanyOption[]>(COMPANIES_FOR_PICKER),
  ])

  return (
    <main className="library-page">
      <AdminLibraryClient brochures={brochures} companies={companies} />
    </main>
  )
}
