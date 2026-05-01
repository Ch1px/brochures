import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'object',
  description: 'Frequently asked questions, 2-column grid (max 6).',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'subtitle', type: 'text', rows: 3 }),
    defineField({
      name: 'questions',
      type: 'array',
      validation: (Rule) => Rule.min(1).max(6),
      of: [
        defineField({
          name: 'item',
          type: 'object',
          fields: [
            defineField({ name: 'question', type: 'string', validation: (Rule) => Rule.required() }),
            defineField({ name: 'answer', type: 'text', rows: 4, validation: (Rule) => Rule.required() }),
          ],
          preview: {
            select: { title: 'question', subtitle: 'answer' },
          },
        }),
      ],
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', count: 'questions.length' },
    prepare: ({ title, subtitle, count }) => ({
      title: `FAQ · ${title || ''}`,
      subtitle: `${subtitle ? subtitle + ' · ' : ''}${count || 0} / 6`,
    }),
  },
})
