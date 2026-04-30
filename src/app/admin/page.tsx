import { sanityWriteClient } from '@/lib/sanity/client'
import { ALL_BROCHURES } from '@/lib/sanity/queries'
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
  company?: { _id: string; name: string; accentColor?: string } | null
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const brochures = await sanityWriteClient.fetch<BrochureRow[]>(ALL_BROCHURES)

  return (
    <main className="library-page">
      <AdminLibraryClient brochures={brochures} />
    </main>
  )
}
