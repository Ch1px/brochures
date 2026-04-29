import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

export default defineType({
  name: 'ctaBanner',
  title: 'CTA Banner',
  type: 'object',
  description: 'Centered call-to-action banner with eyebrow, title, body text, and a prominent button.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'text', rows: 2 }),
    defineField({ name: 'body', type: 'text', rows: 4 }),
    defineField({ name: 'ctaText', type: 'string', description: 'CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'ctaText' },
    prepare: ({ title, subtitle }) => ({
      title: `CTA Banner · ${(title || '').slice(0, 40)}`,
      subtitle,
    }),
  },
})
