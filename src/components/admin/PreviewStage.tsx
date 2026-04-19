'use client'

import { useEffect, useRef } from 'react'
import type { Brochure } from '@/types/brochure'
import { SectionRenderer } from '../brochure/SectionRenderer'

type Props = {
  brochure: Brochure
  currentPageIndex: number
  currentSectionKey: string | null
  setCurrentSectionKey: (key: string | null) => void
}

/**
 * Preview stage — centre panel of the editor.
 *
 * Renders the current page inside a 16:10 frame, using the exact same
 * Section components as the public reader. Clicking anywhere on a section
 * selects it for editing in the right panel.
 *
 * The frame uses `container-type: size` so the brochure CSS's `cqi`/`cqh`
 * units scale relative to the frame, not the viewport — same design tokens,
 * smaller canvas. When a page has multiple sections stacked vertically, the
 * frame scrolls.
 */
export function PreviewStage({
  brochure,
  currentPageIndex,
  currentSectionKey,
  setCurrentSectionKey,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const page = brochure.pages[currentPageIndex]
  const total = brochure.pages.length

  // Scroll the selected section into view when the selection changes
  // (e.g. user clicks a section in the left panel)
  useEffect(() => {
    if (!currentSectionKey) return
    const el = frameRef.current?.querySelector<HTMLElement>(
      `[data-section-key="${currentSectionKey}"]`
    )
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } catch {
        // Older browsers without smooth support
        el.scrollIntoView()
      }
    }
  }, [currentSectionKey])

  // ───────── Empty states ─────────

  if (brochure.pages.length === 0) {
    return <EmptyState title="Empty brochure" hint="Use “+ Add page” in the left panel to get started." />
  }
  if (!page) {
    return <EmptyState title="Page not found" hint={`currentPageIndex = ${currentPageIndex}`} />
  }
  if (page.sections.length === 0) {
    return (
      <EmptyState
        title={`${page.name} · empty page`}
        hint="Use “+ Add section” in the left panel to add content."
      />
    )
  }

  // ───────── Normal render ─────────

  return (
    <div className="preview-stage-wrap">
      <div className="preview-stage-label">
        <span className="preview-stage-label-num">
          {String(currentPageIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="preview-stage-label-name">{page.name}</span>
      </div>
      <div
        className="preview-stage-frame"
        data-theme={brochure.theme ?? 'dark'}
        ref={frameRef}
      >
        <div className="brochure-page" style={{ width: '100%' }}>
          {page.sections.map((section) => {
            const isSelected = currentSectionKey === section._key
            return (
              <div
                key={section._key}
                className={`preview-section-hitbox ${isSelected ? 'selected' : ''}`.trim()}
                data-section-key={section._key}
                onClick={() => setCurrentSectionKey(section._key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCurrentSectionKey(section._key)
                  }
                }}
              >
                <SectionRenderer
                  section={section}
                  pageNum={currentPageIndex + 1}
                  total={total}
                  showFolio={currentPageIndex > 0}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="preview-stage-empty">
      <div className="preview-stage-empty-icon">00</div>
      <div className="preview-stage-empty-title">{title}</div>
      <div className="preview-stage-empty-hint">{hint}</div>
    </div>
  )
}
