'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  X,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  Star,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { NewBrochureModal, type DuplicateSource } from './NewBrochureModal'
import { AiGenerateModal } from './AiGenerateModal'
import { deleteBrochureAction } from '@/lib/sanity/actions'
import { brochurePublicUrl as brochurePublicUrlLib } from '@/lib/brochureHost'
import { MiniCoverPreview, type MiniBrochure } from './MiniCoverPreview'
import type { Brochure } from '@/types/brochure'

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

function editorLabel(by: { name?: string; email?: string } | undefined): string | null {
  if (!by) return null
  if (by.name?.trim()) return by.name.trim().split(/\s+/)[0]
  if (by.email) return by.email.split('@')[0]
  return null
}

function relativeTime(iso: string | undefined | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const sec = Math.max(0, Math.floor(diff / 1000))
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}d ago`
  if (day < 30) return `${Math.floor(day / 7)}w ago`
  if (day < 365) return `${Math.floor(day / 30)}mo ago`
  return `${Math.floor(day / 365)}y ago`
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
      {/* Header — title + count, primary actions right */}
      <div className="library-header">
        <div className="library-header-titleblock">
          <h1 className="library-title">Brochures</h1>
          <span className="library-title-count">
            {hasActiveFilters ? `${filtered.length} of ${brochures.length}` : brochures.length}
          </span>
        </div>
        <div className="library-header-actions">
          <button className="library-header-btn" onClick={() => setAiOpen(true)}>
            <Sparkles size={15} strokeWidth={2.4} />
            <span>Generate</span>
          </button>
          <button className="library-header-btn primary" onClick={() => setNewOpen(true)}>
            <Plus size={15} strokeWidth={2.4} />
            <span>New brochure</span>
          </button>
        </div>
      </div>

      {/* Toolbar — search left, dropdowns right */}
      <div className="library-toolbar">
        <div className="library-search">
          <Search size={14} strokeWidth={2} className="library-search-icon" aria-hidden />
          <input
            type="text"
            className="library-search-input"
            placeholder="Search…"
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
              <X size={13} strokeWidth={2.2} />
            </button>
          ) : null}
        </div>

        <div className="library-toolbar-controls">
          <select
            className="library-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value
                  ? `${opt.label} (${counts[opt.value] ?? 0})`
                  : `All status (${counts.all})`}
              </option>
            ))}
          </select>

          {seasons.length > 1 ? (
            <select
              className="library-select"
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              aria-label="Filter by season"
            >
              <option value="">All seasons</option>
              {seasons.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : null}

          {companies.length > 0 ? (
            <select
              className="library-select"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              aria-label="Filter by host"
            >
              <option value="">All hosts</option>
              <option value={CANONICAL_COMPANY_ID}>Grand Prix Grand Tours ({canonicalCount})</option>
              {companies.map((c) => {
                const count = brochures.filter((b) => b.company?._id === c._id).length
                return (
                  <option key={c._id} value={c._id}>
                    {c.name} ({count})
                  </option>
                )
              })}
            </select>
          ) : null}

          {hasActiveFilters ? (
            <button type="button" className="library-filter-clear" onClick={clearFilters} title="Clear filters">
              <X size={13} strokeWidth={2.2} />
              <span>Clear</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Grid */}
      <div className="library-body">
        <div className="library-grid">
          {paginated.map((b) => (
            <div key={b._id} className={`library-card${b.featured ? ' featured' : ''}`}>
              <Link href={`/admin/brochures/${b._id}/edit`} className="library-card-link">
                <div className="library-card-thumb-wrap">
                  <MiniCoverPreview brochure={b} />
                  {b.featured ? (
                    <span className="library-card-featured-glyph" title="Featured — site root redirect">
                      <Star size={10} strokeWidth={2.4} fill="currentColor" />
                    </span>
                  ) : null}
                </div>
                <div className="library-card-body">
                  <div className="library-card-title" title={b.title}>{b.title}</div>
                  <div className="library-card-meta">
                    <span className={`library-card-status ${b.status}`}>
                      
                      <span>{b.status}</span>
                    </span>
                    <span className="library-card-meta-sep" aria-hidden>·</span>
                    <span
                      className="library-card-meta-text"
                      title={b.lastEditedBy?.email ?? undefined}
                    >
                      Edited {relativeTime(b._updatedAt)}
                      {editorLabel(b.lastEditedBy) ? ` by ${editorLabel(b.lastEditedBy)}` : ''}
                    </span>
                  </div>
                </div>
              </Link>
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
                    <ExternalLink size={13} strokeWidth={2} />
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
                  <Copy size={13} strokeWidth={2} />
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
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
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

