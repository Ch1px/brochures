import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { logoItem } from './logoWall'

export default defineType({
  name: 'logoStrip',
  title: 'Logos · Strip',
  type: 'object',
  description: 'Single row of partner / sponsor logos with optional eyebrow, title and subtitle.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'subtitle', type: 'text', rows: 2 }),
    defineField({
      name: 'logos',
      type: 'array',
      of: [logoItem],
      validation: (Rule) => Rule.min(1).max(12),
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({
      title: `Logos · Strip · ${title || ''}`,
      subtitle,
    }),
  },
})
