import { currentUser } from '@clerk/nextjs/server'
import { sanityWriteClient } from '@/lib/sanity/client'
import { RECENT_BROCHURES_FOR_SHELL, SEARCH_INDEX_FOR_SHELL } from '@/lib/sanity/queries'
import { AdminShell, type RecentBrochure } from '@/components/admin/AdminShell'
import type { SearchIndex } from '@/components/admin/AdminSearchPalette'
import './shell.css'

/**
 * Wraps the admin list pages (brochures, companies, media) in the
 * application shell — top bar + left sidebar.
 *
 * Route group `(shell)` keeps URLs unchanged (`/admin`, `/admin/companies`,
 * `/admin/media`). The brochure editor lives at `/admin/brochures/[id]/edit`
 * outside this group and uses its own three-pane layout.
 */
export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const [user, recents, searchIndex] = await Promise.all([
    currentUser(),
    sanityWriteClient.fetch<RecentBrochure[]>(RECENT_BROCHURES_FOR_SHELL),
    sanityWriteClient.fetch<SearchIndex>(SEARCH_INDEX_FOR_SHELL),
  ])

  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    null

  return (
    <AdminShell user={{ name, email }} recents={recents ?? []} searchIndex={searchIndex}>
      {children}
    </AdminShell>
  )
}
