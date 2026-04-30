'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  X,
  Plus,
  Sparkles,
  Building2,
  Image as ImageIcon,
  Copy,
  Trash2,
  ExternalLink,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { NewBrochureModal, type DuplicateSource } from './NewBrochureModal'
import { AiGenerateModal } from './AiGenerateModal'
import { deleteBrochureAction } from '@/lib/sanity/actions'
import { CANONICAL_HOST, brochurePublicUrl as brochurePublicUrlLib } from '@/lib/brochureHost'
import { AdminThemeToggle } from './AdminThemeToggle'
import { MiniCoverPreview, type MiniBrochure } from './MiniCoverPreview'
import type { Brochure } from '@/types/brochure'

type BrochureRow = MiniBrochure & {
  _id: string
  title: string
  slug: string
  season: string
  event?: string
  status: 'draft' | 'published' | 'unpublished' | 'archived'
  publishedAt?: string
  featured?: boolean
  pageCount: number
  company?: { _id: string; name: string; accentColor?: string; domain?: string; logo?: Brochure['logo'] } | null
}

function brochurePublicUrl(brochure: BrochureRow): string {
  return brochurePublicUrlLib(brochure.slug, brochure.company?.domain)
}

export type CompanyOption = { _id: string; name: string; domain: string }

type Props = {
  brochures: BrochureRow[]
  companies: CompanyOption[]
}

const CANONICAL_COMPANY_ID = '__canonical__'

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'unpublished', label: 'Unpublished' },
  { value: 'archived', label: 'Archived' },
] as const

const STATUS_DOT: Record<string, string> = {
  published: '#22c55e',
  draft: '#ffb340',
  unpublished: '#94a3b8',
  archived: '#64748b',
}

export function AdminLibraryClient({ brochures, companies: companyOptions }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [deletePending, startDeleteTransition] = useTransition()
  const [newOpen, setNewOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<DuplicateSource | null>(null)
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? '')
  const [seasonFilter, setSeasonFilter] = useState(() => searchParams.get('season') ?? '')
  const [companyFilter, setCompanyFilter] = useState(() => searchParams.get('company') ?? '')

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

  const filterKey = `${statusFilter}|${seasonFilter}|${companyFilter}|${search}`
  const prevFilterKey = useRef(filterKey)
  if (prevFilterKey.current !== filterKey) {
    prevFilterKey.current = filterKey
    if (page !== 0) setPage(0)
  }

  const hasActiveFilters = Boolean(search.trim() || statusFilter || seasonFilter || companyFilter)

  return (
    <>
      {/* Header */}
      <div className="library-header">
        <div>
          <h1 className="library-title">Brochures</h1>
          <div className="library-subtitle">
            {brochures.length} total
            {hasActiveFilters ? <span className="library-subtitle-sep"> · </span> : null}
            {hasActiveFilters ? <span>{filtered.length} matching</span> : null}
          </div>
        </div>
        <div className="library-header-actions">
          <AdminThemeToggle />
          <span className="library-header-divider" aria-hidden />
          <Link href="/admin/companies" className="library-header-btn" title="Manage companies">
            <Building2 size={14} strokeWidth={2} />
            <span>Companies</span>
          </Link>
          <Link href="/admin/media" className="library-header-btn" title="Browse media library">
            <ImageIcon size={14} strokeWidth={2} />
            <span>Media</span>
          </Link>
          <button className="library-header-btn" onClick={() => setAiOpen(true)} title="Generate a new brochure with AI">
            <Sparkles size={14} strokeWidth={2} />
            <span>Generate</span>
          </button>
          <button className="library-header-btn primary" onClick={() => setNewOpen(true)}>
            <Plus size={15} strokeWidth={2.4} />
            <span>New brochure</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="library-filters">
        <div className="library-filter-row">
          <div className="library-search">
            <Search size={15} strokeWidth={2} className="library-search-icon" aria-hidden />
            <input
              type="text"
              className="library-search-input"
              placeholder="Search by title, slug or event…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                className="library-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={14} strokeWidth={2.2} />
              </button>
            ) : null}
          </div>
          {hasActiveFilters ? (
            <button type="button" className="library-filter-clear" onClick={clearFilters}>
              <X size={13} strokeWidth={2.2} />
              <span>Clear filters</span>
            </button>
          ) : null}
        </div>

        <FilterGroup label="Status">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`library-filter-pill${statusFilter === opt.value ? ' active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.value ? (
                <span className="library-filter-pill-dot" style={{ background: STATUS_DOT[opt.value] }} />
              ) : null}
              <span>{opt.label}</span>
              <span className="library-filter-pill-count">
                {opt.value ? (counts[opt.value] ?? 0) : counts.all}
              </span>
            </button>
          ))}
        </FilterGroup>

        {seasons.length > 1 ? (
          <FilterGroup label="Season">
            {seasons.map((s) => (
              <button
                key={s}
                className={`library-filter-pill${seasonFilter === s ? ' active' : ''}`}
                onClick={() => setSeasonFilter(seasonFilter === s ? '' : s)}
              >
                {s}
              </button>
            ))}
          </FilterGroup>
        ) : null}

        {companies.length > 0 ? (
          <FilterGroup label="Host">
            <button
              className={`library-filter-pill${companyFilter === CANONICAL_COMPANY_ID ? ' active' : ''}`}
              onClick={() =>
                setCompanyFilter(companyFilter === CANONICAL_COMPANY_ID ? '' : CANONICAL_COMPANY_ID)
              }
              title="Brochures hosted on the Grand Prix Grand Tours domain"
            >
              <span>Grand Prix Grand Tours</span>
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
                      ? { borderColor: c.accentColor, color: c.accentColor, background: `${c.accentColor}1a` }
                      : undefined
                  }
                >
                  <span>{c.name}</span>
                  <span className="library-filter-pill-count">{count}</span>
                </button>
              )
            })}
          </FilterGroup>
        ) : null}
      </div>

      {/* Grid */}
      <div className="library-body">
        <div className="library-grid">
          {paginated.map((b) => (
            <div key={b._id} className={`library-card${b.featured ? ' featured' : ''}`}>
              <div className="library-card-actions">
                {b.status === 'published' ? (
                  <a
                    className="library-card-action"
                    href={brochurePublicUrl(b)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`Open ${brochurePublicUrl(b).replace(/^https?:\/\//, '')}`}
                    aria-label="Open live brochure"
                  >
                    <ExternalLink size={14} strokeWidth={2} />
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
                  aria-label="Duplicate brochure"
                >
                  <Copy size={14} strokeWidth={2} />
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
                  aria-label="Delete brochure"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              </div>
              {b.featured ? (
                <div className="library-card-featured-badge" title="Featured — site root redirect">
                  <Star size={11} strokeWidth={2.4} fill="currentColor" />
                  <span>Featured</span>
                </div>
              ) : null}
              <Link href={`/admin/brochures/${b._id}/edit`} className="library-card-link">
                <div className="library-card-thumb-wrap">
                  <MiniCoverPreview brochure={b} />
                </div>
                <div className="library-card-body">
                  <div className="library-card-title">{b.title}</div>
                  <div className="library-card-meta">
                    <span className={`library-card-status ${b.status}`}>
                      <span className="library-card-status-dot" style={{ background: STATUS_DOT[b.status] }} />
                      <span>{b.status}</span>
                    </span>
                    <span className="library-card-meta-sep">·</span>
                    <span className="library-card-meta-text">{b.season}</span>
                    <span className="library-card-meta-sep">·</span>
                    <span className="library-card-meta-text">
                      {b.pageCount} {b.pageCount === 1 ? 'page' : 'pages'}
                    </span>
                  </div>
                  {b.event ? <div className="library-card-event">{b.event}</div> : null}
                  <div className="library-card-footer">
                    <div className="library-card-slug">
                      {(b.company?.domain || CANONICAL_HOST) + '/' + b.slug}
                    </div>
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
              aria-label="Previous page"
            >
              <ChevronLeft size={14} strokeWidth={2.2} />
              <span>Previous</span>
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
              aria-label="Next page"
            >
              <span>Next</span>
              <ChevronRight size={14} strokeWidth={2.2} />
            </button>
            <span className="library-pagination-info">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
          </div>
        ) : null}

        {filtered.length === 0 && brochures.length > 0 ? (
          <div className="library-empty">
            <Search size={32} strokeWidth={1.5} className="library-empty-icon" aria-hidden />
            <div className="library-empty-title">No brochures match your filters</div>
            <button className="library-empty-reset" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        ) : null}

        {brochures.length === 0 ? (
          <div className="library-empty">
            <Plus size={32} strokeWidth={1.5} className="library-empty-icon" aria-hidden />
            <div className="library-empty-title">No brochures yet</div>
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

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="library-filter-group">
      <span className="library-filter-group-label">{label}</span>
      <div className="library-filter-pills">{children}</div>
    </div>
  )
}

