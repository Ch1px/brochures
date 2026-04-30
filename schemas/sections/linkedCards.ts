import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'linkedCards',
  title: 'Linked Cards',
  type: 'object',
  description: 'Side-by-side cards with images, titles, descriptions, and link buttons.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string' }),
    defineField({
      name: 'cards',
      type: 'array',
      description: 'Up to 4 linked cards.',
      validation: (Rule) => Rule.max(4),
      of: [
        {
          type: 'object',
          name: 'linkedCard',
          fields: [
            defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'text', type: 'text', rows: 3 }),
            defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
            defineField({ name: 'linkText', type: 'string', description: 'Link button label, e.g. "Take me there".' }),
            defineField({ name: 'linkHref', type: 'string', description: 'Link target: a full URL or an internal path.' }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'linkText', media: 'image' },
          },
        },
      ],
    }),
    defineField({
      name: 'overlayStrength',
      type: 'string',
      title: 'Overlay strength',
      description: 'Controls the overlay opacity over each card image. Default: medium.',
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
      description: 'Override the overlay tint for the cards. Hex format (e.g. #0a0a0c) or a brand token like "var:bg". Leave blank to inherit from the brochure background.',
    }),
    ...imageMediaFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({
      title: `Linked Cards · ${title || 'Untitled'}`,
      subtitle,
    }),
  },
})
