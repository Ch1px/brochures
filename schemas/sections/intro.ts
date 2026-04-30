import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageTreatmentFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'intro',
  title: 'Introduction',
  type: 'object',
  fields: [
    defineField({
      name: 'letter',
      type: 'string',
      description: 'Large accent letter in the top-left, e.g. "A"',
      validation: (Rule) => Rule.max(2),
    }),
    defineField({
      name: 'letterImage',
      type: 'image',
      title: 'Letter image (optional)',
      description: 'If set, replaces the accent letter with an image (e.g. a logomark).',
      options: { hotspot: false },
    }),
    defineField({
      name: 'letterImageScale',
      type: 'number',
      title: 'Letter image scale',
      description: 'Multiplier on the default size. 1 = default, 0.5 = half, 2 = double.',
    }),
    defineField({ name: 'eyebrow', type: 'string', description: 'Small label above the title' }),
    defineField({
      name: 'title',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'body', type: 'text', rows: 6 }),
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Right-column image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'video',
      type: 'file',
      description: 'Optional looping video. If set, plays in place of the image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
    defineField({ name: 'caption', type: 'string', description: 'Caption beneath the image' }),
    defineField({
      name: 'contentAlign',
      title: 'Content alignment',
      type: 'string',
      description: 'Horizontal alignment of the text content (eyebrow, title, body, CTA).',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
      },
    }),
    ...imageTreatmentFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Introduction · ${(title || '').slice(0, 40)}`,
      subtitle,
      media,
    }),
  },
})
