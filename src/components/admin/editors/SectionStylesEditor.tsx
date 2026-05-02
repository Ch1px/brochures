'use client'

import type { Section, SectionFooter } from '@/types/brochure'
import type { BrandContext } from '@/lib/brandColorTokens'
import { FieldBrandColor } from '../fields/FieldBrandColor'
import { FieldStyleList, type StyleEntry } from '../fields/FieldStyleList'

type StylableSection = Exclude<Section, SectionFooter>

type Props = {
  section: StylableSection
  onChange: (update: Partial<Section>) => void
  onApplyImageTreatmentToAll?: (
    treatment: {
      overlayStrength?: string
      overlayColor?: string
      mediaGrayscale?: string
      mediaBlur?: string
    },
    typeFilter?: string[],
  ) => void
  imageTreatmentGroup?: { types: string[]; label: string; count: number } | null
  brandContext?: BrandContext
  onAddCustomColor?: (name: string, hex: string) => void
}

/**
 * Which colour override fields to show per section type.
 * Footer is never rendered here (excluded at the PropertiesPanel level).
 */
const STYLE_CONFIG: Record<
  string,
  {
    eyebrow: boolean
    title: boolean
    body: boolean
    titleAccent: boolean
    accent: boolean
    overlay: boolean
    grayscale: boolean
    blur: boolean
    parallax: boolean
    hideImageDecor: boolean
  }
> = {
  cover:                    { eyebrow: false, title: true,  body: true,  titleAccent: true,  accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  coverCentered:            { eyebrow: false, title: true,  body: true,  titleAccent: true,  accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  intro:                    { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: true  },
  contentImage:             { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: true  },
  imageContent:             { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: true  },
  sectionHeading:           { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  sectionHeadingCentered:   { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  features:                 { eyebrow: false, title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  imageHero:                { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  stats:                    { eyebrow: true,  title: true,  body: false, titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  packages:                 { eyebrow: true,  title: true,  body: false, titleAccent: false, accent: true,  overlay: false, grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  itinerary:                { eyebrow: false, title: true,  body: false, titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  galleryEditorial:         { eyebrow: false, title: true,  body: false, titleAccent: false, accent: false, overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  galleryGrid:              { eyebrow: true,  title: true,  body: false, titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  galleryTrio:              { eyebrow: true,  title: true,  body: false, titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  galleryDuo:               { eyebrow: true,  title: true,  body: false, titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  galleryHero:              { eyebrow: true,  title: true,  body: false, titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  quoteProfile:             { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: true  },
  closing:                  { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  circuitMap:               { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  spotlight:                { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: true,  hideImageDecor: false },
  textCenter:               { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  ctaBanner:                { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  linkedCards:              { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: true,  grayscale: true,  blur: true,  parallax: false, hideImageDecor: false },
  logoWall:                 { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  logoStrip:                { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
  faq:                      { eyebrow: true,  title: true,  body: true,  titleAccent: false, accent: true,  overlay: false, grayscale: false, blur: false, parallax: false, hideImageDecor: false },
}

const SCALE_OPTIONS = [
  { value: '', label: 'Default (brochure setting)' },
  { value: 'xxs', label: 'XXS — Tiny' },
  { value: 'xs', label: 'XS — Compact' },
  { value: 's', label: 'S — Small' },
  { value: 'm', label: 'M — Medium' },
  { value: 'l', label: 'L — Large' },
  { value: 'xl', label: 'XL — Extra Large' },
]

const OVERLAY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium (default)' },
  { value: 'strong', label: 'Strong' },
]

const GRAYSCALE_OPTIONS = [
  { value: '', label: 'None (default)' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'full', label: 'Full' },
]

const BLUR_OPTIONS = [
  { value: '', label: 'None (default)' },
  { value: 'light', label: 'Light' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
]

/**
 * Sections where the overlay/cover historically defaulted to 'medium'
 * (cover, closing, sectionHeading, spotlight, linkedCards). For newcomers
 * the default is 'none' so adding image controls doesn't change the
 * existing visual.
 */
const OVERLAY_DEFAULT_MEDIUM = new Set([
  'cover',
  'coverCentered',
  'sectionHeading',
  'sectionHeadingCentered',
  'closing',
  'spotlight',
  'linkedCards',
])

export function SectionStylesEditor({ section, onChange, onApplyImageTreatmentToAll, imageTreatmentGroup, brandContext, onAddCustomColor }: Props) {
  const config = STYLE_CONFIG[section._type]
  if (!config) return null

  // Cast to any for reading the optional style fields — safe because footer
  // is excluded at the call site and all other section types have these fields.
  const s = section as Record<string, unknown>
  const anyChange = onChange as (u: Record<string, unknown>) => void

  // Derive sensible fallbacks for each field from the brand context.
  // Title prefers the brochure-level Title override; both Title and Body fall
  // back to brochure-level Text and finally the theme default.
  const accentFallback = brandContext?.accentColor || '#cf212a'
  const themeTextFallback = brandContext?.theme === 'light' ? '#161618' : '#ffffff'
  const textFallback = brandContext?.textColor || themeTextFallback
  const titleFallback = brandContext?.titleColor || textFallback
  // Body renders at 75% alpha of Text, mirroring the brochure-level model.
  const mutedFallback = (() => {
    const hex = textFallback.replace('#', '')
    if (hex.length !== 6) return textFallback
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, 0.75)`
  })()

  // The Colours group always renders — even sections without text-colour
  // overrides still expose Section background (and Overlay colour where applicable).
  const hasColorFields = true

  const supportsContentAlign =
    section._type === 'intro' ||
    section._type === 'contentImage' ||
    section._type === 'imageContent' ||
    section._type === 'linkedCards' ||
    section._type === 'sectionHeading' ||
    section._type === 'sectionHeadingCentered'

  return (
    <>
      {supportsContentAlign && (
        <>
          <div className="field-section-heading">Layout</div>
          <FieldStyleList
            entries={[{
              kind: 'select',
              key: 'contentAlign',
              label: 'Content alignment',
              icon: '⇆',
              value: (s.contentAlign as string) || undefined,
              onChange: (v) => anyChange({ contentAlign: v || undefined }),
              options: (section._type === 'sectionHeading' || section._type === 'sectionHeadingCentered')
                ? [
                    { value: 'left', label: 'Left' },
                    { value: '', label: 'Center (default)' },
                    { value: 'right', label: 'Right' },
                  ]
                : [
                    { value: '', label: 'Left (default)' },
                    { value: 'center', label: 'Center' },
                    { value: 'right', label: 'Right' },
                  ],
            } satisfies StyleEntry]}
          />
        </>
      )}
      {hasColorFields ? (
        <>
          <div className="field-section-heading">Colours</div>
          <FieldStyleList
            entries={[
              ...(config.accent
                ? [{
                    kind: 'color',
                    key: 'accent',
                    label: 'Accent',
                    description: 'Overrides the brochure accent for this section — eyebrows, CTAs, decorative elements.',
                    value: s.accentColor as string | undefined,
                    onChange: (v) => anyChange({ accentColor: v }),
                    fallback: accentFallback,
                  } satisfies StyleEntry]
                : []),
              ...(config.eyebrow
                ? [{
                    kind: 'color',
                    key: 'eyebrow',
                    label: 'Eyebrow',
                    description: 'Override the eyebrow text colour.',
                    value: s.eyebrowColor as string | undefined,
                    onChange: (v) => anyChange({ eyebrowColor: v }),
                    fallback: accentFallback,
                  } satisfies StyleEntry]
                : []),
              ...(config.title
                ? [{
                    kind: 'color',
                    key: 'title',
                    label: 'Title',
                    description: 'Override the title / heading text colour.',
                    value: s.titleColor as string | undefined,
                    onChange: (v) => anyChange({ titleColor: v }),
                    fallback: titleFallback,
                  } satisfies StyleEntry]
                : []),
              ...(config.titleAccent
                ? [{
                    kind: 'color',
                    key: 'titleAccent',
                    label: 'Title accent',
                    description: 'Override the title accent (script-font emphasis) colour. Defaults to the section accent.',
                    value: s.titleAccentColor as string | undefined,
                    onChange: (v) => anyChange({ titleAccentColor: v }),
                    fallback: accentFallback,
                  } satisfies StyleEntry]
                : []),
              ...(config.body
                ? [{
                    kind: 'color',
                    key: 'body',
                    label: 'Body',
                    description: 'Override the body, tagline, or subtitle colour. Defaults to the Text colour at 75% opacity.',
                    value: s.bodyColor as string | undefined,
                    onChange: (v) => anyChange({ bodyColor: v }),
                    fallback: mutedFallback,
                  } satisfies StyleEntry]
                : []),
              {
                kind: 'color',
                key: 'background',
                label: 'Section background',
                description: 'Override the page background for this section.',
                value: section.background,
                onChange: (v) => anyChange({ background: v }),
                fallback: brandContext?.backgroundColor || (brandContext?.theme === 'light' ? '#f6f5f1' : '#161618'),
              } satisfies StyleEntry,
            ]}
            brandContext={brandContext}
            onAddCustomColor={onAddCustomColor}
          />
        </>
      ) : null}

      {config.title || config.eyebrow || config.body || config.titleAccent ? (
        <>
          <div className="field-section-heading">Text sizes</div>
          <FieldStyleList
            entries={[
              ...(config.title
                ? [{
                    kind: 'select',
                    key: 'title',
                    label: 'Title',
                    icon: 'A',
                    value: (s.titleScale as string) || undefined,
                    onChange: (v) => anyChange({ titleScale: v || undefined }),
                    options: SCALE_OPTIONS,
                  } satisfies StyleEntry]
                : []),
              ...(config.eyebrow
                ? [{
                    kind: 'select',
                    key: 'eyebrow',
                    label: 'Eyebrow',
                    icon: 'A',
                    value: (s.eyebrowScale as string) || undefined,
                    onChange: (v) => anyChange({ eyebrowScale: v || undefined }),
                    options: SCALE_OPTIONS,
                  } satisfies StyleEntry]
                : []),
              ...(config.body
                ? [{
                    kind: 'select',
                    key: 'body',
                    label: 'Body',
                    icon: 'A',
                    value: (s.bodyScale as string) || undefined,
                    onChange: (v) => anyChange({ bodyScale: v || undefined }),
                    options: SCALE_OPTIONS,
                  } satisfies StyleEntry]
                : []),
              ...(config.titleAccent
                ? [{
                    kind: 'select',
                    key: 'titleAccent',
                    label: 'Title accent',
                    icon: 'A',
                    value: (s.titleAccentScale as string) || undefined,
                    onChange: (v) => anyChange({ titleAccentScale: v || undefined }),
                    options: SCALE_OPTIONS,
                  } satisfies StyleEntry]
                : []),
            ]}
          />
        </>
      ) : null}

      {config.overlay || config.grayscale || config.blur || config.parallax || config.hideImageDecor ? (
        <>
          <div className="field-section-heading">{section._type === 'spotlight' ? 'Background image' : 'Images'}</div>
          <FieldStyleList
            brandContext={brandContext}
            onAddCustomColor={onAddCustomColor}
            entries={[
              ...(config.overlay
                ? [{
                    kind: 'select',
                    key: 'overlayStrength',
                    label: 'Overlay strength',
                    icon: '◐',
                    value: (s.overlayStrength as string) ?? (OVERLAY_DEFAULT_MEDIUM.has(section._type) ? 'medium' : 'none'),
                    onChange: (v: string | undefined) => anyChange({ overlayStrength: v ?? 'none' }),
                    options: OVERLAY_OPTIONS,
                  } satisfies StyleEntry]
                : []),
              ...(config.overlay
                ? [{
                    kind: 'color',
                    key: 'overlayColor',
                    label: 'Overlay colour',
                    description: 'Override the overlay tint for this section.',
                    icon: '◐',
                    value: s.overlayColor as string | undefined,
                    onChange: (v) => anyChange({ overlayColor: v }),
                    fallback: brandContext?.backgroundColor || '#000000',
                  } satisfies StyleEntry]
                : []),
              ...(config.grayscale
                ? [{
                    kind: 'select',
                    key: 'mediaGrayscale',
                    label: 'Image greyscale',
                    icon: '◑',
                    value: (s.mediaGrayscale as string) || undefined,
                    onChange: (v: string | undefined) => anyChange({ mediaGrayscale: v || undefined }),
                    options: GRAYSCALE_OPTIONS,
                  } satisfies StyleEntry]
                : []),
              ...(config.blur
                ? [{
                    kind: 'select',
                    key: 'mediaBlur',
                    label: 'Image blur',
                    icon: '◌',
                    value: (s.mediaBlur as string) || undefined,
                    onChange: (v: string | undefined) => anyChange({ mediaBlur: v || undefined }),
                    options: BLUR_OPTIONS,
                  } satisfies StyleEntry]
                : []),
              ...(config.parallax
                ? [{
                    kind: 'toggle',
                    key: 'backgroundParallax',
                    label: 'Parallax background',
                    icon: '⇅',
                    value: s.backgroundParallax as boolean | undefined,
                    onChange: (v) => anyChange({ backgroundParallax: v }),
                  } satisfies StyleEntry]
                : []),
              ...(config.hideImageDecor
                ? [{
                    kind: 'toggle',
                    key: 'hideImageDecor',
                    label: 'Hide accent decoration',
                    icon: '⌐',
                    value: s.hideImageDecor as boolean | undefined,
                    onChange: (v) => anyChange({ hideImageDecor: v || undefined }),
                  } satisfies StyleEntry]
                : []),
            ]}
          />
          {(config.overlay || config.grayscale || config.blur) && onApplyImageTreatmentToAll ? (
            <div className="apply-to-all-row">
              {imageTreatmentGroup && imageTreatmentGroup.count > 1 ? (
                <button
                  type="button"
                  className="apply-to-all-link"
                  title={`Copy these image settings to every ${imageTreatmentGroup.label.replace(/s$/, '')} in the brochure (${imageTreatmentGroup.count} sections). Use Undo to revert.`}
                  onClick={() => {
                    if (
                      !window.confirm(
                        `Apply this section\u2019s overlay, colour, greyscale and blur to all ${imageTreatmentGroup.count} ${imageTreatmentGroup.label} in the brochure? Existing values will be overwritten. (Use Undo to revert.)`
                      )
                    )
                      return
                    onApplyImageTreatmentToAll(
                      {
                        overlayStrength: s.overlayStrength as string | undefined,
                        overlayColor: s.overlayColor as string | undefined,
                        mediaGrayscale: s.mediaGrayscale as string | undefined,
                        mediaBlur: s.mediaBlur as string | undefined,
                      },
                      imageTreatmentGroup.types,
                    )
                  }}
                >
                  Apply to all {imageTreatmentGroup.label}
                </button>
              ) : null}
              <button
                type="button"
                className="apply-to-all-link"
                title="Copy these image settings to every other image-bearing section in the brochure. Use Undo to revert."
                onClick={() => {
                  if (
                    !window.confirm(
                      'Apply this section\u2019s overlay, colour, greyscale and blur to every other image-bearing section in the brochure? Existing values on those sections will be overwritten. (Use Undo to revert.)'
                    )
                  )
                    return
                  onApplyImageTreatmentToAll({
                    overlayStrength: s.overlayStrength as string | undefined,
                    overlayColor: s.overlayColor as string | undefined,
                    mediaGrayscale: s.mediaGrayscale as string | undefined,
                    mediaBlur: s.mediaBlur as string | undefined,
                  })
                }}
              >
                Apply to all images
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {section._type === 'spotlight' ? (
        <>
          <div className="field-section-heading">Foreground image</div>
          <FieldStyleList
            brandContext={brandContext}
            onAddCustomColor={onAddCustomColor}
            entries={[
              {
                kind: 'select',
                key: 'fgOverlayStrength',
                label: 'Overlay strength',
                icon: '◐',
                value: (s.foregroundOverlayStrength as string) ?? 'none',
                onChange: (v) => anyChange({ foregroundOverlayStrength: v ?? 'none' }),
                options: OVERLAY_OPTIONS,
              } satisfies StyleEntry,
              {
                kind: 'color',
                key: 'fgOverlayColor',
                label: 'Overlay colour',
                description: 'Override the foreground card overlay tint.',
                icon: '◐',
                value: s.foregroundOverlayColor as string | undefined,
                onChange: (v) => anyChange({ foregroundOverlayColor: v }),
                fallback: brandContext?.backgroundColor || '#000000',
              } satisfies StyleEntry,
              {
                kind: 'select',
                key: 'fgGrayscale',
                label: 'Image greyscale',
                icon: '◑',
                value: (s.foregroundMediaGrayscale as string) || undefined,
                onChange: (v) => anyChange({ foregroundMediaGrayscale: v || undefined }),
                options: GRAYSCALE_OPTIONS,
              } satisfies StyleEntry,
              {
                kind: 'select',
                key: 'fgBlur',
                label: 'Image blur',
                icon: '◌',
                value: (s.foregroundMediaBlur as string) || undefined,
                onChange: (v) => anyChange({ foregroundMediaBlur: v || undefined }),
                options: BLUR_OPTIONS,
              } satisfies StyleEntry,
            ]}
          />
        </>
      ) : null}
    </>
  )
}
