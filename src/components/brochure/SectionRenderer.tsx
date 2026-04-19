import type { Section } from '@/types/brochure'
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
function sanitizeBackground(value: string | undefined): string | null {
  if (!value) return null
  const v = value.trim()
  if (!v) return null
  if (/^#[0-9a-f]{3,8}$/i.test(v)) return v
  if (/^(rgb|rgba|hsl|hsla)\s*\(\s*[0-9.,\s%]+\)$/i.test(v)) return v
  if (/^[a-z]+$/i.test(v)) return v
  return null
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

    default:
      return <UnsupportedSection type={(section as { _type: string })._type} />
  }
}

export function SectionRenderer(props: Props) {
  const element = renderSection(props)
  const bg = sanitizeBackground(props.section.background)
  if (!bg) return element
  const css = `[data-section-id="${props.section._key}"]{background:${bg} !important;}`
  return (
    <>
      <style>{css}</style>
      {element}
    </>
  )
}
