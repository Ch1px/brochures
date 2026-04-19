'use client'

import { useEffect, useRef } from 'react'
import type { Section } from '@/types/brochure'
import { SECTION_LABELS, SECTION_DESCRIPTIONS } from '@/lib/sectionLabels'
import { SECTION_PREVIEW_HTML, SECTION_PICKER_ORDER } from '@/lib/sectionPreviews'

type Props = {
  open: boolean
  onClose: () => void
  onPick: (type: Section['_type']) => void
}

/**
 * Add Section modal — a grid of all 19 section types with mini-previews.
 * Matches the builder's modal:
 *   - Each card shows the mini-preview, label, and description.
 *   - Hover highlights the card in brand red.
 *   - Clicking a card calls onPick(type) and closes the modal.
 *   - Escape closes. Clicking the backdrop closes.
 *
 * The mini-preview HTML is inlined via dangerouslySetInnerHTML — safe here
 * because the content is static markup from our own codebase.
 */
export function AddSectionModal({ open, onClose, onPick }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Focus the close button so Escape works without clicking first
    closeBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    // Lock body scroll while open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="add-section-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Add section">
      <div className="add-section-modal" onClick={(e) => e.stopPropagation()}>
        <header className="add-section-modal-header">
          <div>
            <div className="add-section-modal-eyebrow">Section</div>
            <h2 className="add-section-modal-title">Add a section</h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            className="add-section-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="add-section-grid">
          {SECTION_PICKER_ORDER.map((type) => (
            <button
              key={type}
              type="button"
              className="add-section-card"
              onClick={() => {
                onPick(type)
                onClose()
              }}
            >
              <div
                className="add-section-preview"
                dangerouslySetInnerHTML={{ __html: SECTION_PREVIEW_HTML[type] }}
              />
              <div className="add-section-label">{SECTION_LABELS[type]}</div>
              <div className="add-section-description">{SECTION_DESCRIPTIONS[type]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
