'use client'

import type { Brochure } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'
import { BrochureBrandingProvider } from './BrochureContext'
import { GoogleFontsLink } from './GoogleFontsLink'
import { TextureOverride } from './TextureOverride'
import { CustomFontFaces } from './CustomFontFaces'
import { LogoMark } from './LogoMark'
import { accentColorVars } from '@/lib/accentColor'
import { backgroundColorVars, textColorVars, titleColorVars, titleStyleVars, eyebrowStyleVars, navColorVars, overlayBaseVars } from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'
import { textScaleVars } from '@/lib/textScale'
import {
  resolvedAccentColor,
  resolvedBackgroundColor,
  resolvedEyebrowItalic,
  resolvedEyebrowTransform,
  resolvedFontOverrides,
  resolvedHideTexture,
  resolvedLogo,
  resolvedNavColor,
  resolvedTextColor,
  resolvedTextureImage,
  resolvedTheme,
  resolvedTitleColor,
  resolvedTitleItalic,
  resolvedTitleTransform,
  resolvedTextScales,
} from '@/lib/brochureBranding'

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
  // Effective branding falls back to the host company's defaults when the
  // brochure-level field is unset. See `lib/brochureBranding.ts`.
  const theme = resolvedTheme(brochure) ?? 'dark'
  const effectiveAccent = resolvedAccentColor(brochure)
  const effectiveLogo = resolvedLogo(brochure)
  const effectiveBackground = resolvedBackgroundColor(brochure)
  const effectiveText = resolvedTextColor(brochure)
  const effectiveTitle = resolvedTitleColor(brochure)
  const effectiveNav = resolvedNavColor(brochure)
  const effectiveTexture = resolvedTextureImage(brochure)
  const effectiveHideTexture = resolvedHideTexture(brochure)
  const effectiveFontOverrides = resolvedFontOverrides(brochure)
  const accentStyle = accentColorVars(effectiveAccent)
  const bgStyle = backgroundColorVars(effectiveBackground)
  const textStyle = textColorVars(effectiveText)
  const titleStyle = titleColorVars(effectiveTitle)
  const titleStyle2 = titleStyleVars(resolvedTitleItalic(brochure), resolvedTitleTransform(brochure))
  const eyebrowStyle = eyebrowStyleVars(resolvedEyebrowItalic(brochure), resolvedEyebrowTransform(brochure))
  const fontStyle = fontOverrideVars(effectiveFontOverrides, brochure.customFonts)
  const navStyle = navColorVars(effectiveNav)
  const overlayStyle = overlayBaseVars(effectiveBackground)
  const scaleStyle = textScaleVars(resolvedTextScales(brochure))
  const fontsUrl = googleFontsUrl(effectiveFontOverrides)

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
    <BrochureBrandingProvider value={{ accentColor: effectiveAccent, backgroundColor: effectiveBackground, textColor: effectiveText, titleColor: effectiveTitle, fontOverrides: effectiveFontOverrides, customColors: brochure.customColors, logo: effectiveLogo, theme, staticExport: true }}>
      <GoogleFontsLink url={fontsUrl} />
      <CustomFontFaces customFonts={brochure.customFonts} />
      <TextureOverride hideTexture={effectiveHideTexture} textureImage={effectiveTexture} />
      <div
        className="preview-mode visible"
        data-theme={theme}
        data-custom-bg={effectiveBackground ? '' : undefined}
        style={{ position: 'fixed', inset: 0, display: 'block', zIndex: 1, ...accentStyle, ...bgStyle, ...textStyle, ...titleStyle, ...titleStyle2, ...eyebrowStyle, ...fontStyle, ...navStyle, ...overlayStyle, ...scaleStyle }}
      >
        <nav className="brochure-nav" data-nav-ctx="public">
          <div className="brochure-nav-brand">
            <LogoMark logo={effectiveLogo} theme={theme} className="brochure-nav-brand-logo" />
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
                    // Wrapper mirrors AnimatedSection.tsx — `display: contents`
                    // means it generates no box but is still a real DOM node,
                    // which makes the `.brochure-page > :only-child > .section`
                    // CSS rule apply on single-section pages so the section
                    // fills the slide instead of collapsing to content height.
                    <div key={section._key} style={{ display: 'contents' }}>
                      <SectionRenderer
                        section={section}
                        pageNum={pageNum}
                        total={total}
                        showFolio={section._type === 'footer' ? false : showFolio}
                      />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* DOM mirrors BrochureReader.tsx — runtime hooks (`data-prev`,
            `data-next`, `data-counter-current`) layered on top so the offline
            runtime can wire up the same interactivity. */}
        <div className="preview-mode-nav">
          <div className="preview-mode-counter">
            <span data-counter-current>{String(1).padStart(2, '0')}</span>
            <span className="preview-mode-counter-sep">/</span>
            {String(total).padStart(2, '0')}
          </div>
          <div className="preview-mode-nav-buttons">
            <button
              className="preview-mode-nav-btn"
              data-prev
              disabled
              aria-label="Previous page"
            >
              <svg viewBox="0 0 40 40" fill="currentColor" width="24" height="24" aria-hidden>
                <path d="m20 33.4l-13.4-13.4 13.4-13.4 2.3 2.4-9.3 9.4h20.4v3.2h-20.4l9.3 9.4z" />
              </svg>
            </button>
            <button
              className="preview-mode-nav-btn"
              data-next
              aria-label="Next page"
              {...(total <= 1 ? { disabled: true } : {})}
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
