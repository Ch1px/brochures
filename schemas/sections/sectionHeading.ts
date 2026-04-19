import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

export default defineType({
  name: 'sectionHeading',
  title: 'Section Heading',
  type: 'object',
  description: 'Chapter opener: script eyebrow + bold uppercase title, optional body and background image.',
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Script italic accent in red, e.g. "A weekend of"',
    }),
    defineField({
      name: 'title',
      type: 'string',
      description: 'Bold uppercase title, e.g. "Hospitality"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      type: 'text',
      rows: 3,
      description: 'Optional body text under the title',
    }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Optional background image',
      options: { hotspot: true },
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Section Heading · ${title || 'Untitled'}`,
      subtitle,
      media,
    }),
  },
})
