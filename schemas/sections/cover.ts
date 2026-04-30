import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

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
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target. Use "#next" for next page, "#enquire" for the lead modal, or a full URL. Defaults to "#enquire".' }),
    defineField({ name: 'ref', type: 'string', description: 'Bottom-right reference, e.g. "No. 001 / Volume XV"' }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Full-bleed background image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'video',
      type: 'file',
      description: 'Optional looping video. If set, plays in place of the background image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
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
      title: `Cover · ${title || 'Untitled'}`,
      subtitle: titleAccent,
      media,
    }),
  },
})
