'use client'

import { useState } from 'react'
import type { Brochure, Page } from '@/types/brochure'
import { labelFor } from '@/lib/sectionLabels'
import { nanokey } from '@/lib/nanokey'

type Props = {
  brochure: Brochure
  setBrochure: (updater: (prev: Brochure) => Brochure) => void
  currentPageIndex: number
  setCurrentPageIndex: (idx: number) => void
  currentSectionKey: string | null
  setCurrentSectionKey: (key: string | null) => void
  onRequestAddSection: (pageIndex: number) => void
}

/**
 * Pages tree — matches the builder's left panel.
 *
 * Top level: pages with number, name, rename/move/delete actions.
 * Nested: sections within each page with type label, move/delete actions.
 * Active page header has a red left-bar indicator + subtle tint.
 *
 * Add-section is delegated to the parent (BrochureEditor) which owns the
 * AddSectionModal state. We just fire onRequestAddSection(pageIndex).
 */
export function PagesPanel({
  brochure,
  setBrochure,
  currentPageIndex,
  setCurrentPageIndex,
  currentSectionKey,
  setCurrentSectionKey,
  onRequestAddSection,
}: Props) {
  const [renamingPageKey, setRenamingPageKey] = useState<string | null>(null)

  // ───────── Page mutations ─────────

  function addPage() {
    const newPage: Page = {
      _key: nanokey(),
      name: `Page ${brochure.pages.length + 1}`,
      sections: [],
    }
    setBrochure((prev) => ({ ...prev, pages: [...prev.pages, newPage] }))
    setCurrentPageIndex(brochure.pages.length)
    setCurrentSectionKey(null)
  }

  function renamePage(pageKey: string, name: string) {
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p._key === pageKey ? { ...p, name } : p)),
    }))
  }

  function deletePage(pageIndex: number) {
    if (brochure.pages.length <= 1) {
      if (!confirm('Delete the only page? The brochure will have no content.')) return
    } else {
      if (!confirm(`Delete "${brochure.pages[pageIndex].name}" and all its sections?`)) return
    }
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== pageIndex),
    }))
    if (currentPageIndex >= pageIndex && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
    setCurrentSectionKey(null)
  }

  function movePage(pageIndex: number, dir: -1 | 1) {
    const target = pageIndex + dir
    if (target < 0 || target >= brochure.pages.length) return
    setBrochure((prev) => {
      const next = [...prev.pages]
      ;[next[pageIndex], next[target]] = [next[target], next[pageIndex]]
      return { ...prev, pages: next }
    })
    if (currentPageIndex === pageIndex) setCurrentPageIndex(target)
    else if (currentPageIndex === target) setCurrentPageIndex(pageIndex)
  }

  // ───────── Section mutations ─────────

  function addSection(pageIndex: number) {
    onRequestAddSection(pageIndex)
  }

  function deleteSection(pageIndex: number, sectionKey: string) {
    const section = brochure.pages[pageIndex]?.sections.find((s) => s._key === sectionKey)
    if (!section) return
    if (!confirm(`Delete "${labelFor(section._type)}" section?`)) return
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) =>
        i === pageIndex ? { ...p, sections: p.sections.filter((s) => s._key !== sectionKey) } : p
      ),
    }))
    if (currentSectionKey === sectionKey) setCurrentSectionKey(null)
  }

  function moveSection(pageIndex: number, sectionKey: string, dir: -1 | 1) {
    setBrochure((prev) => {
      const page = prev.pages[pageIndex]
      if (!page) return prev
      const idx = page.sections.findIndex((s) => s._key === sectionKey)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= page.sections.length) return prev
      const next = [...page.sections]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return {
        ...prev,
        pages: prev.pages.map((p, i) => (i === pageIndex ? { ...p, sections: next } : p)),
      }
    })
  }

  // ───────── Render ─────────

  return (
    <>
      <div className="editor-pages-list">
        {brochure.pages.map((page, pageIndex) => {
          const isActive = pageIndex === currentPageIndex
          const isRenaming = renamingPageKey === page._key

          return (
            <div
              key={page._key}
              className={`editor-page-group ${isActive ? 'active-page' : ''}`.trim()}
            >
              <div
                className="editor-page-group-header"
                onClick={() => {
                  if (isRenaming) return
                  setCurrentPageIndex(pageIndex)
                  setCurrentSectionKey(null)
                }}
              >
                <span className="editor-page-num">
                  {String(pageIndex + 1).padStart(2, '0')}
                </span>

                {isRenaming ? (
                  <input
                    className="editor-page-name-input"
                    defaultValue={page.name}
                    autoFocus
                    onBlur={(e) => {
                      const trimmed = e.currentTarget.value.trim() || 'Untitled'
                      renamePage(page._key, trimmed)
                      setRenamingPageKey(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setRenamingPageKey(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="editor-page-name">{page.name}</span>
                )}

                <div className="editor-page-group-actions" onClick={(e) => e.stopPropagation()}>
                  <IconBtn label="Rename" onClick={() => setRenamingPageKey(page._key)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                  </IconBtn>
                  <IconBtn label="Move up" onClick={() => movePage(pageIndex, -1)} disabled={pageIndex === 0}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  </IconBtn>
                  <IconBtn label="Move down" onClick={() => movePage(pageIndex, 1)} disabled={pageIndex === brochure.pages.length - 1}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </IconBtn>
                  <IconBtn label="Delete" danger onClick={() => deletePage(pageIndex)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </IconBtn>
                </div>
              </div>

              <div className="editor-section-list">
                {page.sections.map((section, sectionIndex) => {
                  const isSectionActive = currentSectionKey === section._key
                  return (
                    <div
                      key={section._key}
                      className={`editor-section-item ${isSectionActive ? 'active-section' : ''}`.trim()}
                      onClick={() => {
                        setCurrentPageIndex(pageIndex)
                        setCurrentSectionKey(section._key)
                      }}
                    >
                      <span className="editor-section-num">
                        {String(sectionIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="editor-section-type">{labelFor(section._type)}</span>
                      <div className="editor-section-item-actions" onClick={(e) => e.stopPropagation()}>
                        <IconBtn label="Move up" onClick={() => moveSection(pageIndex, section._key, -1)} disabled={sectionIndex === 0}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </IconBtn>
                        <IconBtn label="Move down" onClick={() => moveSection(pageIndex, section._key, 1)} disabled={sectionIndex === page.sections.length - 1}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </IconBtn>
                        <IconBtn label="Delete" danger onClick={() => deleteSection(pageIndex, section._key)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </IconBtn>
                      </div>
                    </div>
                  )
                })}
                <button
                  className="editor-add-section"
                  onClick={() => addSection(pageIndex)}
                  title="Add section"
                >
                  + Add section
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="editor-pages-footer">
        <button className="editor-add-page" onClick={addPage}>
          + Add page
        </button>
      </div>
    </>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className={`editor-icon-btn ${danger ? 'danger' : ''}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
