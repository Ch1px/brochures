import type { Section } from '@/types/brochure'

/**
 * Maps each section _type to the human-readable label shown in the
 * pages/sections tree and the add-section modal. Ported 1:1 from the
 * builder's PAGE_TYPES[type].label values.
 */
export const SECTION_LABELS: Record<Section['_type'], string> = {
  cover: 'Cover',
  coverCentered: 'Cover · Centered',
  intro: 'Introduction',
  contentImage: 'Content · Image',
  imageContent: 'Image · Content',
  sectionHeading: 'Section Heading',
  sectionHeadingCentered: 'Section Heading · Centered',
  features: 'Three Features',
  imageHero: 'Image Hero',
  stats: 'Numbers',
  packages: 'Packages',
  itinerary: 'Itinerary',
  galleryEditorial: 'Gallery · Editorial',
  galleryGrid: 'Gallery · Grid',
  galleryDuo: 'Gallery · Duo',
  galleryHero: 'Gallery · Hero',
  quoteProfile: 'Quote + Profile',
  closing: 'Closing',
  circuitMap: 'Circuit Map',
  spotlight: 'Spotlight',
  textCenter: 'Text · Center',
}

export const SECTION_DESCRIPTIONS: Record<Section['_type'], string> = {
  cover: 'Event title with entry CTA',
  coverCentered: 'Cover with all text centered',
  intro: 'Accent letter + lead text + image',
  contentImage: 'Content on left, image on right',
  imageContent: 'Image on left, content on right',
  sectionHeading: 'Chapter opener: script eyebrow + bold title',
  sectionHeadingCentered: 'Chapter opener with centered text',
  features: 'Three image/text cards below a title',
  imageHero: 'Full-bleed image with overlay title',
  stats: 'Grid of key statistics',
  packages: 'Tiered hospitality cards',
  itinerary: 'Day-by-day schedule',
  galleryEditorial: 'Asymmetric editorial grid (hero + 3)',
  galleryGrid: '6 equal tiles, 3 columns × 2 rows',
  galleryDuo: 'Two large side-by-side images',
  galleryHero: 'One lead image with three thumbs below',
  quoteProfile: 'Featured quote with circular profile photo',
  closing: 'Final CTA with contact',
  circuitMap: 'SVG circuit diagram with stats',
  spotlight: 'Framed image + content with a full-bleed background image',
  textCenter: 'Simple centered body text block',
}

export function labelFor(type: Section['_type']): string {
  return SECTION_LABELS[type] ?? type
}
