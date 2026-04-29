import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'textCenter',
  title: 'Text · Center',
  type: 'object',
  description: 'Simple centered body text with an optional eyebrow and title.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'text', rows: 2 }),
    defineField({ name: 'body', type: 'text', rows: 6, validation: (Rule) => Rule.required() }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({
      title: `Text · Center · ${(title || '').slice(0, 40)}`,
      subtitle,
    }),
  },
})
