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

export type TextScalePreset = 'xs' | 's' | 'm' | 'l' | 'xl'

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

export type SectionCover = {
  _key: string
  _type: 'cover' | 'coverCentered'
  edition?: string
  brandMark?: string
  sup?: string
  title: string
  titleAccent?: string
  tag?: string
  cta?: string
  ctaHref?: string
  ref?: string
  image?: SanityImage
  video?: SanityFile
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  background?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
}

export type SectionIntro = {
  _key: string
  _type: 'intro'
  letter?: string
  eyebrow?: string
  title: string
  body?: string
  ctaText?: string
  ctaHref?: string
  image?: SanityImage
  video?: SanityFile
  caption?: string
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
  _type: 'sectionHeading' | 'sectionHeadingCentered'
  eyebrow?: string
  title: string
  text?: string
  ctaText?: string
  ctaHref?: string
  image?: SanityImage
  video?: SanityFile
  overlayStrength?: 'none' | 'light' | 'medium' | 'strong'
  background?: string
  eyebrowColor?: string
  titleColor?: string
  bodyColor?: string
  accentColor?: string
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  bodyScale?: TextScalePreset
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
  title: string
  slug: { current: string }
  season: string
  event?: string
  status: BrochureStatus
  theme?: BrochureTheme
  accentColor?: string
  backgroundColor?: string
  textColor?: string
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
  pages: Page[]
}
