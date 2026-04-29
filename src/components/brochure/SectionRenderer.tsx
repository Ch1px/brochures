import type { Section } from '@/types/brochure'
import { useBrochureBranding } from './BrochureContext'
import { isBrandToken, resolveColor, type BrandContext } from '@/lib/brandColorTokens'
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
import { GalleryDuo } from './sections/GalleryDuo'
import { GalleryHero } from './sections/GalleryHero'
import { QuoteProfile } from './sections/QuoteProfile'
import { Closing } from './sections/Closing'
import { CircuitMap } from './sections/CircuitMap'
import { Spotlight } from './sections/Spotlight'
import { TextCenter } from './sections/TextCenter'
import { Footer } from './sections/Footer'
import { Logos } from './sections/Logos'
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
 * Build per-section colour CSS variable declarations from the section's
 * optional colour override fields. Supports both literal hex values and
 * brand/custom tokens (resolved via brandCtx). Returns null when no
 * overrides are set.
 */
function sectionColorCss(
  section: Section,
  brandCtx: BrandContext | undefined,
): string | null {
  if (section._type === 'footer') return null
  const s = section as Record<string, unknown>
  const vars: string[] = []
  const eyebrow = resolveFieldColor(s.eyebrowColor, brandCtx)
  if (eyebrow) vars.push(`--section-eyebrow-color:${eyebrow}`)
  const title = resolveFieldColor(s.titleColor, brandCtx)
  if (title) vars.push(`--section-title-color:${title}`)
  const body = resolveFieldColor(s.bodyColor, brandCtx)
  if (body) vars.push(`--section-body-color:${body}`)
  const accent = resolveFieldColor(s.accentColor, brandCtx)
  if (accent) vars.push(`--section-accent-color:${accent}`)
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

    case 'footer':
      return <Footer data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    case 'logoWall':
    case 'logoStrip':
      return <Logos data={section} pageNum={pageNum} total={total} showFolio={showFolio} />

    default:
      return <UnsupportedSection type={(section as { _type: string })._type} />
  }
}

export function SectionRenderer(props: Props) {
  const branding = useBrochureBranding()
  const element = renderSection(props)
  const bg = sanitizeBackground(props.section.background)
  const brandCtx: BrandContext = {
    accentColor: branding.accentColor,
    backgroundColor: branding.backgroundColor,
    textColor: branding.textColor,
    theme: branding.theme,
    customColors: branding.customColors,
  }
  const colorCss = sectionColorCss(props.section, brandCtx)

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
