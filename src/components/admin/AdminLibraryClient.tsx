'use client'

import { useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { NewBrochureModal, type DuplicateSource } from './NewBrochureModal'
import { AiGenerateModal } from './AiGenerateModal'
import { deleteBrochureAction } from '@/lib/sanity/actions'

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
}

type Props = {
  brochures: BrochureRow[]
}

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
export function AdminLibraryClient({ brochures }: Props) {
  const router = useRouter()
  const [deletePending, startDeleteTransition] = useTransition()
  const [newOpen, setNewOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [duplicateSource, setDuplicateSource] = useState<DuplicateSource | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [seasonFilter, setSeasonFilter] = useState('')

  const seasons = useMemo(() => {
    const s = new Set(brochures.map((b) => b.season).filter(Boolean))
    return Array.from(s).sort().reverse()
  }, [brochures])

  const filtered = useMemo(() => {
    let list = brochures
    if (statusFilter) list = list.filter((b) => b.status === statusFilter)
    if (seasonFilter) list = list.filter((b) => b.season === seasonFilter)
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
  }, [brochures, statusFilter, seasonFilter, search])

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
  const filterKey = `${statusFilter}|${seasonFilter}|${search}`
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
        </div>
      </div>

      {/* Grid */}
      <div className="library-body">
        <div className="library-grid">
          {paginated.map((b) => (
            <div key={b._id} className="library-card">
              <div className="library-card-actions">
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
                    </span>
                    <span>{b.season} · {b.pageCount} {b.pageCount === 1 ? 'page' : 'pages'}</span>
                  </div>
                  {b.event ? (
                    <div className="library-card-event">{b.event}</div>
                  ) : null}
                  <div className="library-card-slug">/{b.slug}</div>
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
            <button className="library-empty-reset" onClick={() => { setSearch(''); setStatusFilter(''); setSeasonFilter('') }}>
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

      <NewBrochureModal open={newOpen} onClose={() => setNewOpen(false)} />
      <NewBrochureModal
        open={duplicateSource !== null}
        onClose={() => setDuplicateSource(null)}
        duplicateFrom={duplicateSource ?? undefined}
      />
      <AiGenerateModal open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  )
}
