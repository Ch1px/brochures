import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

export default defineType({
  name: 'spotlight',
  title: 'Spotlight',
  type: 'object',
  description: 'Image + content split with a full-bleed background image behind the section.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'text', rows: 2, validation: (Rule) => Rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 6 }),
    defineField({
      name: 'image',
      title: 'Foreground image',
      type: 'image',
      options: { hotspot: true },
      description: 'The smaller framed image on the left.',
    }),
    defineField({ name: 'caption', type: 'string' }),
    defineField({
      name: 'backgroundImage',
      title: 'Background image',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-bleed image behind the section. A dark overlay is applied so the text stays readable.',
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Spotlight · ${(title || '').slice(0, 40)}`,
      subtitle,
      media,
    }),
  },
})
