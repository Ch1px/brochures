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
}

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const brochures = await sanityWriteClient.fetch<BrochureRow[]>(ALL_BROCHURES)

  return (
    <main style={{ padding: '40px 32px', background: '#0a0a0b', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <AdminLibraryClient brochures={brochures} />
    </main>
  )
}
