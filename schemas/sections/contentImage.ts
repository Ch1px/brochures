import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'contentImage',
  title: 'Content · Image',
  type: 'object',
  description: 'Content on left, image on right. Like Introduction, without the accent letter.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'text', rows: 2, validation: (Rule) => Rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 6 }),
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'video',
      type: 'file',
      description: 'Optional looping video. If set, plays in place of the image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
    defineField({ name: 'caption', type: 'string' }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Content · Image · ${(title || '').slice(0, 40)}`,
      subtitle,
      media,
    }),
  },
})
