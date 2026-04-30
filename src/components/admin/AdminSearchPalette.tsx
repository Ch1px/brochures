'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Building2, Image as ImageIcon, ArrowRight } from 'lucide-react'

export type SearchIndex = {
  brochures: { _id: string; title: string; slug: string; season?: string; event?: string; status: string }[]
  companies: { _id: string; name: string; domain: string }[]
  media: { _id: string; filename?: string }[]
}

type ResultItem =
  | { kind: 'brochure'; id: string; title: string; subtitle: string; href: string }
  | { kind: 'company'; id: string; title: string; subtitle: string; href: string }
  | { kind: 'media'; id: string; title: string; subtitle: string; href: string }

const ICONS = {
  brochure: FileText,
  company: Building2,
  media: ImageIcon,
} as const

const KIND_LABELS = {
  brochure: 'Brochures',
  company: 'Companies',
  media: 'Media',
} as const

type Props = {
  open: boolean
  onClose: () => void
  index: SearchIndex
}

/**
 * Global command palette for the admin. Filters across brochures,
 * companies, and media filenames by simple case-insensitive substring
 * match. Keyboard nav: ↑/↓ to move, Enter to select, Esc to close.
 *
 * Triggered from the topbar search button or ⌘K / Ctrl+K (registered
 * globally by `AdminShell`).
 */
export function AdminSearchPalette({ open, onClose, index }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Reset query and focus the input each time the palette opens.
  useEffect(() => {
    if (!open) return
    setQuery('')
    setActiveIdx(0)
    // requestAnimationFrame so focus lands after the modal mount + layout
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase()
    const out: ResultItem[] = []

    // No query → show top 8 most recent brochures as a "starter" view.
    // Useful since most palette uses are jumping to a brochure.
    if (!q) {
      for (const b of index.brochures.slice(0, 8)) {
        out.push({
          kind: 'brochure',
          id: b._id,
          title: b.title,
          subtitle: [b.season, b.event].filter(Boolean).join(' · ') || b.status,
          href: `/admin/brochures/${b._id}/edit`,
        })
      }
      return out
    }

    for (const b of index.brochures) {
      const hay = `${b.title} ${b.slug} ${b.event ?? ''} ${b.season ?? ''}`.toLowerCase()
      if (hay.includes(q)) {
        out.push({
          kind: 'brochure',
          id: b._id,
          title: b.title,
          subtitle: [b.season, b.event].filter(Boolean).join(' · ') || b.status,
          href: `/admin/brochures/${b._id}/edit`,
        })
      }
      if (out.length >= 12) break
    }

    for (const c of index.companies) {
      const hay = `${c.name} ${c.domain}`.toLowerCase()
      if (hay.includes(q)) {
        out.push({
          kind: 'company',
          id: c._id,
          title: c.name,
          subtitle: c.domain,
          href: `/admin?company=${c._id}`,
        })
      }
      if (out.length >= 18) break
    }

    for (const m of index.media) {
      const name = (m.filename ?? '').toLowerCase()
      if (name && name.includes(q)) {
        out.push({
          kind: 'media',
          id: m._id,
          title: m.filename ?? 'Untitled',
          subtitle: 'Image asset',
          href: `/admin/media`,
        })
      }
      if (out.length >= 24) break
    }

    return out
  }, [query, index])

  // Group results by kind for section headers.
  const grouped = useMemo(() => {
    const buckets: Record<ResultItem['kind'], ResultItem[]> = {
      brochure: [],
      company: [],
      media: [],
    }
    for (const r of results) buckets[r.kind].push(r)
    return buckets
  }, [results])

  // Clamp active index when results change so it never points past the end.
  useEffect(() => {
    if (activeIdx >= results.length) setActiveIdx(Math.max(0, results.length - 1))
  }, [results.length, activeIdx])

  // Scroll the active row into view as the user arrows up/down through
  // longer result lists.
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  function selectAt(idx: number) {
    const item = results[idx]
    if (!item) return
    onClose()
    router.push(item.href)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(results.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectAt(activeIdx)
    }
  }

  if (!open) return null

  let runningIdx = -1

  return (
    <div className="admin-search-overlay" onMouseDown={onClose}>
      <div
        className="admin-search-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Search admin"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        tabIndex={-1}
      >
        <div className="admin-search-input-row">
          <Search size={15} strokeWidth={2} className="admin-search-input-icon" aria-hidden />
          <input
            ref={inputRef}
            type="text"
            className="admin-search-input"
            placeholder="Search brochures, companies, media…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIdx(0)
            }}
          />
          <span className="admin-search-input-hint" aria-hidden>esc</span>
        </div>

        <div className="admin-search-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="admin-search-empty">
              No matches for &ldquo;{query.trim()}&rdquo;
            </div>
          ) : (
            (['brochure', 'company', 'media'] as const).map((kind) => {
              const items = grouped[kind]
              if (items.length === 0) return null
              return (
                <div key={kind} className="admin-search-group">
                  <div className="admin-search-group-label">{KIND_LABELS[kind]}</div>
                  {items.map((item) => {
                    runningIdx += 1
                    const idx = runningIdx
                    const Icon = ICONS[item.kind]
                    const active = idx === activeIdx
                    return (
                      <button
                        key={item.id}
                        type="button"
                        data-idx={idx}
                        className={`admin-search-row${active ? ' active' : ''}`}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => selectAt(idx)}
                      >
                        <Icon size={14} strokeWidth={2} className="admin-search-row-icon" aria-hidden />
                        <span className="admin-search-row-text">
                          <span className="admin-search-row-title">{item.title}</span>
                          {item.subtitle ? (
                            <span className="admin-search-row-subtitle">{item.subtitle}</span>
                          ) : null}
                        </span>
                        {active ? (
                          <ArrowRight size={13} strokeWidth={2} className="admin-search-row-arrow" aria-hidden />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )
            })
          )}
        </div>

        <div className="admin-search-footer">
          <span className="admin-search-footer-hint"><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span className="admin-search-footer-hint"><kbd>↵</kbd> select</span>
          <span className="admin-search-footer-hint"><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
