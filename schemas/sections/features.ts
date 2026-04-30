import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageTreatmentFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'features',
  title: 'Three Features',
  type: 'object',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'titleAccent',
      type: 'string',
      description: 'Second part of title in red, e.g. "speed" in "A weekend of speed"',
    }),
    defineField({ name: 'subtitle', type: 'text', rows: 3 }),
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({
      name: 'cards',
      type: 'array',
      description: 'Exactly 3 feature cards',
      validation: (Rule) => Rule.max(3),
      of: [
        {
          type: 'object',
          name: 'featureCard',
          fields: [
            defineField({
              name: 'title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'text', type: 'text', rows: 3 }),
            defineField({ name: 'image', type: 'image', options: { hotspot: true } }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'text', media: 'image' },
          },
        },
      ],
    }),
    ...imageTreatmentFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', titleAccent: 'titleAccent' },
    prepare: ({ title, titleAccent }) => ({
      title: `Three Features · ${title || ''} ${titleAccent || ''}`.trim(),
    }),
  },
})
