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
  /** Inherited from host company when brochure-level fields are unset. Mirrors
   *  the projection in `ALL_BROCHURES` GROQ. */
  company?:
    | {
        _id?: string
        name?: string
        theme?: BrochureTheme
        accentColor?: string
        backgroundColor?: string
        textColor?: string
        titleColor?: string
        bodyColor?: string
        navColor?: string
        logo?: Brochure['logo']
        textureImage?: SanityImage
        hideTexture?: boolean
        eyebrowItalic?: boolean
        eyebrowTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
        titleItalic?: boolean
        titleTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
        fontOverrides?: FontOverrides
        titleScale?: TextScalePreset
        eyebrowScale?: TextScalePreset
        taglineScale?: TextScalePreset
      }
    | null
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
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const scopeId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  // Build a synthetic Brochure-shaped object so the live-fallback resolvers
  // work uniformly — every brochure-level field on MiniBrochure paired with
  // the company snapshot under `companyBranding`. The cast is safe because
  // the resolvers only read the projected keys.
  const brochureLike = {
    ...brochure,
    companyBranding: brochure.company
      ? {
          _id: brochure.company._id,
          name: brochure.company.name,
          theme: brochure.company.theme,
          accentColor: brochure.company.accentColor,
          backgroundColor: brochure.company.backgroundColor,
          textColor: brochure.company.textColor,
          titleColor: brochure.company.titleColor,
          bodyColor: brochure.company.bodyColor,
          navColor: brochure.company.navColor,
          logo: brochure.company.logo,
          textureImage: brochure.company.textureImage,
          hideTexture: brochure.company.hideTexture,
          eyebrowItalic: brochure.company.eyebrowItalic,
          eyebrowTransform: brochure.company.eyebrowTransform,
          titleItalic: brochure.company.titleItalic,
          titleTransform: brochure.company.titleTransform,
          fontOverrides: brochure.company.fontOverrides,
          titleScale: brochure.company.titleScale,
          eyebrowScale: brochure.company.eyebrowScale,
          taglineScale: brochure.company.taglineScale,
        }
      : undefined,
  } as unknown as Brochure
  const theme = resolvedTheme(brochureLike) ?? 'dark'
  const effectiveAccent = resolvedAccentColor(brochureLike)
  const effectiveLogo = resolvedLogo(brochureLike)
  const effectiveBackground = resolvedBackgroundColor(brochureLike)
  const effectiveText = resolvedTextColor(brochureLike)
  const effectiveTitle = resolvedTitleColor(brochureLike)
  const effectiveNav = resolvedNavColor(brochureLike)
  const effectiveFontOverrides = resolvedFontOverrides(brochureLike)

  // Prefer the cover's own accent over the brochure/company fallback so the
  // SVG decor (--brand-red) matches the cover frame corners and CTA
  // (--section-accent-color). Without this, a brochure inheriting accent
  // from its company but with a cover-level override renders mixed colours
  // in the thumb.
  // Note: we resolve against the original cover section data (not the
  // scopedCoverSection below). The _key rewrite is only for style-selector
  // scoping; field values are unchanged.
  const coverAccent = resolveCoverAccent(brochure.coverSection, {
    accentColor: effectiveAccent,
    backgroundColor: effectiveBackground,
    textColor: effectiveText,
    titleColor: effectiveTitle,
    theme,
    customColors: brochure.customColors,
  })
  const visualAccent = coverAccent ?? effectiveAccent

  // Each library card renders its own cover section through SectionRenderer.
  // SectionRenderer emits a `<style>[data-section-id="<_key>"]{...}</style>`
  // block for any section with colour/scale overrides. Brochures duplicated
  // from a template share the cover's `_key` (e.g. "s01cover0001"), so on the
  // library page where multiple cards mount simultaneously the LAST emitted
  // style block wins for ALL cards — leaking accent/title overrides between
  // brochures. Substitute a per-card unique `_key` so each style block has
  // its own selector and doesn't cross-contaminate.
  const scopedCoverSection = brochure.coverSection
    ? { ...brochure.coverSection, _key: `${brochure.coverSection._key}-${scopeId}` }
    : null

  const accentStyle = accentColorVars(visualAccent)
  const bgStyle = backgroundColorVars(effectiveBackground)
  const textStyle = textColorVars(effectiveText)
  const titleStyle = titleColorVars(effectiveTitle)
  const eyebrowStyle = eyebrowStyleVars(resolvedEyebrowItalic(brochureLike), resolvedEyebrowTransform(brochureLike))
  const titleStyle2 = titleStyleVars(resolvedTitleItalic(brochureLike), resolvedTitleTransform(brochureLike))
  const fontStyle = fontOverrideVars(effectiveFontOverrides, brochure.customFonts)
  const fontsUrl = googleFontsUrl(effectiveFontOverrides)
  const navStyle = navColorVars(effectiveNav)
  const overlayStyle = overlayBaseVars(effectiveBackground)
  const scaleStyle = textScaleVars(resolvedTextScales(brochureLike))

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
  const effectiveTexture = resolvedTextureImage(brochureLike)
  const effectiveHideTexture = resolvedHideTexture(brochureLike)
  const rawTextureCss = textureOverrideCss(effectiveHideTexture, effectiveTexture, urlForSection)
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
        backgroundColor: effectiveBackground,
        textColor: effectiveText,
        titleColor: effectiveTitle,
        fontOverrides: effectiveFontOverrides,
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
          data-custom-bg={effectiveBackground ? '' : undefined}
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
            {scopedCoverSection ? (
              <SectionRenderer
                section={scopedCoverSection}
                pageNum={1}
                total={1}
                showFolio={false}
              />
            ) : null}
          </div>
        </div>
      </div>
    </BrochureBrandingProvider>
  )
}
