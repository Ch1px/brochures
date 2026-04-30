'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  Building2,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react'
import { AdminThemeToggle } from './AdminThemeToggle'
import { CANONICAL_HOST } from '@/lib/brochureHost'

type NavItem = {
  href: string
  label: string
  icon: typeof FileText
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin', label: 'Brochures', icon: FileText },
  { href: '/admin/companies', label: 'Companies', icon: Building2 },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
]

const STATUS_DOT: Record<string, string> = {
  published: '#22c55e',
  draft: '#ffb340',
  unpublished: '#94a3b8',
  archived: '#64748b',
}

export type RecentBrochure = {
  _id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'unpublished' | 'archived'
  _updatedAt: string
}

type Props = {
  user: { name: string | null; email: string | null }
  recents: RecentBrochure[]
  children: React.ReactNode
}

/**
 * Application shell wrapping the admin list pages (brochures, companies,
 * media). The brochure editor route is *not* nested under this shell —
 * it has its own three-pane layout.
 */
export function AdminShell({ user, recents, children }: Props) {
  const pathname = usePathname() ?? '/admin'

  // Active state: exact match for /admin (brochures), prefix match for nested routes
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const activeLabel = NAV_ITEMS.find((n) => isActive(n.href))?.label ?? 'Admin'

  const initial = (user.name ?? user.email ?? 'A').trim().charAt(0).toUpperCase()
  const displayName = user.name?.trim() || user.email || 'Signed in'

  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar">
        <button
          type="button"
          className="admin-shell-identity"
          title={user.email ?? undefined}
          aria-label={`Signed in as ${displayName}`}
        >
          <span className="admin-shell-identity-avatar" aria-hidden>{initial}</span>
          <span className="admin-shell-identity-name">{displayName}</span>
          <ChevronDown size={13} strokeWidth={2} className="admin-shell-identity-caret" aria-hidden />
        </button>

        <div className="admin-shell-sidebar-scroll">
          <ShellSection label="Workspace">
            <nav className="admin-shell-nav" aria-label="Primary">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`admin-shell-nav-item${active ? ' active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon size={14} strokeWidth={2} aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </ShellSection>

          {recents.length > 0 ? (
            <ShellSection label="Recent">
              <ul className="admin-shell-recent">
                {recents.map((b) => (
                  <li key={b._id}>
                    <Link
                      href={`/admin/brochures/${b._id}/edit`}
                      className="admin-shell-recent-item"
                      title={b.title}
                    >
                      <span
                        className="admin-shell-recent-dot"
                        style={{ background: STATUS_DOT[b.status] }}
                        aria-hidden
                      />
                      <span className="admin-shell-recent-title">{b.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </ShellSection>
          ) : null}
        </div>
      </aside>

      <header className="admin-shell-topbar">
        <div className="admin-shell-topbar-left">
          <span className="admin-shell-section">{activeLabel}</span>
        </div>
        <div className="admin-shell-topbar-right">
          <Link
            className="admin-shell-icon-btn"
            href="/studio"
            title="Sanity Studio — schema-level editing"
            aria-label="Open Sanity Studio"
          >
            <SlidersHorizontal size={14} strokeWidth={2} />
          </Link>
          <a
            className="admin-shell-icon-btn"
            href={`https://${CANONICAL_HOST}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View public site"
            aria-label="View public site"
          >
            <ExternalLink size={14} strokeWidth={2} />
          </a>
          <AdminThemeToggle />
          <span
            className="admin-shell-topbar-avatar"
            title={user.email ?? displayName}
            aria-label={`Signed in as ${displayName}`}
          >
            {initial}
          </span>
        </div>
      </header>

      <main className="admin-shell-main">{children}</main>
    </div>
  )
}

function ShellSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="admin-shell-section-block">
      <div className="admin-shell-section-label">{label}</div>
      {children}
    </div>
  )
}

