import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'galleryEditorial',
  title: 'Gallery · Editorial',
  type: 'object',
  description: 'Asymmetric editorial grid. Slot 1 is large; slot 4 spans two columns.',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(4),
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', media: 'images.0', count: 'images.length' },
    prepare: ({ title, media, count }) => ({
      title: `Gallery · Editorial · ${title || ''}`,
      subtitle: `${count || 0} image${count === 1 ? '' : 's'}`,
      media,
    }),
  },
})
