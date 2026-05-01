import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageTreatmentFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'galleryTrio',
  title: 'Gallery · Trio',
  type: 'object',
  description: '3 equal tiles in a single row.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(3),
    }),
    ...imageTreatmentFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'images.0', count: 'images.length' },
    prepare: ({ title, subtitle, media, count }) => ({
      title: `Gallery · Trio · ${title || ''}`,
      subtitle: `${subtitle ? subtitle + ' · ' : ''}${count || 0} / 3`,
      media,
    }),
  },
})
