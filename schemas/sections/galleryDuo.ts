import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'galleryDuo',
  title: 'Gallery · Duo',
  type: 'object',
  description: 'Two large side-by-side images with optional caption overlays.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(2),
    }),
    defineField({
      name: 'captions',
      type: 'array',
      description: 'Optional caption per image (index matches images array)',
      of: [{ type: 'string' }],
      validation: (Rule) => Rule.max(2),
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'images.0' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Gallery · Duo · ${title || ''}`,
      subtitle,
      media,
    }),
  },
})
