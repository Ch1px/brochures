import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

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
    defineField({ name: 'eyebrow', type: 'string', description: 'Small label above the title' }),
    defineField({
      name: 'title',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'body', type: 'text', rows: 6 }),
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
