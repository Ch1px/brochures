import { defineField } from 'sanity'

/**
 * Per-section colour override fields. Included in every section schema
 * (except footer) so admins can override text colours on individual sections.
 * Leave blank to inherit the brochure-level defaults.
 */
export const sectionStyleFields = [
  defineField({
    name: 'eyebrowColor',
    title: 'Eyebrow colour',
    type: 'string',
    description:
      'Override the eyebrow text colour for this section. Hex format (e.g. #1a8cd8). Leave blank for the brochure default.',
  }),
  defineField({
    name: 'titleColor',
    title: 'Title colour',
    type: 'string',
    description:
      'Override the title text colour for this section. Hex format. Leave blank for the brochure default.',
  }),
  defineField({
    name: 'bodyColor',
    title: 'Body / tagline colour',
    type: 'string',
    description:
      'Override the body and tagline text colour for this section. Hex format. Leave blank for the brochure default.',
  }),
  defineField({
    name: 'accentColor',
    title: 'Section accent colour',
    type: 'string',
    description:
      'Override the accent colour (brand red) for this section — affects eyebrows, CTAs, decorative elements. Hex format. Leave blank for the brochure default.',
  }),
]
