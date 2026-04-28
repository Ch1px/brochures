import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

export default defineType({
  name: 'sectionHeadingCentered',
  title: 'Section Heading · Centered',
  type: 'object',
  description: 'Section heading with all text centered.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({ name: 'text', type: 'text', rows: 3 }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'overlayStrength',
      type: 'string',
      title: 'Overlay strength',
      description: 'Controls the dark overlay over the background image. Default: medium.',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Light', value: 'light' },
          { title: 'Medium (default)', value: 'medium' },
          { title: 'Strong', value: 'strong' },
        ],
      },
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Section Heading · Centered · ${title || 'Untitled'}`,
      subtitle,
      media,
    }),
  },
})
