import { sanityWriteClient } from '@/lib/sanity/client'
import { ALL_COMPANIES_FOR_ADMIN } from '@/lib/sanity/queries'
import { CompaniesAdminClient, type CompanyRow } from '@/components/admin/CompaniesAdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminCompaniesPage() {
  const companies = await sanityWriteClient.fetch<CompanyRow[]>(ALL_COMPANIES_FOR_ADMIN)
  return (
    <main className="library-page">
      <CompaniesAdminClient companies={companies} />
    </main>
  )
}
