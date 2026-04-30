import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'closing',
  title: 'Closing',
  type: 'object',
  description:
    'Final CTA with contact details. The CTA opens the HubSpot enquiry modal (configured on the brochure document under "Lead capture").',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({
      name: 'title',
      type: 'text',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'subtitle', type: 'text', rows: 3 }),
    defineField({
      name: 'ctaText',
      type: 'string',
      description: 'CTA button label, e.g. "Enquire Now"',
      initialValue: 'Enquire Now',
    }),
    defineField({
      name: 'ctaHref',
      type: 'string',
      description:
        'CTA target. Use "#enquire" to open the lead-capture modal, or a full URL to link externally.',
      initialValue: '#enquire',
    }),
    defineField({
      name: 'email',
      type: 'string',
      description: 'Public contact email shown beneath the CTA',
      validation: (Rule) =>
        Rule.custom((val) => {
          if (!val) return true
          return /.+@.+\..+/.test(val) || 'Must be a valid email'
        }),
    }),
    defineField({
      name: 'phone',
      type: 'string',
      description: 'Public contact phone shown beneath the CTA',
    }),
    defineField({
      name: 'image',
      type: 'image',
      description: 'Optional full-bleed background image. The SVG decoration renders on top.',
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
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({
      title: `Closing · ${(title || '').slice(0, 40)}`,
      subtitle,
    }),
  },
})
