'use client'

import { useEffect, useState } from 'react'
import type { Section, SectionFooter } from '@/types/brochure'
import type { BrandContext } from '@/lib/brandColorTokens'
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
import { CTABannerEditor } from './editors/CTABannerEditor'
import { LinkedCardsEditor } from './editors/LinkedCardsEditor'
import { FooterEditor } from './editors/FooterEditor'
import { LogosEditor } from './editors/LogosEditor'
import { SectionStylesEditor } from './editors/SectionStylesEditor'

type Props = {
  section: Section | null
  context?: {
    pageName: string
    sectionIndex: number
    totalSections: number
  } | null
  onChange: (update: Partial<Section>) => void
  brandContext?: BrandContext
  onAddCustomColor?: (name: string, hex: string) => void
  accentColor?: string
  recolorMode?: boolean
  onRecolorModeChange?: (next: boolean) => void
  onPickByColor?: (color: string) => void
  mapEditMode?: boolean
  onMapEditModeChange?: (on: boolean) => void
  selectedAnnotationKey?: string | null
  onSelectAnnotation?: (key: string | null) => void
  pendingAnnotationKind?: import('@/types/brochure').AnnotationKind | null
  onSetPendingAnnotation?: (kind: import('@/types/brochure').AnnotationKind | null) => void
}

type Tab = 'content' | 'styles'

/**
 * Right-panel dispatcher — picks the editor component for the selected section.
 * All 19 section types wired (20 _type values including variants).
 *
 * Two tabs:
 *   Content — text, image, video, and array fields (type-specific editors)
 *   Styles  — colour overrides, overlay strength, parallax, section background
 */
export function PropertiesPanel({
  section,
  context,
  onChange,
  brandContext,
  onAddCustomColor,
  accentColor,
  recolorMode = false,
  onRecolorModeChange,
  onPickByColor,
  mapEditMode,
  onMapEditModeChange,
  selectedAnnotationKey,
  onSelectAnnotation,
  pendingAnnotationKind,
  onSetPendingAnnotation,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('content')

  // Reset to Content tab when switching sections
  useEffect(() => {
    setActiveTab('content')
  }, [section?._key])

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

  const isFooter = section._type === 'footer'

  return (
    <div className="properties">
      <div className="properties-header">
        <div className="properties-type">{labelFor(section._type)}</div>
        {context ? (
          <div className="properties-context">
            {context.pageName}
            {context.sectionIndex >= 0
              ? ` · Section ${context.sectionIndex + 1} of ${context.totalSections}`
              : null}
          </div>
        ) : null}
        {!isFooter ? (
          <div className="properties-tabs">
            <button
              className={`properties-tab ${activeTab === 'content' ? 'active' : ''}`.trim()}
              onClick={() => setActiveTab('content')}
            >
              Content
            </button>
            <button
              className={`properties-tab ${activeTab === 'styles' ? 'active' : ''}`.trim()}
              onClick={() => setActiveTab('styles')}
            >
              Styles
            </button>
          </div>
        ) : null}
      </div>
      <div className="properties-body">
        {activeTab === 'content' || isFooter ? (
          renderEditor(section, onChange, accentColor, mapEditMode, onMapEditModeChange, recolorMode, onRecolorModeChange, onPickByColor, selectedAnnotationKey, onSelectAnnotation, pendingAnnotationKind, onSetPendingAnnotation)
        ) : (
          <SectionStylesEditor
            section={section as Exclude<Section, SectionFooter>}
            onChange={onChange}
            brandContext={brandContext}
            onAddCustomColor={onAddCustomColor}
          />
        )}
      </div>
    </div>
  )
}

function renderEditor(
  section: Section,
  onChange: (u: Partial<Section>) => void,
  accentColor?: string,
  mapEditMode?: boolean,
  onMapEditModeChange?: (on: boolean) => void,
  recolorMode = false,
  onRecolorModeChange?: (next: boolean) => void,
  onPickByColor?: (color: string) => void,
  selectedAnnotationKey?: string | null,
  onSelectAnnotation?: (key: string | null) => void,
  pendingAnnotationKind?: import('@/types/brochure').AnnotationKind | null,
  onSetPendingAnnotation?: (kind: import('@/types/brochure').AnnotationKind | null) => void,
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
      return (
        <CircuitMapEditor
          section={section}
          onChange={anyOnChange}
          accentColor={accentColor}
          mapEditMode={mapEditMode}
          onMapEditModeChange={onMapEditModeChange}
          recolorMode={recolorMode}
          onRecolorModeChange={onRecolorModeChange}
          onPickByColor={onPickByColor}
          selectedAnnotationKey={selectedAnnotationKey}
          onSelectAnnotation={onSelectAnnotation}
          pendingAnnotationKind={pendingAnnotationKind}
          onSetPendingAnnotation={onSetPendingAnnotation}
        />
      )
    case 'spotlight':
      return <SpotlightEditor section={section} onChange={anyOnChange} />
    case 'textCenter':
      return <TextCenterEditor section={section} onChange={anyOnChange} />
    case 'ctaBanner':
      return <CTABannerEditor section={section} onChange={anyOnChange} />
    case 'linkedCards':
      return <LinkedCardsEditor section={section} onChange={anyOnChange} />
    case 'footer':
      return <FooterEditor section={section} onChange={anyOnChange} />
    case 'logoWall':
    case 'logoStrip':
      return <LogosEditor section={section} onChange={anyOnChange} />
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
