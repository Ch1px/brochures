import { notFound } from 'next/navigation'
import { fetchBrochureForEdit } from '@/lib/sanity/mutations'
import { sanityWriteClient } from '@/lib/sanity/client'
import { COMPANIES_FOR_PICKER } from '@/lib/sanity/queries'
import { BrochureEditor, type CompanyOption } from '@/components/admin/BrochureEditor'
import { optionalEnv } from '@/lib/env'

type Params = { id: string }

export const dynamic = 'force-dynamic'

export default async function EditBrochurePage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const [brochure, companies] = await Promise.all([
    fetchBrochureForEdit(id),
    sanityWriteClient.fetch<CompanyOption[]>(COMPANIES_FOR_PICKER),
  ])
  if (!brochure) notFound()
  const liveblocksEnabled = Boolean(optionalEnv('LIVEBLOCKS_SECRET_KEY'))
  const aiServerEnabled = Boolean(optionalEnv('ANTHROPIC_API_KEY'))
  return (
    <BrochureEditor
      initialBrochure={brochure}
      companies={companies}
      liveblocksEnabled={liveblocksEnabled}
      aiServerEnabled={aiServerEnabled}
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const brochure = await fetchBrochureForEdit(id)
  return {
    title: brochure ? `Edit · ${brochure.title}` : 'Edit brochure',
    robots: { index: false, follow: false },
  }
}
