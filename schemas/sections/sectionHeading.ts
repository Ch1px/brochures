import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

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
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({
      name: 'contentAlign',
      title: 'Content alignment',
      type: 'string',
      description: 'Horizontal alignment of the eyebrow, title, body, and CTA. Defaults to centered.',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Center (default)', value: 'center' },
          { title: 'Right', value: 'right' },
        ],
      },
    }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Optional background image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'video',
      type: 'file',
      description: 'Optional looping background video. If set, plays in place of the image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
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
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Section Heading · ${title || 'Untitled'}`,
      subtitle,
      media,
    }),
  },
})
