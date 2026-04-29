import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'quoteProfile',
  title: 'Quote + Profile',
  type: 'object',
  description: 'Featured quote with circular profile photo. Name uses Northwell script accent.',
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Small label above the name, e.g. "A word from"',
    }),
    defineField({
      name: 'name',
      type: 'string',
      description: 'Person name, rendered in Northwell script',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'photo',
      type: 'image',
      description: 'Circular profile photo with red ring',
      options: { hotspot: true },
    }),
    defineField({
      name: 'quote',
      type: 'text',
      rows: 4,
      description: 'The featured quote (red-bar accented italic)',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'text',
      rows: 4,
      description: 'Supporting body text beneath the quote',
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'name', subtitle: 'eyebrow', media: 'photo' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Quote · ${title || 'Untitled'}`,
      subtitle,
      media,
    }),
  },
})
