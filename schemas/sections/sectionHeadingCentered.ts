import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'sectionHeadingCentered',
  title: 'Section Heading · Centered',
  type: 'object',
  description: 'Section heading with all text centered.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'text', type: 'text', rows: 3 }),
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'overlayStrength',
      type: 'string',
      title: 'Overlay strength',
      description: 'Controls the dark overlay over the background image. Default: medium.',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Light', value: 'light' },
          { title: 'Medium (default)', value: 'medium' },
          { title: 'Strong', value: 'strong' },
        ],
      },
    }),
    defineField({
      name: 'overlayColor',
      title: 'Overlay colour',
      type: 'string',
      description: 'Override the overlay tint for this section. Hex format (e.g. #0a0a0c) or a brand token like "var:bg". Leave blank to inherit from the brochure background.',
    }),
    ...imageMediaFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Section Heading · Centered · ${title || 'Untitled'}`,
      subtitle,
      media,
    }),
  },
})
