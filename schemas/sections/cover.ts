import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

export default defineType({
  name: 'cover',
  title: 'Cover',
  type: 'object',
  fields: [
    defineField({ name: 'edition', type: 'string', description: 'Top-right badge, e.g. "2026 Edition"' }),
    defineField({ name: 'brandMark', type: 'string', description: 'Top-left tick mark, e.g. "GPGT · Hospitality"' }),
    defineField({ name: 'sup', type: 'string', description: 'Small line above title, e.g. "Formula 1"' }),
    defineField({
      name: 'title',
      type: 'string',
      description: 'Main title, e.g. "Monaco"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'titleAccent',
      type: 'string',
      description: 'Second line in Northwell script red, e.g. "Grand Prix"',
    }),
    defineField({
      name: 'tag',
      type: 'text',
      rows: 2,
      description: 'Supporting tagline beneath the title',
    }),
    defineField({ name: 'cta', type: 'string', description: 'CTA button label, e.g. "Take your seat"' }),
    defineField({ name: 'ref', type: 'string', description: 'Bottom-right reference, e.g. "No. 001 / Volume XV"' }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Full-bleed background image',
      options: { hotspot: true },
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', titleAccent: 'titleAccent', media: 'image' },
    prepare: ({ title, titleAccent, media }) => ({
      title: `Cover · ${title || 'Untitled'}`,
      subtitle: titleAccent,
      media,
    }),
  },
})
