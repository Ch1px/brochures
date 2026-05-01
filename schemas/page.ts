import { defineType, defineField } from 'sanity'

/**
 * A page within a brochure. Each page has a display name (used in the top nav)
 * and an ordered list of sections. Pages are the units of horizontal navigation —
 * the F1-style slider flips between pages, and each page's sections stack vertically.
 */
export default defineType({
  name: 'page',
  title: 'Page',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      description: 'Display name in the top nav, e.g. "Cover", "Introduction", "The Circuit".',
      validation: (Rule) => Rule.required().max(40),
    }),
    defineField({
      name: 'sections',
      type: 'array',
      description: 'One or more sections stacked vertically within this page.',
      of: [
        // All section types live here as polymorphic array members.
        // Each one has its own schema file in ./sections/.
        { type: 'cover' },
        { type: 'coverCentered' },
        { type: 'intro' },
        { type: 'contentImage' },
        { type: 'imageContent' },
        { type: 'sectionHeading' },
        { type: 'sectionHeadingCentered' },
        { type: 'features' },
        { type: 'imageHero' },
        { type: 'stats' },
        { type: 'packages' },
        { type: 'itinerary' },
        { type: 'galleryEditorial' },
        { type: 'galleryGrid' },
        { type: 'galleryTrio' },
        { type: 'galleryDuo' },
        { type: 'galleryHero' },
        { type: 'quoteProfile' },
        { type: 'closing' },
        { type: 'circuitMap' },
        { type: 'spotlight' },
        { type: 'textCenter' },
        { type: 'ctaBanner' },
        { type: 'linkedCards' },
        { type: 'footer' },
        { type: 'logoWall' },
        { type: 'logoStrip' },
        { type: 'faq' },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'name',
      sectionCount: 'sections.length',
    },
    prepare({ title, sectionCount }) {
      return {
        title: title || 'Untitled page',
        subtitle: `${sectionCount || 0} section${sectionCount === 1 ? '' : 's'}`,
      }
    },
  },
})
