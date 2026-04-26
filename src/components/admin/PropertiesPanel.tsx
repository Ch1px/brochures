'use client'

import type { Section } from '@/types/brochure'
import { labelFor } from '@/lib/sectionLabels'
import { CoverEditor } from './editors/CoverEditor'
import { IntroEditor } from './editors/IntroEditor'
import { SplitSectionEditor } from './editors/SplitSectionEditor'
import { SectionHeadingEditor } from './editors/SectionHeadingEditor'
import { ImageHeroEditor } from './editors/ImageHeroEditor'
import { ClosingEditor } from './editors/ClosingEditor'
import { FeaturesEditor } from './editors/FeaturesEditor'
import { StatsEditor } from './editors/StatsEditor'
import { PackagesEditor } from './editors/PackagesEditor'
import { ItineraryEditor } from './editors/ItineraryEditor'
import { GalleryEditorialEditor } from './editors/GalleryEditorialEditor'
import { GalleryGridEditor } from './editors/GalleryGridEditor'
import { GalleryDuoEditor } from './editors/GalleryDuoEditor'
import { GalleryHeroEditor } from './editors/GalleryHeroEditor'
import { QuoteProfileEditor } from './editors/QuoteProfileEditor'
import { CircuitMapEditor } from './editors/CircuitMapEditor'
import { SpotlightEditor } from './editors/SpotlightEditor'
import { TextCenterEditor } from './editors/TextCenterEditor'
import { FieldBackground } from './fields/FieldBackground'

type Props = {
  section: Section | null
  onChange: (update: Partial<Section>) => void
  accentColor?: string
}

/**
 * Right-panel dispatcher — picks the editor component for the selected section.
 * All 19 section types wired (20 _type values including variants).
 * Image uploads are still disabled; the upload pipeline lands in sub-batch 2F.
 */
export function PropertiesPanel({ section, onChange, accentColor }: Props) {
  if (!section) {
    return (
      <div className="properties-empty">
        <div className="properties-empty-icon">✎</div>
        <div className="properties-empty-title">No section selected</div>
        <div className="properties-empty-hint">
          Click a section in the preview or the left panel to edit its properties.
        </div>
      </div>
    )
  }

  return (
    <div className="properties">
      <div className="properties-header">
        <div className="properties-type">{labelFor(section._type)}</div>
        <div className="properties-key">{section._key}</div>
      </div>
      <div className="properties-body">
        {renderEditor(section, onChange, accentColor)}
        <div className="properties-section-divider" />
        <FieldBackground
          label="Section background"
          description='Override the page background for this section. Pick a colour, type a hex/rgba value, or choose "None" for transparent.'
          value={section.background}
          onChange={(value) => onChange({ background: value } as Partial<Section>)}
        />
      </div>
    </div>
  )
}

function renderEditor(
  section: Section,
  onChange: (u: Partial<Section>) => void,
  accentColor?: string
) {
  // Each editor narrows to its own section type. The cast on onChange is safe
  // because the editor only passes partials valid for that narrower type.
  const anyOnChange = onChange as (u: Record<string, unknown>) => void
  switch (section._type) {
    case 'cover':
    case 'coverCentered':
      return <CoverEditor section={section} onChange={anyOnChange} />
    case 'intro':
      return <IntroEditor section={section} onChange={anyOnChange} />
    case 'contentImage':
    case 'imageContent':
      return <SplitSectionEditor section={section} onChange={anyOnChange} />
    case 'sectionHeading':
    case 'sectionHeadingCentered':
      return <SectionHeadingEditor section={section} onChange={anyOnChange} />
    case 'imageHero':
      return <ImageHeroEditor section={section} onChange={anyOnChange} />
    case 'closing':
      return <ClosingEditor section={section} onChange={anyOnChange} />
    case 'features':
      return <FeaturesEditor section={section} onChange={anyOnChange} />
    case 'stats':
      return <StatsEditor section={section} onChange={anyOnChange} />
    case 'packages':
      return <PackagesEditor section={section} onChange={anyOnChange} />
    case 'itinerary':
      return <ItineraryEditor section={section} onChange={anyOnChange} />
    case 'galleryEditorial':
      return <GalleryEditorialEditor section={section} onChange={anyOnChange} />
    case 'galleryGrid':
      return <GalleryGridEditor section={section} onChange={anyOnChange} />
    case 'galleryDuo':
      return <GalleryDuoEditor section={section} onChange={anyOnChange} />
    case 'galleryHero':
      return <GalleryHeroEditor section={section} onChange={anyOnChange} />
    case 'quoteProfile':
      return <QuoteProfileEditor section={section} onChange={anyOnChange} />
    case 'circuitMap':
      return <CircuitMapEditor section={section} onChange={anyOnChange} accentColor={accentColor} />
    case 'spotlight':
      return <SpotlightEditor section={section} onChange={anyOnChange} />
    case 'textCenter':
      return <TextCenterEditor section={section} onChange={anyOnChange} />
    default:
      return (
        <div className="properties-pending">
          <p>
            Editor for <strong>{labelFor((section as Section)._type)}</strong> not wired.
          </p>
        </div>
      )
  }
}
