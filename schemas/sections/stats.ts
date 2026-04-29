import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'

/**
 * Shared stat item — used by both Stats section and Circuit Map section.
 * value: the number, e.g. "3.337"
 * unit: optional unit, e.g. "KM", "KM/H"
 * label: the description, e.g. "Circuit Length"
 */
export const statItem = {
  type: 'object',
  name: 'statItem',
  fields: [
    { name: 'value', type: 'string', title: 'Value', validation: (Rule: any) => Rule.required() },
    { name: 'unit', type: 'string', title: 'Unit (optional)' },
    { name: 'label', type: 'string', title: 'Label', validation: (Rule: any) => Rule.required() },
  ],
  preview: {
    select: { value: 'value', unit: 'unit', label: 'label' },
    prepare: ({ value, unit, label }: any) => ({
      title: `${value}${unit ? ' ' + unit : ''}`,
      subtitle: label,
    }),
  },
}

export default defineType({
  name: 'stats',
  title: 'Numbers',
  type: 'object',
  description: 'Grid of key statistics.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'stats',
      type: 'array',
      of: [statItem],
      description: '4 stats render as a row; 3 or fewer center-align',
      validation: (Rule) => Rule.min(1).max(6),
    }),
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow' },
    prepare: ({ title, subtitle }) => ({ title: `Numbers · ${title || ''}`, subtitle }),
  },
})
