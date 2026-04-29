import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'galleryGrid',
  title: 'Gallery · Grid',
  type: 'object',
  description: '6 equal tiles, 3 columns × 2 rows.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(6),
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'images.0', count: 'images.length' },
    prepare: ({ title, subtitle, media, count }) => ({
      title: `Gallery · Grid · ${title || ''}`,
      subtitle: `${subtitle ? subtitle + ' · ' : ''}${count || 0} / 6`,
      media,
    }),
  },
})
