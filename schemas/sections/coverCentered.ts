import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'coverCentered',
  title: 'Cover · Centered',
  type: 'object',
  fields: [
    defineField({ name: 'edition', type: 'string' }),
    defineField({ name: 'brandMark', type: 'string' }),
    defineField({ name: 'sup', type: 'string' }),
    defineField({
      name: 'supImage',
      type: 'image',
      title: 'Supertitle image (optional)',
      options: { hotspot: false },
    }),
    defineField({ name: 'supImageScale', type: 'number', title: 'Supertitle image scale' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'titleImage',
      type: 'image',
      title: 'Title image (optional)',
      options: { hotspot: false },
    }),
    defineField({ name: 'titleImageScale', type: 'number', title: 'Title image scale' }),
    defineField({ name: 'titleAccent', type: 'string' }),
    defineField({
      name: 'titleAccentImage',
      type: 'image',
      title: 'Title accent image (optional)',
      options: { hotspot: false },
    }),
    defineField({ name: 'titleAccentImageScale', type: 'number', title: 'Title accent image scale' }),
    defineField({ name: 'tag', type: 'text', rows: 2 }),
    defineField({ name: 'cta', type: 'string' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target. Use "#next" for next page, "#enquire" for the lead modal, or a full URL. Defaults to "#enquire".' }),
    defineField({ name: 'ref', type: 'string' }),
    defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
    defineField({
      name: 'overlayStrength',
      type: 'string',
      title: 'Overlay strength',
      description: 'Controls the dark overlay opacity over the background image. Default: medium.',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Light', value: 'light' },
          { title: 'Medium (default)', value: 'medium' },
          { title: 'Strong', value: 'strong' },
        ],
      },
    }),
    defineField({
      name: 'overlayColor',
      title: 'Overlay colour',
      type: 'string',
      description: 'Override the overlay tint for this section. Hex format (e.g. #0a0a0c) or a brand token like "var:bg". Leave blank to inherit from the brochure background.',
    }),
    ...imageMediaFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', titleAccent: 'titleAccent', media: 'image' },
    prepare: ({ title, titleAccent, media }) => ({
      title: `Cover · Centered · ${title || 'Untitled'}`,
      subtitle: titleAccent,
      media,
    }),
  },
})
