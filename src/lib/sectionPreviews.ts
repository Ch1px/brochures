import type { Section } from '@/types/brochure'

/**
 * Mini-preview HTML for each section type in the Add Section modal.
 * Ported 1:1 from the builder's PAGE_TYPES[type].preview strings — the
 * classes used here (.mini-cover, .mini-ci, .mini-section-heading, etc.)
 * are styled in globals.css so the previews render identically to the builder.
 *
 * These are inert markup strings inlined via dangerouslySetInnerHTML —
 * they contain no user data, only static HTML/SVG from our own codebase.
 */
export const SECTION_PREVIEW_HTML: Record<Section['_type'], string> = {
  cover:
    '<div class="mini-cover"><div class="m-title">Monaco<br/><span class="m-red">Grand Prix</span></div></div>',
  coverCentered:
    '<div class="mini-cover mini-cover-centered"><div class="m-title">Monaco<br/><span class="m-red">Grand Prix</span></div></div>',
  intro: '<div class="mini-intro"><div></div><div></div></div>',
  sectionHeading:
    '<div class="mini-section-heading"><div class="e">Drama is</div><div class="s">SERVED</div></div>',
  sectionHeadingCentered:
    '<div class="mini-section-heading mini-section-heading-centered"><div class="e">Drama is</div><div class="s">SERVED</div></div>',
  contentImage:
    '<div class="mini-ci mini-ci-ltr"><div class="mini-ci-text"><div class="mini-ci-eyebrow"></div><div class="mini-ci-title"></div><div class="mini-ci-body"></div><div class="mini-ci-body"></div></div><div class="mini-ci-image"></div></div>',
  imageContent:
    '<div class="mini-ci mini-ci-rtl"><div class="mini-ci-image"></div><div class="mini-ci-text"><div class="mini-ci-eyebrow"></div><div class="mini-ci-title"></div><div class="mini-ci-body"></div><div class="mini-ci-body"></div></div></div>',
  imageHero:
    '<div class="mini-hero"><div class="t">Chasing<br/>the sun</div></div>',
  features:
    '<div class="mini-features"><div class="mini-features-row"><div></div><div></div><div></div></div></div>',
  stats:
    '<div class="mini-stats"><div class="mini-stats-grid"><div>3.3</div><div>78</div><div>19</div><div>290</div></div></div>',
  packages:
    '<div class="mini-packages"><div class="mini-packages-row"><div></div><div></div><div></div></div></div>',
  itinerary:
    '<div class="mini-itinerary"><div class="mini-itinerary-row"><div>01</div><div></div></div><div class="mini-itinerary-row"><div>02</div><div></div></div><div class="mini-itinerary-row"><div>03</div><div></div></div><div class="mini-itinerary-row"><div>04</div><div></div></div></div>',
  galleryEditorial:
    '<div class="mini-gallery"><div></div><div></div><div></div><div></div></div>',
  galleryGrid:
    '<div class="mini-gg"><div></div><div></div><div></div><div></div><div></div><div></div></div>',
  galleryDuo: '<div class="mini-gd"><div></div><div></div></div>',
  galleryHero:
    '<div class="mini-gh"><div class="mini-gh-hero"></div><div class="mini-gh-strip"><div></div><div></div><div></div></div></div>',
  quoteProfile:
    '<div class="mini-quote-profile"><div></div><div><div class="q"></div><div class="b"></div><div class="b"></div><div class="b"></div></div></div>',
  circuitMap:
    '<div class="mini-circuit"><svg viewBox="0 0 80 50" xmlns="http://www.w3.org/2000/svg"><path d="M10 25 Q 20 10 40 15 T 70 20 Q 72 30 60 35 L 30 38 Q 15 38 10 25 Z" fill="none" stroke="#e10600" stroke-width="2"/></svg><div class="mini-circuit-stats"><div></div><div></div><div></div></div></div>',
  closing:
    '<div class="mini-closing"><div class="t">Take your<br/>seat</div><div class="b"></div></div>',
  spotlight:
    '<div class="mini-spotlight"><div class="mini-spotlight-inner"><div class="mini-spotlight-image"></div><div class="mini-spotlight-text"><div class="mini-spotlight-eyebrow"></div><div class="mini-spotlight-title"></div><div class="mini-spotlight-body"></div><div class="mini-spotlight-body"></div></div></div></div>',
  textCenter:
    '<div class="mini-text-center"><div class="mini-text-center-eyebrow"></div><div class="mini-text-center-title"></div><div class="mini-text-center-body"></div><div class="mini-text-center-body"></div><div class="mini-text-center-body"></div></div>',
}

/**
 * Ordered list used by the Add Section modal. The order is the builder's
 * natural reading flow: covers, chapter openers, text+image, hero/features,
 * commercial content (stats/packages/itinerary), galleries, specialised,
 * and closing last.
 */
export const SECTION_PICKER_ORDER: Section['_type'][] = [
  'cover',
  'coverCentered',
  'intro',
  'sectionHeading',
  'sectionHeadingCentered',
  'contentImage',
  'imageContent',
  'spotlight',
  'textCenter',
  'imageHero',
  'features',
  'stats',
  'packages',
  'itinerary',
  'galleryEditorial',
  'galleryGrid',
  'galleryDuo',
  'galleryHero',
  'quoteProfile',
  'circuitMap',
  'closing',
]
