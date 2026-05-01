'use client'

import { useEffect } from 'react'
import type { Brochure } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'
import { BrochureBrandingProvider } from './BrochureContext'
import { GoogleFontsLink } from './GoogleFontsLink'
import { TextureOverride } from './TextureOverride'
import { accentColorVars } from '@/lib/accentColor'
import { backgroundColorVars, textColorVars, titleColorVars, titleStyleVars, eyebrowStyleVars, navColorVars, overlayBaseVars } from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'
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
} from '@/lib/brochureBranding'

type Props = {
  brochure: Brochure
}

/**
 * Print-optimised view used by /[slug]/print and the Puppeteer PDF pipeline.
 * Each section becomes its own A4-landscape page (297mm × 210mm), so the PDF
 * is naturally paginated by Chromium via `@page { size: A4 landscape }`.
 * Container queries resolve to the printed sheet width, matching the desktop
 * reader. No nav, no animations, no client-side wiring.
 */
export function BrochurePrintView({ brochure }: Props) {
  const pages = brochure.pages ?? []
  const sections = pages.flatMap((p) => p.sections ?? []).filter((s) => s._type !== 'footer')
  const total = sections.length
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
  const fontStyle = fontOverrideVars(effectiveFontOverrides)
  const navStyle = navColorVars(effectiveNav)
  const overlayStyle = overlayBaseVars(effectiveBackground)
  const fontsUrl = googleFontsUrl(effectiveFontOverrides)

  useFitSectionsToPages()

  return (
    <BrochureBrandingProvider value={{ accentColor: effectiveAccent, backgroundColor: effectiveBackground, textColor: effectiveText, titleColor: effectiveTitle, fontOverrides: effectiveFontOverrides, customColors: brochure.customColors, logo: effectiveLogo, theme }}>
      <GoogleFontsLink url={fontsUrl} />
      <TextureOverride hideTexture={effectiveHideTexture} textureImage={effectiveTexture} />
      <div className="brochure-print-root" data-theme={theme} data-custom-bg={effectiveBackground ? '' : undefined} style={{ ...accentStyle, ...bgStyle, ...textStyle, ...titleStyle, ...titleStyle2, ...eyebrowStyle, ...fontStyle, ...navStyle, ...overlayStyle }}>
        {sections.map((section, i) => {
          const pageNum = i + 1
          const showFolio = i > 0
          return (
            <div key={section._key} className="brochure-print-page">
              <SectionRenderer
                section={section}
                pageNum={pageNum}
                total={total}
                showFolio={showFolio}
              />
            </div>
          )
        })}
      </div>
    </BrochureBrandingProvider>
  )
}

/**
 * After fonts and images load, measure each section against its A4 page and
 * apply a uniform `transform: scale(...)` if it overflows. CSS alone can't
 * "fit-to-container", so we measure once on the client. Puppeteer waits on
 * `window.__brochurePrintReady` before snapshotting the PDF.
 */
function useFitSectionsToPages() {
  useEffect(() => {
    let cancelled = false

    // 4% safe-area inset (2% per side) so scaled content never touches the
    // page edges and small measurement errors don't clip content.
    const SAFE_INSET = 0.04
    const fit = () => {
      const pages = document.querySelectorAll<HTMLElement>('.brochure-print-page')
      pages.forEach((page) => {
        const section = page.firstElementChild as HTMLElement | null
        if (!section) return
        section.style.transform = ''
        section.style.transformOrigin = ''
        section.style.marginTop = ''
        const ph = page.clientHeight
        const pw = page.clientWidth
        const sh = section.scrollHeight
        const sw = section.scrollWidth
        if (!ph || !pw || !sh || !sw) return
        const targetH = ph * (1 - SAFE_INSET)
        const targetW = pw * (1 - SAFE_INSET)
        const scale = Math.min(1, targetH / sh, targetW / sw)
        if (scale < 1) {
          // Scale from the top edge, then nudge down with marginTop so the
          // scaled output is vertically centred within the page (the unscaled
          // section box still flows from y=0; margin lives in pre-transform
          // coords and isn't affected by scale).
          const visibleH = sh * scale
          section.style.transformOrigin = 'center top'
          section.style.transform = `scale(${scale})`
          section.style.marginTop = `${Math.max(0, (ph - visibleH) / 2)}px`
        }
      })
    }

    const waitForImages = () => {
      const imgs = Array.from(document.images)
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              })
        )
      )
    }

    // Sections (SplitSection, Cover, ImageHero, Closing, etc.) paint photos
    // via CSS background-image, which `document.images` doesn't track.
    // Walk every element with a non-`none` background-image and decode each
    // URL through `new Image()` so we don't snapshot before they paint.
    const waitForBackgroundImages = async () => {
      const URL_RE = /url\(\s*["']?([^"')]+)["']?\s*\)/g
      const seen = new Set<string>()
      const elements = document.querySelectorAll<HTMLElement>('*')
      const promises: Array<Promise<void>> = []
      for (const el of Array.from(elements)) {
        const bg = getComputedStyle(el).backgroundImage
        if (!bg || bg === 'none') continue
        let m: RegExpExecArray | null
        while ((m = URL_RE.exec(bg)) !== null) {
          const url = m[1]
          if (!url || url.startsWith('data:') || seen.has(url)) continue
          seen.add(url)
          promises.push(
            new Promise<void>((resolve) => {
              const probe = new Image()
              probe.onload = () => resolve()
              probe.onerror = () => resolve()
              probe.src = url
            })
          )
        }
      }
      await Promise.all(promises)
    }

    ;(async () => {
      try {
        await document.fonts?.ready
      } catch {
        /* ignore */
      }
      await Promise.all([waitForImages(), waitForBackgroundImages()])
      if (cancelled) return
      // One rAF lets layout settle after the last image's intrinsic size resolves.
      requestAnimationFrame(() => {
        if (cancelled) return
        fit()
        ;(window as unknown as { __brochurePrintReady?: boolean }).__brochurePrintReady = true
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])
}
