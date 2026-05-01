'use client'

import type { Section } from '@/types/brochure'
import { useBrochureBranding } from './BrochureContext'
import { isBrandToken, resolveColor, type BrandContext } from '@/lib/brandColorTokens'
import { SCALE_MAP } from '@/lib/textScale'
import type { TextScalePreset } from '@/types/brochure'
import { Cover } from './sections/Cover'
import { ImageHero } from './sections/ImageHero'
import { SectionHeading } from './sections/SectionHeading'
import { Intro } from './sections/Intro'
import { SplitSection } from './sections/SplitSection'
import { Features } from './sections/Features'
import { Stats } from './sections/Stats'
import { Packages } from './sections/Packages'
import { Itinerary } from './sections/Itinerary'
import { GalleryEditorial } from './sections/GalleryEditorial'
import { GalleryGrid } from './sections/GalleryGrid'
import { GalleryTrio } from './sections/GalleryTrio'
import { GalleryDuo } from './sections/GalleryDuo'
import { GalleryHero } from './sections/GalleryHero'
import { QuoteProfile } from './sections/QuoteProfile'
import { Closing } from './sections/Closing'
import { CircuitMap } from './sections/CircuitMap'
import { Spotlight } from './sections/Spotlight'
import { TextCenter } from './sections/TextCenter'
import { CTABanner } from './sections/CTABanner'
import { LinkedCards } from './sections/LinkedCards'
import { Footer } from './sections/Footer'
import { Logos } from './sections/Logos'
import { Faq } from './sections/Faq'
import { UnsupportedSection } from './sections/UnsupportedSection'

type Props = {
  section: Section
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Only hex, rgb/rgba, hsl/hsla, "transparent", "currentColor", and named
 * colours letters-only are permitted. Anything else is dropped to avoid
 * allowing arbitrary CSS through the admin-authored background value.
 */
const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Only hex, rgb/rgba, hsl/hsla, "transparent", "currentColor", and named
 * colours letters-only are permitted. Anything else is dropped to avoid
 * allowing arbitrary CSS through the admin-authored background value.
 */
function sanitizeBackground(value: string | undefined): string | null {
  if (!value) return null
  const v = value.trim()
  if (!v) return null
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v
  if (/^(rgb|rgba|hsl|hsla)\s*\(\s*[0-9.,\s%]+\)$/i.test(v)) return v
  if (/^[a-z]+$/i.test(v)) return v
  return null
}

/**
 * Resolve a section colour field value to a sanitised hex string.
 * Supports both literal hex values and brand/custom tokens (e.g.
 * `var:accent`, `custom:<_key>`). Returns null if the value is
 * empty or resolves to an invalid colour.
 */
function resolveFieldColor(
  value: unknown,
  brandCtx: BrandContext | undefined,
): string | null {
  if (typeof value !== 'string' || !value) return null
  // Brand or custom token — resolve via context
  if (isBrandToken(value)) {
    if (!brandCtx) return null
    const resolved = resolveColor(value, brandCtx)
    return HEX_RE.test(resolved) ? resolved : null
  }
  // Literal hex
  return HEX_RE.test(value) ? value : null
}

/**
 * Resolve a TextScalePreset to its numeric multiplier string.
 * Returns null for 'm' (default) or invalid values.
 */
function resolveScale(value: unknown): string | null {
  if (typeof value !== 'string' || !value || value === 'm') return null
  const n = SCALE_MAP[value as TextScalePreset]
  return n != null ? String(n) : null
}

/**
 * Build per-section style CSS variable declarations from the section's
 * optional colour and scale override fields. Supports both literal hex
 * values and brand/custom tokens (resolved via brandCtx). Returns null
 * when no overrides are set.
 */
function sectionStyleCss(
  section: Section,
  brandCtx: BrandContext | undefined,
): string | null {
  if (section._type === 'footer') return null
  const s = section as Record<string, unknown>
  const vars: string[] = []

  // Colour overrides
  const eyebrow = resolveFieldColor(s.eyebrowColor, brandCtx)
  if (eyebrow) vars.push(`--section-eyebrow-color:${eyebrow}`)
  const title = resolveFieldColor(s.titleColor, brandCtx)
  if (title) vars.push(`--section-title-color:${title}`)
  const body = resolveFieldColor(s.bodyColor, brandCtx)
  if (body) vars.push(`--section-body-color:${body}`)
  const accent = resolveFieldColor(s.accentColor, brandCtx)
  if (accent) vars.push(`--section-accent-color:${accent}`)
  const titleAccent = resolveFieldColor(s.titleAccentColor, brandCtx)
  if (titleAccent) vars.push(`--section-title-accent-color:${titleAccent}`)
  const overlay = resolveFieldColor(s.overlayColor, brandCtx)
  if (overlay) {
    const r = parseInt(overlay.slice(1, 3), 16)
    const g = parseInt(overlay.slice(3, 5), 16)
    const b = parseInt(overlay.slice(5, 7), 16)
    vars.push(`--overlay-base-rgb:${r}, ${g}, ${b}`)
  }

  // Image treatments — desaturate and/or blur all images in the section.
  const grayMap: Record<string, string> = { light: '0.3', medium: '0.6', full: '1' }
  const blurMap: Record<string, string> = { light: '2px', medium: '6px', strong: '12px' }
  const gray = typeof s.mediaGrayscale === 'string' ? grayMap[s.mediaGrayscale] : null
  if (gray) vars.push(`--media-grayscale:${gray}`)
  const blur = typeof s.mediaBlur === 'string' ? blurMap[s.mediaBlur] : null
  if (blur) vars.push(`--media-blur:${blur}`)

  // Spotlight only — independent foreground image treatments. Emitted as
  // separate vars; CSS overrides --media-grayscale / --media-blur on
  // `.page-spotlight-image` so the foreground card uses these instead.
  if (section._type === 'spotlight') {
    const fgGray = typeof s.foregroundMediaGrayscale === 'string' ? grayMap[s.foregroundMediaGrayscale] : null
    if (fgGray) vars.push(`--fg-media-grayscale:${fgGray}`)
    const fgBlur = typeof s.foregroundMediaBlur === 'string' ? blurMap[s.foregroundMediaBlur] : null
    if (fgBlur) vars.push(`--fg-media-blur:${fgBlur}`)
    const fgOverlay = resolveFieldColor(s.foregroundOverlayColor, brandCtx)
    if (fgOverlay) {
      const r = parseInt(fgOverlay.slice(1, 3), 16)
      const g = parseInt(fgOverlay.slice(3, 5), 16)
      const b = parseInt(fgOverlay.slice(5, 7), 16)
      vars.push(`--fg-overlay-base-rgb:${r}, ${g}, ${b}`)
    }
  }

  // Scale overrides — override the brochure-wide --X-scale vars for this section
  const ts = resolveScale(s.titleScale)
  if (ts) vars.push(`--title-scale:${ts}`)
  const es = resolveScale(s.eyebrowScale)
  if (es) vars.push(`--eyebrow-scale:${es}`)
  const bs = resolveScale(s.bodyScale)
  if (bs) vars.push(`--tagline-scale:${bs}`)
  const tas = resolveScale(s.titleAccentScale)
  if (tas) vars.push(`--title-accent-scale:${tas}`)


  return vars.length > 0 ? vars.join(';') : null
}

function renderSection({ section, pageNum, total, showFolio }: Props) {
  switch (section._type) {
    case 'cover':
    case 'coverCentered':
      return <Cover data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'imageHero':
      return <ImageHero data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'sectionHeading':
    case 'sectionHeadingCentered':
      return <SectionHeading data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'intro':
      return <Intro data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'contentImage':
    case 'imageContent':
      return <SplitSection data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'features':
      return <Features data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'stats':
      return <Stats data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'packages':
      return <Packages data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'itinerary':
      return <Itinerary data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'galleryEditorial':
      return <GalleryEditorial data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'galleryGrid':
      return <GalleryGrid data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'galleryTrio':
      return <GalleryTrio data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'galleryDuo':
      return <GalleryDuo data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'galleryHero':
      return <GalleryHero data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'quoteProfile':
      return <QuoteProfile data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'closing':
      return <Closing data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'circuitMap':
      return <CircuitMap data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'spotlight':
      return <Spotlight data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'textCenter':
      return <TextCenter data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'ctaBanner':
      return <CTABanner data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'linkedCards':
      return <LinkedCards data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'footer':
      return <Footer data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'logoWall':
    case 'logoStrip':
      return <Logos data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'faq':
      return <Faq data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    default:
      return <UnsupportedSection type={(section as { _type: string })._type} />
  }
}

export function SectionRenderer(props: Props) {
  const branding = useBrochureBranding()
  const element = renderSection(props)
  const brandCtx: BrandContext = {
    accentColor: branding.accentColor,
    backgroundColor: branding.backgroundColor,
    textColor: branding.textColor,
    titleColor: branding.titleColor,
    theme: branding.theme,
    customColors: branding.customColors,
  }
  // Background may be a brand token (e.g. var:accent) or a literal value
  // ('transparent', '#hex', 'rgba(...)'). Tokens resolve via brandCtx; literals
  // pass through sanitizeBackground for safety.
  const rawBg = props.section.background
  const bg = rawBg && isBrandToken(rawBg)
    ? resolveColor(rawBg, brandCtx)
    : sanitizeBackground(rawBg)
  const colorCss = sectionStyleCss(props.section, brandCtx)

  if (!bg && !colorCss) return element

  const sel = `[data-section-id="${props.section._key}"]`
  const parts: string[] = []
  if (bg) parts.push(`${sel}{background:${bg} !important;}`)
  if (colorCss) parts.push(`${sel}{${colorCss}}`)

  return (
    <>
      <style>{parts.join('\n')}</style>
      {element}
    </>
  )
}
