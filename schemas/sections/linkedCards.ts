import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

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
