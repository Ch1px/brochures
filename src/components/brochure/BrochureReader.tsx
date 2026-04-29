'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Brochure } from '@/types/brochure'
import { BrochureNav } from './BrochureNav'
import { AnimatedSection } from './AnimatedSection'
import { BrochureBrandingProvider } from './BrochureContext'
import { GoogleFontsLink } from './GoogleFontsLink'
import { TextureOverride } from './TextureOverride'
import { CustomFontFaces } from './CustomFontFaces'
import { accentColorVars } from '@/lib/accentColor'
import { backgroundColorVars, textColorVars, navColorVars } from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'
import { textScaleVars } from '@/lib/textScale'

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

  // Map page _key → index for #page-{key} CTA links
  const keyToIndex = useMemo(
    () => Object.fromEntries(pages.map((p, i) => [p._key, i])),
    [pages]
  )

  // Event delegation for internal CTA links (#next, #page-{key})
  const handleCtaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]')
      if (!anchor) return
      const href = anchor.getAttribute('href')!
      if (href === '#next') {
        e.preventDefault()
        next()
      } else if (href.startsWith('#page-')) {
        e.preventDefault()
        const key = href.slice(6)
        const idx = keyToIndex[key]
        if (idx != null) goTo(idx)
      }
      // #enquire: let pass through for future modal handler
    },
    [next, goTo, keyToIndex]
  )

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

  const theme = brochure.theme ?? 'dark'
  const accentStyle = accentColorVars(brochure.accentColor)
  const bgStyle = backgroundColorVars(brochure.backgroundColor)
  const textStyle = textColorVars(brochure.textColor)
  const fontStyle = fontOverrideVars(brochure.fontOverrides, brochure.customFonts)
  const navStyle = navColorVars(brochure.navColor)
  const scaleStyle = textScaleVars(brochure)
  const fontsUrl = googleFontsUrl(brochure.fontOverrides)

  return (
    <BrochureBrandingProvider value={{ accentColor: brochure.accentColor, backgroundColor: brochure.backgroundColor, textColor: brochure.textColor, fontOverrides: brochure.fontOverrides, customColors: brochure.customColors, logo: brochure.logo, theme }}>
    <GoogleFontsLink url={fontsUrl} />
    <CustomFontFaces customFonts={brochure.customFonts} />
    <TextureOverride hideTexture={brochure.hideTexture} textureImage={brochure.textureImage} />
    <div
      className="preview-mode visible"
      data-theme={theme}
      style={{ position: 'fixed', inset: 0, display: 'block', zIndex: 1, ...accentStyle, ...bgStyle, ...textStyle, ...fontStyle, ...navStyle, ...scaleStyle }}
    >
      <BrochureNav
        brand={brochure.title}
        pages={pages.map((p, i) => ({ name: p.name, index: i }))}
        currentIndex={pageIndex}
        onPageClick={goTo}
        logo={brochure.logo}
        theme={theme}
      />

      <div className="preview-mode-canvas">
        <div
          className="preview-mode-slider"
          onClick={handleCtaClick}
          style={{
            top: 'var(--brochure-nav-h, 52px)',
            left: 0,
            width: '100vw',
            height: 'calc(100dvh - var(--brochure-nav-h, 52px))',
            transform,
          }}
        >
          {pages.map((page, i) => {
            const pageNum = i + 1
            const hasFooter = page.sections.some((s) => s._type === 'footer')
            const showFolio = i > 0 && !hasFooter // footer replaces the folio
            const isActivePage = i === pageIndex
            return (
              <div key={page._key} className="brochure-page" style={{ width: '100vw' }}>
                {page.sections.map((section) => (
                  <AnimatedSection
                    key={section._key}
                    section={section}
                    pageNum={pageNum}
                    total={total}
                    showFolio={section._type === 'footer' ? false : showFolio}
                    isActivePage={isActivePage}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Page turner — counter + prev/next arrows, bottom right */}
      <div className="preview-mode-nav">
        <div className="preview-mode-counter">
          {String(pageIndex + 1).padStart(2, '0')}
          <span className="preview-mode-counter-sep">/</span>
          {String(total).padStart(2, '0')}
        </div>
        <div className="preview-mode-nav-buttons">
        <button
          className="preview-mode-nav-btn"
          onClick={prev}
          disabled={pageIndex <= 0}
          aria-label="Previous page"
        >
          <svg viewBox="0 0 40 40" fill="currentColor" width="24" height="24" aria-hidden>
            <path d="m20 33.4l-13.4-13.4 13.4-13.4 2.3 2.4-9.3 9.4h20.4v3.2h-20.4l9.3 9.4z" />
          </svg>
        </button>
        <button
          className="preview-mode-nav-btn"
          onClick={next}
          disabled={pageIndex >= total - 1}
          aria-label="Next page"
        >
          <svg viewBox="0 0 40 40" fill="currentColor" width="24" height="24" aria-hidden>
            <path d="m20 6.6l13.4 13.4-13.4 13.4-2.3-2.4 9.3-9.4h-20.4v-3.2h20.4l-9.3-9.4z" />
          </svg>
        </button>
        </div>
      </div>
    </div>
    </BrochureBrandingProvider>
  )
}
