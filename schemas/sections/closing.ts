import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

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
