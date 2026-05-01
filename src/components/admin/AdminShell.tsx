'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import {
  FileText,
  Building2,
  Image as ImageIcon,
  ExternalLink,
  ChevronDown,
  SlidersHorizontal,
  Settings,
  Sun,
  Moon,
  LogOut,
  Search,
} from 'lucide-react'
import { AdminThemeToggle } from './AdminThemeToggle'
import { useAdminTheme } from './AdminThemeProvider'
import { AdminSearchPalette, type SearchIndex } from './AdminSearchPalette'
import { ChampionshipRaceDialog } from './ChampionshipRaceDialog'
import { LatestUpdateCard } from './LatestUpdateCard'
import { openEasterEgg } from '@/components/EasterEgg'
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
  searchIndex: SearchIndex
  children: React.ReactNode
}

/**
 * Application shell wrapping the admin list pages (brochures, companies,
 * media). The brochure editor route is *not* nested under this shell —
 * it has its own three-pane layout.
 */
export function AdminShell({ user, recents, searchIndex, children }: Props) {
  const pathname = usePathname() ?? '/admin'
  const [searchOpen, setSearchOpen] = useState(false)
  const [raceOpen, setRaceOpen] = useState(false)

  // Active state: exact match for /admin (brochures), prefix match for nested routes
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)

  const initial = (user.name ?? user.email ?? 'A').trim().charAt(0).toUpperCase()
  const displayName = user.name?.trim() || user.email || 'Signed in'

  // Global ⌘K / Ctrl+K to open the search palette, plus Esc to close. The
  // mod-key check covers Mac (metaKey) and Windows/Linux (ctrlKey) without
  // needing useragent sniffing.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen((v) => !v)
        return
      }
      if (e.key === 'Escape' && searchOpen) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  return (
    <div className="admin-shell">
      <aside className="admin-shell-sidebar">
        <IdentityMenu user={user} initial={initial} displayName={displayName} />

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

        <div className="admin-shell-sidebar-footer">
          <LatestUpdateCard />
          <button
            type="button"
            className="admin-shell-easter-egg"
            onClick={() => setRaceOpen(true)}
            title="🤫"
            aria-label="Easter egg"
          >
            <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden>
              <rect x="0" y="0" width="1.5" height="14" fill="currentColor" />
              <g fill="currentColor">
                <rect x="3" y="1" width="2.5" height="2.5" />
                <rect x="8" y="1" width="2.5" height="2.5" />
                <rect x="13" y="1" width="2.5" height="2.5" />
                <rect x="5.5" y="3.5" width="2.5" height="2.5" />
                <rect x="10.5" y="3.5" width="2.5" height="2.5" />
                <rect x="3" y="6" width="2.5" height="2.5" />
                <rect x="8" y="6" width="2.5" height="2.5" />
                <rect x="13" y="6" width="2.5" height="2.5" />
              </g>
            </svg>
          </button>
          <button
            type="button"
            className="admin-shell-easter-egg admin-shell-easter-egg-egg"
            onClick={() => openEasterEgg()}
            title="🤫"
            aria-label="Easter egg — race"
          >
            <svg viewBox="0 0 16 16" width={12} height={12} aria-hidden>
              <ellipse cx="8" cy="9" rx="5" ry="6.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </aside>

      <header className="admin-shell-topbar">
        <div className="admin-shell-topbar-left" />
        <div className="admin-shell-topbar-right">
          <button
            type="button"
            className="admin-shell-search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            title="Search (⌘K)"
          >
            <Search size={14} strokeWidth={2} aria-hidden />
            <span className="admin-shell-search-trigger-label">Search…</span>
            <span className="admin-shell-search-trigger-kbd" aria-hidden>
              <kbd>⌘</kbd><kbd>K</kbd>
            </span>
          </button>
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

      <AdminSearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        index={searchIndex}
      />

      <ChampionshipRaceDialog open={raceOpen} onClose={() => setRaceOpen(false)} />
    </div>
  )
}

/**
 * Identity row + dropdown menu. The button is the trigger; on click a
 * popover anchored beneath it shows account info, account-settings link
 * (Clerk's user-profile modal), inline theme toggle, and sign out.
 *
 * Dismissed by: click outside, ESC, or selecting any item.
 */
function IdentityMenu({
  user,
  initial,
  displayName,
}: {
  user: { name: string | null; email: string | null }
  initial: string
  displayName: string
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const clerk = useClerk()
  const { theme, toggle: toggleTheme } = useAdminTheme()

  useEffect(() => {
    if (!open) return
    function onPointer(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const themeNext = theme === 'dark' ? 'light' : 'dark'
  const themeNextLabel = theme === 'dark' ? 'Light mode' : 'Dark mode'
  const ThemeIcon = theme === 'dark' ? Sun : Moon

  return (
    <div className="admin-shell-identity-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`admin-shell-identity${open ? ' open' : ''}`}
        title={user.email ?? undefined}
        aria-label={`Signed in as ${displayName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="admin-shell-identity-avatar" aria-hidden>{initial}</span>
        <span className="admin-shell-identity-name">{displayName}</span>
        <ChevronDown size={13} strokeWidth={2} className="admin-shell-identity-caret" aria-hidden />
      </button>

      {open ? (
        <div className="admin-shell-menu" role="menu">
          <div className="admin-shell-menu-header">
            <div className="admin-shell-menu-name">{displayName}</div>
            {user.email ? <div className="admin-shell-menu-email">{user.email}</div> : null}
          </div>

          <div className="admin-shell-menu-sep" role="separator" />

          <button
            type="button"
            className="admin-shell-menu-item"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              clerk.openUserProfile()
            }}
          >
            <Settings size={14} strokeWidth={2} aria-hidden />
            <span>Account settings</span>
          </button>

          <button
            type="button"
            className="admin-shell-menu-item"
            role="menuitem"
            aria-label={`Switch to ${themeNext} mode`}
            onClick={() => {
              toggleTheme()
              setOpen(false)
            }}
          >
            <ThemeIcon size={14} strokeWidth={2} aria-hidden />
            <span>{themeNextLabel}</span>
          </button>

          <div className="admin-shell-menu-sep" role="separator" />

          <button
            type="button"
            className="admin-shell-menu-item danger"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              clerk.signOut({ redirectUrl: '/' })
            }}
          >
            <LogOut size={14} strokeWidth={2} aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      ) : null}
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

