'use client'

import type { Section, SectionFooter } from '@/types/brochure'
import type { BrandContext } from '@/lib/brandColorTokens'
import { FieldBrandColor } from '../fields/FieldBrandColor'
import { FieldBackground } from '../fields/FieldBackground'
import { FieldSelect } from '../fields/FieldSelect'
import { FieldBoolean } from '../fields/FieldBoolean'

type StylableSection = Exclude<Section, SectionFooter>

type Props = {
  section: StylableSection
  onChange: (update: Partial<Section>) => void
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
    accent: boolean
    overlay: boolean
    parallax: boolean
  }
> = {
  cover:                    { eyebrow: false, title: true,  body: true,  accent: true,  overlay: true,  parallax: false },
  coverCentered:            { eyebrow: false, title: true,  body: true,  accent: true,  overlay: true,  parallax: false },
  intro:                    { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  contentImage:             { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  imageContent:             { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  sectionHeading:           { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: true,  parallax: false },
  sectionHeadingCentered:   { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: true,  parallax: false },
  features:                 { eyebrow: false, title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  imageHero:                { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  stats:                    { eyebrow: true,  title: true,  body: false, accent: true,  overlay: false, parallax: false },
  packages:                 { eyebrow: true,  title: true,  body: false, accent: true,  overlay: false, parallax: false },
  itinerary:                { eyebrow: false, title: true,  body: false, accent: true,  overlay: false, parallax: false },
  galleryEditorial:         { eyebrow: false, title: true,  body: false, accent: false, overlay: false, parallax: false },
  galleryGrid:              { eyebrow: true,  title: true,  body: false, accent: true,  overlay: false, parallax: false },
  galleryDuo:               { eyebrow: true,  title: true,  body: false, accent: true,  overlay: false, parallax: false },
  galleryHero:              { eyebrow: true,  title: true,  body: false, accent: true,  overlay: false, parallax: false },
  quoteProfile:             { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  closing:                  { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: true,  parallax: false },
  circuitMap:               { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  spotlight:                { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: true,  parallax: true  },
  textCenter:               { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  ctaBanner:                { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  linkedCards:              { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  logoWall:                 { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
  logoStrip:                { eyebrow: true,  title: true,  body: true,  accent: true,  overlay: false, parallax: false },
}

const SCALE_OPTIONS = [
  { value: '', label: 'Default (brochure setting)' },
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

export function SectionStylesEditor({ section, onChange, brandContext, onAddCustomColor }: Props) {
  const config = STYLE_CONFIG[section._type]
  if (!config) return null

  // Cast to any for reading the optional style fields — safe because footer
  // is excluded at the call site and all other section types have these fields.
  const s = section as Record<string, unknown>
  const anyChange = onChange as (u: Record<string, unknown>) => void

  // Derive sensible fallbacks for each field from the brand context
  const accentFallback = brandContext?.accentColor || '#e10600'
  const textFallback = brandContext?.textColor || (brandContext?.theme === 'light' ? '#161618' : '#ffffff')
  const mutedFallback = brandContext?.textColor || (brandContext?.theme === 'light' ? '#6b6b6b' : '#a0a0a0')

  const hasColorFields = config.eyebrow || config.title || config.body || config.accent

  return (
    <>
      {hasColorFields ? (
        <>
          <div className="field-section-heading">Colours</div>
          {config.accent && (
            <FieldBrandColor
              label="Accent colour"
              description="Overrides the brochure accent for this section — eyebrows, CTAs, decorative elements."
              value={s.accentColor as string | undefined}
              onChange={(v) => anyChange({ accentColor: v })}
              fallback={accentFallback}
              brandContext={brandContext}
              onAddCustomColor={onAddCustomColor}
            />
          )}
          {config.eyebrow && (
            <FieldBrandColor
              label="Eyebrow colour"
              description="Override the eyebrow text colour."
              value={s.eyebrowColor as string | undefined}
              onChange={(v) => anyChange({ eyebrowColor: v })}
              fallback={accentFallback}
              brandContext={brandContext}
              onAddCustomColor={onAddCustomColor}
            />
          )}
          {config.title && (
            <FieldBrandColor
              label="Title colour"
              description="Override the title / heading text colour."
              value={s.titleColor as string | undefined}
              onChange={(v) => anyChange({ titleColor: v })}
              fallback={textFallback}
              brandContext={brandContext}
              onAddCustomColor={onAddCustomColor}
            />
          )}
          {config.body && (
            <FieldBrandColor
              label="Body / tagline colour"
              description="Override the body, tagline, or subtitle text colour."
              value={s.bodyColor as string | undefined}
              onChange={(v) => anyChange({ bodyColor: v })}
              fallback={mutedFallback}
              brandContext={brandContext}
              onAddCustomColor={onAddCustomColor}
            />
          )}
        </>
      ) : null}

      <div className="field-section-heading">Text sizes</div>
      {config.title && (
        <FieldSelect
          label="Title text size"
          description="Override the title size for this section."
          value={(s.titleScale as string) ?? ''}
          onChange={(v) => anyChange({ titleScale: v || undefined })}
          options={SCALE_OPTIONS}
        />
      )}
      {config.eyebrow && (
        <FieldSelect
          label="Eyebrow text size"
          description="Override the eyebrow size for this section."
          value={(s.eyebrowScale as string) ?? ''}
          onChange={(v) => anyChange({ eyebrowScale: v || undefined })}
          options={SCALE_OPTIONS}
        />
      )}
      {config.body && (
        <FieldSelect
          label="Body text size"
          description="Override the body/tagline size for this section."
          value={(s.bodyScale as string) ?? ''}
          onChange={(v) => anyChange({ bodyScale: v || undefined })}
          options={SCALE_OPTIONS}
        />
      )}

      {config.overlay || config.parallax ? (
        <>
          <div className="field-section-heading">Overlay</div>
          {config.overlay && (
            <FieldSelect
              label="Overlay strength"
              description="Controls the dark overlay over the background image."
              value={(s.overlayStrength as string) ?? 'medium'}
              onChange={(v) => anyChange({ overlayStrength: v })}
              options={OVERLAY_OPTIONS}
            />
          )}
          {config.parallax && (
            <FieldBoolean
              label="Parallax background"
              description="Background drifts slower than content as the page scrolls."
              value={s.backgroundParallax as boolean | undefined}
              onChange={(v) => anyChange({ backgroundParallax: v })}
            />
          )}
        </>
      ) : null}

      <div className="field-section-heading">Background</div>
      <FieldBackground
        label="Section background"
        description='Override the page background for this section. Pick a colour, type a hex/rgba value, or choose "None" for transparent.'
        value={section.background}
        onChange={(value) => anyChange({ background: value })}
      />
    </>
  )
}
