import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'packages',
  title: 'Packages',
  type: 'object',
  description: 'Tiered hospitality cards, each with features list.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string', description: 'Script-italic accent above the title.' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'packages',
      type: 'array',
      validation: (Rule) => Rule.min(1).max(4),
      of: [
        {
          type: 'object',
          name: 'packageTier',
          fields: [
            defineField({
              name: 'image',
              type: 'image',
              options: { hotspot: true },
              description: 'Header image displayed at the top of the package card.',
            }),
            defineField({
              name: 'tier',
              type: 'string',
              description: 'Small label above name, e.g. "Essential", "Popular", "Exclusive"',
            }),
            defineField({
              name: 'name',
              type: 'string',
              description: 'Package name, e.g. "Grandstand", "Paddock Club"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'currency',
              type: 'string',
              description: 'Currency symbol, e.g. "£"',
              initialValue: '£',
            }),
            defineField({
              name: 'price',
              type: 'string',
              description: 'Display price as string (allows formatting like "14,500")',
            }),
            defineField({
              name: 'from',
              type: 'string',
              description: 'Text beneath price, e.g. "From · per person"',
            }),
            defineField({
              name: 'featured',
              type: 'boolean',
              description: 'Highlight this package with a red border + shadow',
              initialValue: false,
            }),
            defineField({
              name: 'features',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Bullet-point features. 4–6 is the sweet spot.',
            }),
          ],
          preview: {
            select: { title: 'name', tier: 'tier', price: 'price', currency: 'currency' },
            prepare: ({ title, tier, price, currency }) => ({
              title: `${title || 'Package'}`,
              subtitle: `${tier || ''}${price ? ` · ${currency}${price}` : ''}`,
            }),
          },
        },
      ],
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', packageCount: 'packages.length' },
    prepare: ({ title, packageCount }) => ({
      title: `Packages · ${title || ''}`,
      subtitle: `${packageCount || 0} tier${packageCount === 1 ? '' : 's'}`,
    }),
  },
})
