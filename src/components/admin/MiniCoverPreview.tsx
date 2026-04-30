'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { Brochure, BrochureTheme, CustomColor, CustomFont, FontOverrides, SanityImage, SectionCover, TextScalePreset } from '@/types/brochure'
import { SectionRenderer } from '../brochure/SectionRenderer'
import { BrochureBrandingProvider } from '../brochure/BrochureContext'
import { GoogleFontsLink } from '../brochure/GoogleFontsLink'
import { CustomFontFaces } from '../brochure/CustomFontFaces'
import { accentColorVars } from '@/lib/accentColor'
import {
  backgroundColorVars,
  textColorVars,
  titleColorVars,
  titleStyleVars,
  eyebrowStyleVars,
  navColorVars,
  overlayBaseVars,
} from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'
import { textScaleVars } from '@/lib/textScale'
import { resolvedAccentColor, resolvedLogo } from '@/lib/brochureBranding'
import { textureOverrideCss } from '@/lib/textureOverride'
import { urlForSection } from '@/lib/sanity/image'
import { isBrandToken, resolveColor, type BrandContext } from '@/lib/brandColorTokens'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * The cover SVG decoration is hard-coded to `var(--brand-red)` (brochure-
 * level accent), while the cover frame corners, lockup bar, title accent,
 * and CTA use `var(--section-accent-color, var(--brand-red))` (section-
 * level override falling back to brochure). When the brochure inherits
 * accent from the company but the cover section has its own accent, the
 * thumb visibly renders two colours at once. To keep mini previews looking
 * unified, resolve the cover's own accent (if set) and use it as the
 * brochure-level `--brand-red` for the thumb only.
 */
function resolveCoverAccent(
  cover: SectionCover | null | undefined,
  ctx: BrandContext,
): string | undefined {
  const v = cover?.accentColor
  if (!v || typeof v !== 'string') return undefined
  if (isBrandToken(v)) {
    const r = resolveColor(v, ctx)
    return HEX_RE.test(r) ? r : undefined
  }
  return HEX_RE.test(v) ? v : undefined
}

/**
 * Brochure-level fields that the mini preview needs to render the cover
 * with full brand fidelity. Mirrors what `ALL_BROCHURES` GROQ projects.
 */
export type MiniBrochure = {
  title: string
  season: string
  theme?: BrochureTheme
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  titleColor?: string
  bodyColor?: string
  eyebrowItalic?: boolean
  eyebrowTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  titleItalic?: boolean
  titleTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  fontOverrides?: FontOverrides
  customFonts?: CustomFont[]
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  taglineScale?: TextScalePreset
  navColor?: string
  textureImage?: SanityImage
  hideTexture?: boolean
  customColors?: CustomColor[]
  logo?: SanityImage
  /** Full first cover / coverCentered section payload from page 1, if any. */
  coverSection?: SectionCover | null
  /** Inherited from host company when brochure-level fields are unset. */
  company?: { _id?: string; name?: string; accentColor?: string; logo?: Brochure['logo'] } | null
}

// Virtual render size for the mini preview. The cover is drawn as if the
// container were this big; a CSS transform scales it down to whatever space
// the card thumb has. This sidesteps the `clamp(28px, …, …)` floors in the
// cover styles that would otherwise stop the title from shrinking.
const VIRTUAL_W = 1280
const VIRTUAL_H = 800

/**
 * Live mini render of the brochure cover for the admin library card.
 *
 * Reuses the same `SectionRenderer` + branding-context wrapping as the
 * editor's `PreviewStage` and the public reader, so what shows in the card
 * is genuinely what the public page renders.
 *
 * Design notes:
 * - Renders the cover at a fixed virtual 16:10 size (1280×800) and uses
 *   `transform: scale(...)` to shrink to the actual thumb bounds. Container
 *   queries (`cqi`/`cqh`) inside the brochure CSS therefore resolve against
 *   the virtual size, so text proportions match the live brochure exactly.
 * - Texture override CSS is scoped to this card's frame via a unique data
 *   attribute, so brochure A's texture or hide-texture doesn't bleed into
 *   brochure B's card (`<TextureOverride>` would emit unscoped global rules).
 * - Custom fonts are inlined as a `@font-face` block. Google Fonts links
 *   intentionally aren't injected here — every card injecting a separate
 *   stylesheet would flood the page; admins almost always use uploaded
 *   custom fonts on production brochures, and the platform fonts are
 *   already loaded by the layout for rare Google-only brochures the system
 *   font stack is an acceptable fallback at thumb size.
 * - Pointer events are disabled inside the frame so clicks bubble to the
 *   card's wrapping `<Link>`.
 * - Falls back to a text-only stylised thumb when the brochure has no cover
 *   on page 1 (e.g. a brand-new draft).
 */
export function MiniCoverPreview({ brochure }: { brochure: MiniBrochure }) {
  const theme = brochure.theme ?? 'dark'
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const scopeId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  // Effective accent / logo with company fallback. We can't reuse the
  // helpers in `lib/brochureBranding.ts` directly (they expect a full
  // Brochure), so inline the same logic against MiniBrochure shape.
  const brochureLike = {
    accentColor: brochure.accentColor,
    logo: brochure.logo,
    companyBranding: brochure.company
      ? {
          accentColor: brochure.company.accentColor,
          logo: brochure.company.logo,
        }
      : undefined,
  } as unknown as Brochure
  const effectiveAccent = resolvedAccentColor(brochureLike)
  const effectiveLogo = resolvedLogo(brochureLike)

  // Prefer the cover's own accent over the brochure/company fallback so the
  // SVG decor (--brand-red) matches the cover frame corners and CTA
  // (--section-accent-color). Without this, a brochure inheriting accent
  // from its company but with a cover-level override renders mixed colours
  // in the thumb.
  const coverAccent = resolveCoverAccent(brochure.coverSection, {
    accentColor: effectiveAccent,
    backgroundColor: brochure.backgroundColor,
    textColor: brochure.textColor,
    titleColor: brochure.titleColor,
    theme,
    customColors: brochure.customColors,
  })
  const visualAccent = coverAccent ?? effectiveAccent

  if (typeof window !== 'undefined') {
    const cs = brochure.coverSection as Record<string, unknown> | null | undefined

    console.log('[MiniCoverPreview]', brochure.title, {
      brochureAccent: brochure.accentColor,
      companyAccent: brochure.company?.accentColor,
      effectiveAccent,
      coverSectionKey: cs?._key,
      coverSectionAllFields: cs,
      coverAccentResolved: coverAccent,
      visualAccent,
      customColorsCount: brochure.customColors?.length ?? 0,
      customColorsKeys: brochure.customColors?.map((c) => `${c._key}:${c.hex}`),
    })
  }

  const accentStyle = accentColorVars(visualAccent)
  const bgStyle = backgroundColorVars(brochure.backgroundColor)
  const textStyle = textColorVars(brochure.textColor)
  const titleStyle = titleColorVars(brochure.titleColor)
  const eyebrowStyle = eyebrowStyleVars(brochure.eyebrowItalic, brochure.eyebrowTransform)
  const titleStyle2 = titleStyleVars(brochure.titleItalic, brochure.titleTransform)
  const fontStyle = fontOverrideVars(brochure.fontOverrides, brochure.customFonts)
  const fontsUrl = googleFontsUrl(brochure.fontOverrides)
  const navStyle = navColorVars(brochure.navColor)
  const overlayStyle = overlayBaseVars(brochure.backgroundColor)
  const scaleStyle = textScaleVars(brochure as unknown as Brochure)

  // Diagnostic: log the COMPUTED CSS of the cover and CTA after mount so we
  // can see what --brand-red / --section-accent-color actually resolve to in
  // the DOM (vs what we *think* we're setting via inline style).
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const id = window.requestAnimationFrame(() => {
      const frame = el.querySelector<HTMLElement>('.library-card-mini-frame')
      const section = el.querySelector<HTMLElement>('[data-section-id]')
      const cta = el.querySelector<HTMLElement>('.cover-cta')
      const titleAccent = el.querySelector<HTMLElement>('.cover-title-accent')
      const fc = frame ? getComputedStyle(frame) : null
      const sc = section ? getComputedStyle(section) : null
      const cc = cta ? getComputedStyle(cta) : null
      const tac = titleAccent ? getComputedStyle(titleAccent) : null
      console.log('[MiniCoverPreview · computed]', brochure.title, {
        frameBrandRed: fc?.getPropertyValue('--brand-red').trim(),
        frameSectionAccent: fc?.getPropertyValue('--section-accent-color').trim(),
        sectionBrandRed: sc?.getPropertyValue('--brand-red').trim(),
        sectionSectionAccent: sc?.getPropertyValue('--section-accent-color').trim(),
        ctaBrandRed: cc?.getPropertyValue('--brand-red').trim(),
        ctaSectionAccent: cc?.getPropertyValue('--section-accent-color').trim(),
        ctaBackgroundColor: cc?.backgroundColor,
        ctaColor: cc?.color,
        titleAccentColor: tac?.color,
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [brochure.title])

  // Measure the wrap and compute the scale factor needed to fit the
  // virtual canvas. ResizeObserver keeps it correct across responsive
  // grid breakpoints.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth || 1
      setScale(w / VIRTUAL_W)
    }
    update()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update)
      ro.observe(el)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Scope the texture override CSS to this card's frame. We can't render
  // <TextureOverride> directly because it emits unscoped rules that would
  // leak across every card on the page.
  const rawTextureCss = textureOverrideCss(brochure.hideTexture, brochure.textureImage, urlForSection)
  const textureCss = rawTextureCss
    ? rawTextureCss.replace(/(^|,)\s*([^,{]+)/g, (_m, p, sel) => `${p} [data-mini-scope="${scopeId}"] ${sel.trim()}`)
    : null

  if (!brochure.coverSection) {
    return (
      <div
        className={`library-card-thumb theme-${theme}`}
        style={{ ['--card-accent' as string]: effectiveAccent ?? '#cf212a' }}
      >
        <div className="library-card-thumb-content">
          <div className="library-card-thumb-eyebrow">{brochure.season}</div>
          <div className="library-card-thumb-text">{brochure.title}</div>
        </div>
      </div>
    )
  }

  return (
    <BrochureBrandingProvider
      value={{
        accentColor: effectiveAccent,
        backgroundColor: brochure.backgroundColor,
        textColor: brochure.textColor,
        titleColor: brochure.titleColor,
        fontOverrides: brochure.fontOverrides,
        customColors: brochure.customColors,
        logo: effectiveLogo,
        theme,
        editorMode: false,
        thumbnail: true,
      }}
    >
      <GoogleFontsLink url={fontsUrl} />
      <CustomFontFaces customFonts={brochure.customFonts} />
      {textureCss ? <style>{textureCss}</style> : null}
      <div
        ref={wrapRef}
        className="library-card-mini-wrap"
        data-mini-scope={scopeId}
        style={{ ['--card-accent' as string]: visualAccent ?? '#cf212a' }}
      >
        <div
          className="library-card-mini-frame"
          data-theme={theme}
          data-custom-bg={brochure.backgroundColor ? '' : undefined}
          style={{
            ...accentStyle,
            ...bgStyle,
            ...textStyle,
            ...titleStyle,
            ...titleStyle2,
            ...eyebrowStyle,
            ...fontStyle,
            ...navStyle,
            ...overlayStyle,
            ...scaleStyle,
            width: `${VIRTUAL_W}px`,
            height: `${VIRTUAL_H}px`,
            transform: `scale(${scale})`,
          }}
          aria-hidden
        >
          <div className="brochure-page" style={{ width: '100%', height: '100%' }}>
            <SectionRenderer
              section={brochure.coverSection}
              pageNum={1}
              total={1}
              showFolio={false}
            />
          </div>
        </div>
      </div>
    </BrochureBrandingProvider>
  )
}
