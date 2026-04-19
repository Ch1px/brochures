'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrochureAction, duplicateBrochureAction } from '@/lib/sanity/actions'

export type DuplicateSource = {
  id: string
  title: string
  slug: string
  season: string
  event?: string
}

type Props = {
  open: boolean
  onClose: () => void
  /** When set, the modal runs in duplicate mode and prefills from the source. */
  duplicateFrom?: DuplicateSource
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

/**
 * New / duplicate brochure modal — triggered from the admin library.
 * In "new" mode: calls createBrochureAction.
 * In "duplicate" mode (`duplicateFrom` set): prefills the source values,
 * lets the admin rename, and calls duplicateBrochureAction. Always redirects
 * to the editor on success.
 */
export function NewBrochureModal({ open, onClose, duplicateFrom }: Props) {
  const router = useRouter()
  const isDuplicate = Boolean(duplicateFrom)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugDirty, setSlugDirty] = useState(false)
  const [season, setSeason] = useState('2026')
  const [event, setEvent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Reset form when the modal is dismissed and reopened.
  // In duplicate mode, prefill with the source values (suffixed) so the admin
  // sees a sensible default they can immediately accept or tweak.
  useEffect(() => {
    if (!open) {
      setTitle('')
      setSlug('')
      setSlugDirty(false)
      setSeason('2026')
      setEvent('')
      setError(null)
      return
    }
    if (duplicateFrom) {
      setTitle(`${duplicateFrom.title} (copy)`)
      setSlug(`${duplicateFrom.slug}-copy`)
      setSlugDirty(true)
      setSeason(duplicateFrom.season)
      setEvent(duplicateFrom.event ?? '')
      setError(null)
    }
  }, [open, duplicateFrom])

  // Auto-derive slug from title unless the user has edited it manually
  useEffect(() => {
    if (!slugDirty) setSlug(slugify(title))
  }, [title, slugDirty])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !pending) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, pending])

  if (!open) return null

  function handleSubmit() {
    if (!title.trim() || !slug.trim() || !season.trim()) {
      setError('Title, slug, and season are required.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = duplicateFrom
        ? await duplicateBrochureAction(duplicateFrom.id, {
            title: title.trim(),
            slug: slug.trim(),
            season: season.trim(),
            event: event.trim() || undefined,
          })
        : await createBrochureAction({
            title: title.trim(),
            slug: slug.trim(),
            season: season.trim(),
            event: event.trim() || undefined,
          })
      if (res.ok) {
        router.push(`/admin/brochures/${res.id}/edit`)
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="add-section-overlay" onClick={pending ? undefined : onClose} role="dialog" aria-modal="true" aria-label={isDuplicate ? 'Duplicate brochure' : 'New brochure'}>
      <div className="add-section-modal new-brochure-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">{isDuplicate ? 'Duplicate' : 'New'}</div>
            <h2 className="add-section-modal-title">
              {isDuplicate ? `Duplicate "${duplicateFrom!.title}"` : 'Create a brochure'}
            </h2>
          </div>
          <button
            type="button"
            className="add-section-close"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="new-brochure-body">
          <div className="field-group">
            <label className="field-label">Title</label>
            <input
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monaco Grand Prix 2026"
              autoFocus
            />
          </div>

          <div className="field-group">
            <label className="field-label">URL slug</label>
            <div className="field-description">
              Public URL path. Auto-derived from title; edit to override.
            </div>
            <input
              className="field-input"
              value={slug}
              onChange={(e) => {
                setSlugDirty(true)
                setSlug(slugify(e.target.value))
              }}
              placeholder="monaco-grand-prix-2026"
            />
          </div>

          <div className="new-brochure-row">
            <div className="field-group">
              <label className="field-label">Season</label>
              <select
                className="field-input field-select"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              >
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Event (optional)</label>
              <input
                className="field-input"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                placeholder="Monaco"
              />
            </div>
          </div>

          {error ? <div className="field-error">{error}</div> : null}
        </div>

        <footer className="new-brochure-footer">
          <button className="editor-topbar-btn" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button className="editor-topbar-btn primary" onClick={handleSubmit} disabled={pending}>
            {pending
              ? isDuplicate
                ? 'Duplicating…'
                : 'Creating…'
              : isDuplicate
                ? 'Duplicate & open'
                : 'Create & open'}
          </button>
        </footer>
      </div>
    </div>
  )
}
