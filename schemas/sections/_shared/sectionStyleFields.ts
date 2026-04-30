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
  defineField({
    name: 'titleAccentColor',
    title: 'Title accent colour',
    type: 'string',
    description:
      'Override the title accent (script-font emphasis) colour. Hex format or brand token. Defaults to the section accent. Only used by cover sections.',
  }),
  defineField({
    name: 'titleScale',
    title: 'Title text size',
    type: 'string',
    description: 'Override the title text size for this section. Leave blank to use the brochure default.',
    options: {
      list: [
        { title: 'XXS — Tiny', value: 'xxs' },
        { title: 'XS — Compact', value: 'xs' },
        { title: 'S — Small', value: 's' },
        { title: 'M — Default', value: 'm' },
        { title: 'L — Large', value: 'l' },
        { title: 'XL — Extra Large', value: 'xl' },
      ],
    },
  }),
  defineField({
    name: 'eyebrowScale',
    title: 'Eyebrow text size',
    type: 'string',
    description: 'Override the eyebrow text size for this section. Leave blank to use the brochure default.',
    options: {
      list: [
        { title: 'XXS — Tiny', value: 'xxs' },
        { title: 'XS — Compact', value: 'xs' },
        { title: 'S — Small', value: 's' },
        { title: 'M — Default', value: 'm' },
        { title: 'L — Large', value: 'l' },
        { title: 'XL — Extra Large', value: 'xl' },
      ],
    },
  }),
  defineField({
    name: 'bodyScale',
    title: 'Body text size',
    type: 'string',
    description: 'Override the body/tagline text size for this section. Leave blank to use the brochure default.',
    options: {
      list: [
        { title: 'XXS — Tiny', value: 'xxs' },
        { title: 'XS — Compact', value: 'xs' },
        { title: 'S — Small', value: 's' },
        { title: 'M — Default', value: 'm' },
        { title: 'L — Large', value: 'l' },
        { title: 'XL — Extra Large', value: 'xl' },
      ],
    },
  }),
  defineField({
    name: 'titleAccentScale',
    title: 'Title accent text size',
    type: 'string',
    description: 'Override the title accent (script-font emphasis) text size for this section. Leave blank to use the brochure default.',
    options: {
      list: [
        { title: 'XXS — Tiny', value: 'xxs' },
        { title: 'XS — Compact', value: 'xs' },
        { title: 'S — Small', value: 's' },
        { title: 'M — Default', value: 'm' },
        { title: 'L — Large', value: 'l' },
        { title: 'XL — Extra Large', value: 'xl' },
      ],
    },
  }),
]
