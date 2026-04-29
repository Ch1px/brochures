'use client'

import type { Brochure } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'
import { BrochureBrandingProvider } from './BrochureContext'
import { GoogleFontsLink } from './GoogleFontsLink'
import { TextureOverride } from './TextureOverride'
import { LogoMark } from './LogoMark'
import { accentColorVars } from '@/lib/accentColor'
import { backgroundColorVars, textColorVars, navColorVars } from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'

type Props = {
  brochure: Brochure
}

/**
 * Static, server-rendered version of the public reader. Emits the same
 * DOM as `BrochureReader` (preview-mode wrapper, slider, top nav, bottom
 * pill) but without any client hooks. Used as the source URL for the
 * offline `index.html` export — the export pipeline drives Puppeteer to
 * /[slug]/static-export, captures this DOM, and pairs it with a vanilla-JS
 * runtime that re-implements the slider/nav/animation interactivity.
 *
 * Data hooks the runtime relies on (kept in sync with
 * src/lib/htmlExport/runtime.ts):
 *   - `[data-page-count]`           on the slider — total page count
 *   - `[data-page-link]`            on every clickable target (nav links,
 *                                     dots, burger menu items)
 *   - `[data-prev]` / `[data-next]` on the bottom-pill arrow buttons
 *   - `[data-counter-current]`      on the active page number
 *   - `[data-counter-total]`        on the total page number
 *   - `[data-burger]`               on the mobile burger toggle
 *   - `[data-menu]`                 on the burger overlay
 *
 * Animations: sections render through `SectionRenderer` directly (no
 * `AnimatedSection` wrapper). The injected runtime sets up the
 * IntersectionObserver + scroll listeners that toggle `.is-in-view`,
 * mirroring `AnimatedSection.tsx` so the fade-ups still fire offline.
 */
export function BrochureStaticView({ brochure }: Props) {
  const pages = brochure.pages ?? []
  const total = pages.length
  const theme = brochure.theme ?? 'dark'
  const accentStyle = accentColorVars(brochure.accentColor)
  const bgStyle = backgroundColorVars(brochure.backgroundColor)
  const textStyle = textColorVars(brochure.textColor)
  const fontStyle = fontOverrideVars(brochure.fontOverrides)
  const navStyle = navColorVars(brochure.navColor)
  const fontsUrl = googleFontsUrl(brochure.fontOverrides)

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
    <BrochureBrandingProvider value={{ accentColor: brochure.accentColor, backgroundColor: brochure.backgroundColor, textColor: brochure.textColor, titleColor: brochure.titleColor, fontOverrides: brochure.fontOverrides, customColors: brochure.customColors, logo: brochure.logo, theme }}>
      <GoogleFontsLink url={fontsUrl} />
      <TextureOverride hideTexture={brochure.hideTexture} textureImage={brochure.textureImage} />
      <div
        className="preview-mode visible"
        data-theme={theme}
        data-custom-bg={brochure.backgroundColor ? '' : undefined}
        style={{ position: 'fixed', inset: 0, display: 'block', zIndex: 1, ...accentStyle, ...bgStyle, ...textStyle, ...fontStyle, ...navStyle }}
      >
        <nav className="brochure-nav" data-nav-ctx="public">
          <div className="brochure-nav-brand">
            <LogoMark logo={brochure.logo} theme={theme} className="brochure-nav-brand-logo" />
            <span className="brochure-nav-brand-name">{brochure.title}</span>
          </div>

          <div className="brochure-nav-links">
            {pages.map((p, i) => (
              <button
                key={p._key}
                type="button"
                className={`brochure-nav-link ${i === 0 ? 'active' : ''}`}
                data-page-link={i}
              >
                {p.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="brochure-nav-burger"
            aria-label="Open menu"
            aria-expanded="false"
            data-burger
          >
            <span className="brochure-nav-burger-bar" aria-hidden />
            <span className="brochure-nav-burger-bar" aria-hidden />
            <span className="brochure-nav-burger-bar" aria-hidden />
          </button>

          <div className="brochure-nav-menu" role="menu" data-menu>
            {pages.map((p, i) => (
              <button
                key={p._key}
                type="button"
                className={`brochure-nav-menu-item ${i === 0 ? 'active' : ''}`}
                data-page-link={i}
              >
                {p.name}
              </button>
            ))}
          </div>
        </nav>

        <div className="preview-mode-canvas">
          <div
            className="preview-mode-slider"
            data-page-count={total}
            style={{
              top: 'var(--brochure-nav-h, 52px)',
              left: 0,
              width: '100vw',
              height: 'calc(100dvh - var(--brochure-nav-h, 52px))',
              transform: 'translateX(0)',
            }}
          >
            {pages.map((page, i) => {
              const pageNum = i + 1
              const hasFooter = page.sections.some((s) => s._type === 'footer')
              const showFolio = i > 0 && !hasFooter
              return (
                <div
                  key={page._key}
                  className="brochure-page"
                  data-page-index={i}
                  style={{ width: '100vw' }}
                >
                  {page.sections.map((section) => (
                    <SectionRenderer
                      key={section._key}
                      section={section}
                      pageNum={pageNum}
                      total={total}
                      showFolio={section._type === 'footer' ? false : showFolio}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        <div className="preview-mode-nav">
          <button
            className="preview-mode-nav-btn"
            data-prev
            disabled
            aria-label="Previous page"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className="preview-mode-counter">
            <span className="current" data-counter-current>
              {String(1).padStart(2, '0')}
            </span>
            <span style={{ opacity: 0.4 }}>/</span>
            <span data-counter-total>{String(total).padStart(2, '0')}</span>
          </div>
          <div className="preview-mode-dots">
            {pages.map((p, i) => (
              <button
                key={p._key}
                className={`preview-mode-dot ${i === 0 ? 'active' : ''}`}
                data-page-link={i}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
          <button
            className="preview-mode-nav-btn"
            data-next
            aria-label="Next page"
            {...(total <= 1 ? { disabled: true } : {})}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </BrochureBrandingProvider>
  )
}
