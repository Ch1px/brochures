'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { NewBrochureModal, type DuplicateSource } from './NewBrochureModal'
import { AiGenerateModal } from './AiGenerateModal'
import { deleteBrochureAction } from '@/lib/sanity/actions'
import { CANONICAL_HOST, brochurePublicUrl as brochurePublicUrlLib } from '@/lib/brochureHost'
import { AdminThemeToggle } from './AdminThemeToggle'

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

/** Public URL where this brochure is served (company host or canonical). */
function brochurePublicUrl(brochure: BrochureRow): string {
  return brochurePublicUrlLib(brochure.slug, brochure.company?.domain)
}

export type CompanyOption = { _id: string; name: string; domain: string }

type Props = {
  brochures: BrochureRow[]
  companies: CompanyOption[]
}

/** Sentinel value for the "Canonical (no company)" filter pill. */
const CANONICAL_COMPANY_ID = '__canonical__'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'archived', label: 'Archived' },
]

/**
 * Client wrapper for the admin library. Handles filtering, search,
 * "New brochure" modal, and per-card "Duplicate" action.
 */
export function AdminLibraryClient({ brochures, companies: companyOptions }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [deletePending, startDeleteTransition] = useTransition()
  const [newOpen, setNewOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<DuplicateSource | null>(null)
  // Filters are mirrored into ?q=&status=&season=&company= so refresh and
  // deep-links preserve the view.
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? '')
  const [seasonFilter, setSeasonFilter] = useState(() => searchParams.get('season') ?? '')
  const [companyFilter, setCompanyFilter] = useState(() => searchParams.get('company') ?? '')

  // Push filter changes back into the URL (replaceState — no history spam).
  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('q', search.trim())
    if (statusFilter) params.set('status', statusFilter)
    if (seasonFilter) params.set('season', seasonFilter)
    if (companyFilter) params.set('company', companyFilter)
    const qs = params.toString()
    const next = qs ? `${pathname}?${qs}` : pathname
    window.history.replaceState(null, '', next)
  }, [search, statusFilter, seasonFilter, companyFilter, pathname])

  function clearFilters() {
    setSearch('')
    setStatusFilter('')
    setSeasonFilter('')
    setCompanyFilter('')
  }

  const seasons = useMemo(() => {
    const s = new Set(brochures.map((b) => b.season).filter(Boolean))
    return Array.from(s).sort().reverse()
  }, [brochures])

  const companies = useMemo(() => {
    const map = new Map<string, { _id: string; name: string; accentColor?: string }>()
    for (const b of brochures) {
      if (b.company?._id) map.set(b.company._id, b.company)
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [brochures])

  const canonicalCount = useMemo(
    () => brochures.filter((b) => !b.company).length,
    [brochures],
  )

  const filtered = useMemo(() => {
    let list = brochures
    if (statusFilter) list = list.filter((b) => b.status === statusFilter)
    if (seasonFilter) list = list.filter((b) => b.season === seasonFilter)
    if (companyFilter === CANONICAL_COMPANY_ID) {
      list = list.filter((b) => !b.company)
    } else if (companyFilter) {
      list = list.filter((b) => b.company?._id === companyFilter)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          (b.event ?? '').toLowerCase().includes(q),
      )
    }
    return list
  }, [brochures, statusFilter, seasonFilter, companyFilter, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: brochures.length }
    for (const b of brochures) c[b.status] = (c[b.status] ?? 0) + 1
    return c
  }, [brochures])

  const PAGE_SIZE = 12
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset to page 0 when filters change
  const filterKey = `${statusFilter}|${seasonFilter}|${companyFilter}|${search}`
  const prevFilterKey = useRef(filterKey)
  if (prevFilterKey.current !== filterKey) {
    prevFilterKey.current = filterKey
    if (page !== 0) setPage(0)
  }

  return (
    <>
      {/* Header */}
      <div className="library-header">
        <div>
          <h1 className="library-title">Brochures</h1>
          <div className="library-subtitle">{brochures.length} total</div>
        </div>
        <div className="library-header-actions">
          <AdminThemeToggle />
          <Link href="/admin/companies" className="library-header-btn">
            Companies
          </Link>
          <Link href="/admin/media" className="library-header-btn">
            Media
          </Link>
          <button className="library-header-btn" onClick={() => setAiOpen(true)}>
            Generate with AI
          </button>
          <button className="library-header-btn primary" onClick={() => setNewOpen(true)}>
            + New brochure
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="library-filters">
        <div className="library-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="library-search-icon">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="library-search-input"
            placeholder="Search brochures..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="library-filter-pills">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`library-filter-pill${statusFilter === opt.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
              <span className="library-filter-pill-count">
                {opt.value ? (counts[opt.value] ?? 0) : counts.all}
              </span>
            </button>
          ))}
          {seasons.length > 1 ? (
            <>
              <span className="library-filter-divider" />
              {seasons.map((s) => (
                <button
                  key={s}
                  className={`library-filter-pill${seasonFilter === s ? ' active' : ''}`}
                  onClick={() => setSeasonFilter(seasonFilter === s ? '' : s)}
                >
                  {s}
                </button>
              ))}
            </>
          ) : null}
          {companies.length > 0 ? (
            <>
              <span className="library-filter-divider" />
              <button
                className={`library-filter-pill${companyFilter === CANONICAL_COMPANY_ID ? ' active' : ''}`}
                onClick={() =>
                  setCompanyFilter(companyFilter === CANONICAL_COMPANY_ID ? '' : CANONICAL_COMPANY_ID)
                }
                title="Brochures hosted on the canonical domain"
              >
                Grand Prix Grand Tours
                <span className="library-filter-pill-count">{canonicalCount}</span>
              </button>
              {companies.map((c) => {
                const count = brochures.filter((b) => b.company?._id === c._id).length
                return (
                  <button
                    key={c._id}
                    className={`library-filter-pill${companyFilter === c._id ? ' active' : ''}`}
                    onClick={() => setCompanyFilter(companyFilter === c._id ? '' : c._id)}
                    style={
                      companyFilter === c._id && c.accentColor
                        ? { borderColor: c.accentColor, color: c.accentColor }
                        : undefined
                    }
                  >
                    {c.name}
                    <span className="library-filter-pill-count">{count}</span>
                  </button>
                )
              })}
            </>
          ) : null}
        </div>
      </div>

      {/* Grid */}
      <div className="library-body">
        <div className="library-grid">
          {paginated.map((b) => (
            <div key={b._id} className="library-card">
              <div className="library-card-actions">
                {b.status === 'published' ? (
                  <a
                    className="library-card-action"
                    href={brochurePublicUrl(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Open ${brochurePublicUrl(b).replace(/^https?:\/\//, '')}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : null}
                <button
                  className="library-card-action"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDuplicateSource({
                      id: b._id,
                      title: b.title,
                      slug: b.slug,
                      season: b.season,
                      event: b.event,
                      companyId: b.company?._id ?? null,
                    })
                  }}
                  title="Duplicate"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                <button
                  className="library-card-action danger"
                  disabled={deletePending}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!confirm(`Permanently delete "${b.title}"? This cannot be undone.`)) return
                    startDeleteTransition(async () => {
                      const res = await deleteBrochureAction(b._id)
                      if (res.ok) {
                        router.refresh()
                      } else {
                        alert(`Delete failed: ${'error' in res ? res.error : 'Unknown error'}`)
                      }
                    })
                  }}
                  title="Delete"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
              <Link href={`/admin/brochures/${b._id}/edit`} style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
                <div className="library-card-thumb">
                  <div className="library-card-thumb-text">{b.title}</div>
                </div>
                <div className="library-card-body">
                  <div className="library-card-title">{b.title}</div>
                  <div className="library-card-meta">
                    <span>
                      <span className={`library-card-status ${b.status}`}>{b.status}</span>
                      {b.featured ? <span className="library-card-featured">Featured</span> : null}
                      {b.company ? (
                        <span
                          className="library-card-company"
                          style={
                            b.company.accentColor
                              ? {
                                  background: `${b.company.accentColor}1f`,
                                  color: b.company.accentColor,
                                  borderColor: `${b.company.accentColor}66`,
                                }
                              : undefined
                          }
                          title={`Hosted on ${b.company.name}`}
                        >
                          {b.company.name}
                        </span>
                      ) : null}
                    </span>
                    <span>{b.season} · {b.pageCount} {b.pageCount === 1 ? 'page' : 'pages'}</span>
                  </div>
                  {b.event ? (
                    <div className="library-card-event">{b.event}</div>
                  ) : null}
                  <div className="library-card-slug">
                    {(b.company?.domain || CANONICAL_HOST) + '/' + b.slug}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {totalPages > 1 ? (
          <div className="library-pagination">
            <button
              className="library-pagination-btn"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </button>
            <div className="library-pagination-pages">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`library-pagination-page${page === i ? ' active' : ''}`}
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              className="library-pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              Next
            </button>
            <span className="library-pagination-info">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
          </div>
        ) : null}

        {filtered.length === 0 && brochures.length > 0 ? (
          <div className="library-empty">
            No brochures match your filters.{' '}
            <button className="library-empty-reset" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : null}

        {brochures.length === 0 ? (
          <div className="library-empty">
            No brochures yet.{' '}
            <button className="library-empty-reset" onClick={() => setNewOpen(true)}>
              Create your first
            </button>
          </div>
        ) : null}
      </div>

      <NewBrochureModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        companies={companyOptions}
        // Pre-select the currently filtered company (if any) so creating from
        // a filtered view inherits the obvious assignment.
        defaultCompanyId={
          companyFilter && companyFilter !== CANONICAL_COMPANY_ID ? companyFilter : undefined
        }
      />
      <NewBrochureModal
        open={duplicateSource !== null}
        onClose={() => setDuplicateSource(null)}
        duplicateFrom={duplicateSource ?? undefined}
        companies={companyOptions}
      />
      <AiGenerateModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  )
}
