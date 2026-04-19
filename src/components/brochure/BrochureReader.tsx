'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Brochure } from '@/types/brochure'
import { BrochureNav } from './BrochureNav'
import { AnimatedSection } from './AnimatedSection'

type Props = {
  brochure: Brochure
}

/**
 * Full-viewport brochure reader. Mirrors the builder's preview-mode experience:
 * - top nav with page links + burger on mobile
 * - horizontal slider, each page is width: 100vw and slides via translateX
 * - fixed prev/next pill at the bottom with page counter + dots
 * - keyboard arrows navigate between pages
 */
export function BrochureReader({ brochure }: Props) {
  const pages = brochure.pages ?? []
  const total = pages.length
  const [pageIndex, setPageIndex] = useState(0)

  const goTo = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= total) return
      setPageIndex(idx)
    },
    [total]
  )

  const next = useCallback(() => goTo(pageIndex + 1), [pageIndex, goTo])
  const prev = useCallback(() => goTo(pageIndex - 1), [pageIndex, goTo])

  // Keyboard arrow navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const transform = useMemo(() => `translateX(${pageIndex * -100}vw)`, [pageIndex])

  if (total === 0) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        This brochure has no pages.
      </main>
    )
  }

  return (
    <div
      className="preview-mode visible"
      data-theme={brochure.theme ?? 'dark'}
      style={{ position: 'fixed', inset: 0, display: 'block', zIndex: 1 }}
    >
      <BrochureNav
        brand={brochure.title}
        pages={pages.map((p, i) => ({ name: p.name, index: i }))}
        currentIndex={pageIndex}
        onPageClick={goTo}
      />

      <div className="preview-mode-canvas">
        <div
          className="preview-mode-slider"
          style={{
            top: 'var(--brochure-nav-h, 52px)',
            left: 0,
            width: '100vw',
            height: 'calc(100vh - var(--brochure-nav-h, 52px))',
            transform,
          }}
        >
          {pages.map((page, i) => {
            const pageNum = i + 1
            const showFolio = i > 0 // cover rarely shows folio
            return (
              <div key={page._key} className="brochure-page" style={{ width: '100vw' }}>
                {page.sections.map((section) => (
                  <AnimatedSection
                    key={section._key}
                    section={section}
                    pageNum={pageNum}
                    total={total}
                    showFolio={showFolio}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom pill — prev / counter / dots / next */}
      <div className="preview-mode-nav">
        <button
          className="preview-mode-nav-btn"
          onClick={prev}
          disabled={pageIndex <= 0}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="preview-mode-counter">
          <span className="current">{String(pageIndex + 1).padStart(2, '0')}</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>{String(total).padStart(2, '0')}</span>
        </div>
        <div className="preview-mode-dots">
          {pages.map((p, i) => (
            <button
              key={p._key}
              className={`preview-mode-dot ${i === pageIndex ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
        <button
          className="preview-mode-nav-btn"
          onClick={next}
          disabled={pageIndex >= total - 1}
          aria-label="Next page"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}
