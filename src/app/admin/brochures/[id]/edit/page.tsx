import { notFound } from 'next/navigation'
import { fetchBrochureForEdit } from '@/lib/sanity/mutations'
import { BrochureEditor } from '@/components/admin/BrochureEditor'

type Params = { id: string }

export const dynamic = 'force-dynamic'

export default async function EditBrochurePage({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const brochure = await fetchBrochureForEdit(id)
  if (!brochure) notFound()
  return <BrochureEditor initialBrochure={brochure} />
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { id } = await params
  const brochure = await fetchBrochureForEdit(id)
  return {
    title: brochure ? `Edit · ${brochure.title}` : 'Edit brochure',
    robots: { index: false, follow: false },
  }
}
