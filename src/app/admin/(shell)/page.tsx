import { sanityWriteClient } from '@/lib/sanity/client'
import { ALL_BROCHURES, COMPANIES_FOR_PICKER } from '@/lib/sanity/queries'
import { AdminLibraryClient } from '@/components/admin/AdminLibraryClient'
import type { MiniBrochure } from '@/components/admin/MiniCoverPreview'
import type { Brochure } from '@/types/brochure'
import { optionalEnv } from '@/lib/env'

type BrochureRow = MiniBrochure & {
  _id: string
  _updatedAt: string
  title: string
  slug: string
  season: string
  event?: string
  status: 'draft' | 'published' | 'unpublished' | 'archived'
  publishedAt?: string
  featured?: boolean
  pageCount: number
  lastEditedBy?: { name?: string; email?: string }
  company?: { _id: string; name: string; accentColor?: string; domain?: string; logo?: Brochure['logo'] } | null
}

type CompanyOption = { _id: string; name: string; domain: string }

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const [brochures, companies] = await Promise.all([
    sanityWriteClient.fetch<BrochureRow[]>(ALL_BROCHURES),
    sanityWriteClient.fetch<CompanyOption[]>(COMPANIES_FOR_PICKER),
  ])

  const aiServerEnabled = Boolean(optionalEnv('ANTHROPIC_API_KEY'))

  return (
    <main className="library-page">
      <AdminLibraryClient
        brochures={brochures}
        companies={companies}
        aiServerEnabled={aiServerEnabled}
      />
    </main>
  )
}
