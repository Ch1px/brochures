/**
 * TypeScript types that mirror the Sanity schema.
 * Keep these in sync with /schemas/*.
 *
 * For stronger type safety long-term, look at:
 * - `sanity-codegen` to auto-generate types from schemas
 * - Sanity's TypeGen (built-in command in newer Sanity versions)
 */

import type { PortableTextBlock } from '@portabletext/types'

export type BrochureStatus = 'draft' | 'published' | 'unpublished' | 'archived'

export type BrochureTheme = 'dark' | 'light'

export type TextScalePreset = 'xxs' | 'xs' | 's' | 'm' | 'l' | 'xl'

export type CustomFontWeight = {
  _key: string
  weight: string
  /** Base64 data URI (e.g. `data:font/ttf;base64,...`). Stored directly in
   *  the document — no file asset needed. Typically 30–80KB per weight. */
  dataUri: string
}

export type CustomFont = {
  _key: string
  name: string
  weights: CustomFontWeight[]
}

export type FontOverrides = {
  display?: string
  displayWeight?: string
  script?: string
  scriptWeight?: string
  body?: string
  bodyWeight?: string
  mono?: string
  monoWeight?: string
}

export type SanityImage = {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number; height: number; width: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  alt?: string
}

export type SanityFile = {
  _type: 'file'
  asset: { _ref: string; _type: 'reference' }
}

// --- Section types (discriminated union by _type) ---

export type MediaGrayscale = 'none' | 'light' | 'medium' | 'full'
export type MediaBlur = 'none' | 'light' | 'medium' | 'strong'

export type SectionCover = {
  _key: string
  _type: 'cover' | 'coverCentered'
  edition?: string
  brandMark?: string
  sup?: string
  supImage?: SanityImage
  supImageScale?: number
  title: string
  titleImage?: SanityImage
  titleImageScale?: number
  titleAccent?: string
  titleAccentImage?: SanityImage
  titleAccentImageScale?: number
  tag?: string
  cta?: string
  ctaHref?: string
  ref?: string
  image?: SanityImage
  video?: SanityFile
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleAccentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
  titleAccentScale?: TextScalePreset
}

export type SectionIntro = {
  _key: string
  _type: 'intro'
  letter?: string
  letterImage?: SanityImage
  /** Multiplier on the letter image's default height. 1 = default. */
  letterImageScale?: number
  eyebrow?: string
  title: string
  body?: string
  ctaText?: string
  ctaHref?: string
  image?: SanityImage
  video?: SanityFile
  caption?: string
  contentAlign?: 'left' | 'center' | 'right'
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionContentImage = {
  _key: string
  _type: 'contentImage' | 'imageContent'
  eyebrow?: string
  title: string
  body?: string
  ctaText?: string
  ctaHref?: string
  image?: SanityImage
  video?: SanityFile
  caption?: string
  contentAlign?: 'left' | 'center' | 'right'
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionSectionHeading = {
  _key: string
  /**
   * `sectionHeadingCentered` is a DEPRECATED alias kept only so existing
   * documents render until the Sanity migration script has been run.
   * New sections are always created with `_type: 'sectionHeading'`.
   */
  _type: 'sectionHeading' | 'sectionHeadingCentered'
  eyebrow?: string
  title: string
  text?: string
  ctaText?: string
  ctaHref?: string
  image?: SanityImage
  video?: SanityFile
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
  /** Content alignment. Defaults to 'center' when undefined. */
  contentAlign?: 'left' | 'center' | 'right'
}

export type SectionFeatures = {
  _key: string
  _type: 'features'
  title: string
  titleAccent?: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  cards: Array<{
    _key: string
    title: string
    text?: string
    image?: SanityImage
  }>
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionImageHero = {
  _key: string
  _type: 'imageHero'
  eyebrow?: string
  title: string
  text?: string
  ctaText?: string
  ctaHref?: string
  image: SanityImage
  video?: SanityFile
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type StatItem = {
  _key: string
  value: string
  unit?: string
  label: string
}

export type SectionStats = {
  _key: string
  _type: 'stats'
  eyebrow?: string
  title: string
  stats: StatItem[]
  background?: string
  eyebrowColor?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionPackages = {
  _key: string
  _type: 'packages'
  eyebrow?: string
  title: string
  packages: Array<{
    _key: string
    image?: SanityImage
    tier?: string
    name: string
    currency?: string
    price?: string
    from?: string
    featured?: boolean
    features?: string[]
  }>
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionItinerary = {
  _key: string
  _type: 'itinerary'
  title: string
  days: Array<{
    _key: string
    day: string
    label?: string
    title: string
    description?: string
  }>
  background?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionGalleryEditorial = {
  _key: string
  _type: 'galleryEditorial'
  title: string
  images?: SanityImage[]
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  titleColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionGalleryGrid = {
  _key: string
  _type: 'galleryGrid'
  eyebrow?: string
  title: string
  images?: SanityImage[]
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionGalleryTrio = {
  _key: string
  _type: 'galleryTrio'
  eyebrow?: string
  title: string
  images?: SanityImage[]
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionGalleryDuo = {
  _key: string
  _type: 'galleryDuo'
  eyebrow?: string
  title: string
  images?: SanityImage[]
  captions?: string[]
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionGalleryHero = {
  _key: string
  _type: 'galleryHero'
  eyebrow?: string
  title: string
  caption?: string
  images?: SanityImage[]
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionQuoteProfile = {
  _key: string
  _type: 'quoteProfile'
  eyebrow?: string
  name: string
  photo?: SanityImage
  quote: string
  body?: string
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionClosing = {
  _key: string
  _type: 'closing'
  eyebrow?: string
  title: string
  subtitle?: string
  ctaText?: string
  ctaHref?: string
  email?: string
  phone?: string
  image?: SanityImage
  video?: SanityFile
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type ColorOverride = {
  _key: string
  elementId: string
  color: string
}

export type AnnotationKind = 'text' | 'image' | 'pin' | 'svg' | 'draw'

type AnnotationBase = {
  _key: string
  kind: AnnotationKind
  x: number
  y: number
  color?: string
  scale?: number
  rotation?: number
  opacity?: number
}

export type AnnotationText = AnnotationBase & {
  kind: 'text'
  label: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  width?: number
}

export type AnnotationImage = AnnotationBase & {
  kind: 'image'
  image?: SanityImage
  width?: number
  /** Border radius as a percent of min dimension. 0 = square, 50 = circle. */
  borderRadius?: number
  mediaGrayscale?: 'none' | 'light' | 'medium' | 'full'
  mediaBlur?: 'none' | 'light' | 'medium' | 'strong'
}

export type AnnotationPin = AnnotationBase & {
  kind: 'pin'
  label?: string
  icon?: 'pin' | 'flag' | 'dot' | 'number'
  number?: number
}

export type AnnotationSvg = AnnotationBase & {
  kind: 'svg'
  svgText?: string
  width?: number
  strokeMode?: boolean
}

export type Annotation = AnnotationText | AnnotationImage | AnnotationPin | AnnotationSvg

export type CircuitDrawing = {
  _key: string
  /** SVG path data in the parent SVG's viewBox coordinate space. */
  d: string
  /** Stroke width in viewBox units (so it scales with the circuit). */
  strokeWidth: number
  /** Stroke pattern. Defaults to 'solid'. */
  dash?: 'solid' | 'dashed' | 'dotted'
  /** Brand token (e.g. 'var:accent', 'custom:abc') or hex. Defaults to accent. */
  color?: string
  /** 0–1. Defaults to 1. */
  opacity?: number
  /** Translate in viewBox units. Defaults to 0. */
  tx?: number
  ty?: number
  /** Uniform scale around the path bbox centre. Defaults to 1. */
  scale?: number
  /** Rotation in degrees, around the path bbox centre. Defaults to 0. */
  rotation?: number
}

export type SectionCircuitMap = {
  _key: string
  _type: 'circuitMap'
  eyebrow?: string
  title: string
  caption?: string
  svg?: string
  svgOriginal?: string
  colorOverrides?: ColorOverride[]
  annotations?: Annotation[]
  drawings?: CircuitDrawing[]
  stats?: StatItem[]
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionSpotlight = {
  _key: string
  _type: 'spotlight'
  eyebrow?: string
  title: string
  body?: string
  ctaText?: string
  ctaHref?: string
  showForegroundImage?: boolean
  image?: SanityImage
  video?: SanityFile
  caption?: string
  backgroundImage?: SanityImage
  backgroundVideo?: SanityFile
  backgroundParallax?: boolean
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  /** Foreground card image treatments, independent of the background. */
  foregroundOverlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  foregroundOverlayColor?: string
  foregroundMediaGrayscale?: MediaGrayscale
  foregroundMediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type LinkedCardItem = {
  _key: string
  title: string
  text?: string
  image?: SanityImage
  linkText?: string
  linkHref?: string
}

export type SectionLinkedCards = {
  _key: string
  _type: 'linkedCards'
  eyebrow?: string
  title?: string
  cards: LinkedCardItem[]
  contentAlign?: 'left' | 'center' | 'right'
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  overlayColor?: string
  mediaGrayscale?: MediaGrayscale
  mediaBlur?: MediaBlur
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionCTABanner = {
  _key: string
  _type: 'ctaBanner'
  eyebrow?: string
  title?: string
  body?: string
  ctaText?: string
  ctaHref?: string
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionTextCenter = {
  _key: string
  _type: 'textCenter'
  eyebrow?: string
  title?: string
  body: string
  ctaText?: string
  ctaHref?: string
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type LogoItem = {
  _key: string
  name: string
  image?: SanityImage
  href?: string
}

export type SectionLogos = {
  _key: string
  _type: 'logoWall' | 'logoStrip'
  eyebrow?: string
  title?: string
  subtitle?: string
  logos: LogoItem[]
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type FaqItem = {
  _key: string
  question: string
  answer: string
}

export type SectionFaq = {
  _key: string
  _type: 'faq'
  eyebrow?: string
  title: string
  subtitle?: string
  questions: FaqItem[]
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SocialPlatform =
  | 'instagram'
  | 'x'
  | 'facebook'
  | 'linkedin'
  | 'youtube'
  | 'tiktok'

export type SocialLink = {
  _key: string
  platform: SocialPlatform
  href: string
}

export type SectionFooter = {
  _key: string
  _type: 'footer'
  legal?: string
  email?: string
  phone?: string
  socials?: SocialLink[]
  background?: string
}

export type Section =
  | SectionCover
  | SectionIntro
  | SectionContentImage
  | SectionSectionHeading
  | SectionFeatures
  | SectionImageHero
  | SectionStats
  | SectionPackages
  | SectionItinerary
  | SectionGalleryEditorial
  | SectionGalleryGrid
  | SectionGalleryTrio
  | SectionGalleryDuo
  | SectionGalleryHero
  | SectionQuoteProfile
  | SectionClosing
  | SectionCircuitMap
  | SectionSpotlight
  | SectionTextCenter
  | SectionCTABanner
  | SectionLinkedCards
  | SectionFooter
  | SectionLogos
  | SectionFaq

export type Page = {
  _key: string
  name: string
  sections: Section[]
}

export type CustomColor = {
  _key: string
  name: string
  hex: string
}

export type Brochure = {
  _id: string
  /** Sanity document revision. Used by the editor's autosave to guard
   *  against silently overwriting another admin's concurrent edits via
   *  the `ifRevisionID` patch option. */
  _rev?: string
  title: string
  slug: { current: string }
  season: string
  event?: string
  status: BrochureStatus
  lastEditedBy?: { name?: string; email?: string }
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
  publishedAt?: string
  featured?: boolean
  company?: { _ref: string; _type: 'reference' }
  /**
   * Decoded snapshot of the referenced company's branding. Populated by
   * GROQ projections that follow `company->{...}` so the reader and editor
   * preview can fall back to company defaults when the brochure-level field
   * is unset. NOT a persisted field — write paths must not include it.
   */
  companyBranding?: {
    _id?: string
    name?: string
    accentColor?: string
    logo?: SanityImage
    favicon?: SanityImage
  }
  ogImage?: SanityImage
  seo?: {
    metaTitle?: string
    metaDescription?: string
    ogImage?: SanityImage
    noIndex?: boolean
  }
  leadCapture?: {
    hubspotFormId?: string
    hubspotPortalId?: string
    destinationEmail?: string
  }
  /** Free-form context for the AI generator and per-field assists. */
  aiBrief?: {
    prompt?: string
    sources?: string[]
    generatedAt?: string
  }
  pages: Page[]
}

/**
 * Company — child-company tenant whose brochures live on a dedicated host.
 * Mirrors `schemas/company.ts`. Brochures with no company ref belong to the
 * canonical host.
 */
export type Company = {
  _id: string
  name: string
  slug?: { current: string }
  domain: string
  displayName: string
  website?: string
  logo?: SanityImage
  favicon?: SanityImage
  accentColor?: string
  featuredBrochure?: { _ref: string; _type: 'reference' }
}

/** Lightweight projection used by the host->company map. */
export type CompanyHostEntry = {
  _id: string
  domain: string
  displayName: string
  accentColor?: string
}
