import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

const SOCIAL_PLATFORMS = [
  { title: 'Instagram', value: 'instagram' },
  { title: 'X (Twitter)', value: 'x' },
  { title: 'Facebook', value: 'facebook' },
  { title: 'LinkedIn', value: 'linkedin' },
  { title: 'YouTube', value: 'youtube' },
  { title: 'TikTok', value: 'tiktok' },
] as const

export default defineType({
  name: 'footer',
  title: 'Footer',
  type: 'object',
  description:
    'Slim overlay strip pinned to the bottom of the page slide. Add only on pages that should display it. Replaces the page folio.',
  fields: [
    defineField({
      name: 'legal',
      type: 'text',
      rows: 2,
      description: 'Copyright / legal line, e.g. "© 2026 Grand Prix Grand Tours · Registered in England No. 12345678"',
    }),
    defineField({
      name: 'email',
      type: 'string',
      description: 'Public contact email',
      validation: (Rule) =>
        Rule.custom((val) => {
          if (!val) return true
          return /.+@.+\..+/.test(val) || 'Must be a valid email'
        }),
    }),
    defineField({
      name: 'phone',
      type: 'string',
      description: 'Public contact phone',
    }),
    defineField({
      name: 'socials',
      type: 'array',
      description: 'Social links rendered as icons.',
      of: [
        {
          type: 'object',
          name: 'social',
          fields: [
            defineField({
              name: 'platform',
              type: 'string',
              options: { list: [...SOCIAL_PLATFORMS] },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'href',
              type: 'url',
              validation: (Rule) =>
                Rule.uri({ scheme: ['http', 'https'] }).required(),
            }),
          ],
          preview: {
            select: { title: 'platform', subtitle: 'href' },
          },
        },
      ],
    }),
    backgroundField,
  ],
  preview: {
    select: { email: 'email', phone: 'phone' },
    prepare: ({ email, phone }) => ({
      title: 'Footer',
      subtitle: [email, phone].filter(Boolean).join(' · ') || 'Empty',
    }),
  },
})
