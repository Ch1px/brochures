import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageTreatmentFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'galleryHero',
  title: 'Gallery · Hero',
  type: 'object',
  description: 'One large lead image with a caption, plus three thumbnails below.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'caption',
      type: 'text',
      rows: 2,
      description: 'Caption overlaid on the lead image',
    }),
    defineField({
      name: 'images',
      type: 'array',
      description: 'Index 0 is the lead image; indexes 1–3 are the thumbnails',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (Rule) => Rule.max(4),
    }),
    ...imageTreatmentFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'images.0' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Gallery · Hero · ${title || ''}`,
      subtitle,
      media,
    }),
  },
})
