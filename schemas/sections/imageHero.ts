import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageTreatmentFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'imageHero',
  title: 'Image Hero',
  type: 'object',
  description: 'Full-bleed image with overlay eyebrow, title, and text.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({
      name: 'title',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'text', type: 'text', rows: 4 }),
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Full-bleed background image',
      options: { hotspot: true },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'video',
      type: 'file',
      description: 'Optional looping video. If set, plays in place of the image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
    ...imageTreatmentFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Image Hero · ${(title || '').slice(0, 40)}`,
      subtitle,
      media,
    }),
  },
})
