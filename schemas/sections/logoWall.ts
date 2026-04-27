import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

/**
 * Shared logo item — used by both the Wall and Strip logo sections.
 * name doubles as the alt-text and the editor list label.
 * href is optional; when present the logo renders as an anchor that opens in a new tab.
 */
export const logoItem = {
  type: 'object',
  name: 'logoItem',
  fields: [
    {
      name: 'name',
      type: 'string',
      title: 'Name',
      description: 'Brand name. Used as alt text and as the label in the editor list.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'image',
      type: 'image',
      title: 'Logo',
      options: { hotspot: false },
    },
    {
      name: 'href',
      type: 'url',
      title: 'Link (optional)',
      description: 'If set, clicking the logo opens this URL in a new tab.',
    },
  ],
  preview: {
    select: { title: 'name', media: 'image' },
    prepare: ({ title, media }: any) => ({ title: title || 'Untitled logo', media }),
  },
}

export default defineType({
  name: 'logoWall',
  title: 'Logos · Wall',
  type: 'object',
  description: 'Grid of partner / sponsor logos with optional eyebrow, title and subtitle.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string' }),
    defineField({ name: 'subtitle', type: 'text', rows: 2 }),
    defineField({
      name: 'logos',
      type: 'array',
      of: [logoItem],
      validation: (Rule) => Rule.min(1).max(24),
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({
      title: `Logos · Wall · ${title || ''}`,
      subtitle,
    }),
  },
})
