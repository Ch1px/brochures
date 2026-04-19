import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

export default defineType({
  name: 'itinerary',
  title: 'Itinerary',
  type: 'object',
  description: 'Day-by-day schedule.',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (Rule) => Rule.required() }),
    defineField({
      name: 'days',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'itineraryDay',
          fields: [
            defineField({
              name: 'day',
              type: 'string',
              description: 'Day number, e.g. "01", "02"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'label',
              type: 'string',
              description: 'Weekday, e.g. "Thursday"',
            }),
            defineField({
              name: 'title',
              type: 'string',
              description: 'Day title, e.g. "Arrival & welcome"',
              validation: (Rule) => Rule.required(),
            }),
            defineField({ name: 'description', type: 'text', rows: 2 }),
          ],
          preview: {
            select: { day: 'day', label: 'label', title: 'title' },
            prepare: ({ day, label, title }) => ({
              title: `${day || ''} · ${title || ''}`,
              subtitle: label,
            }),
          },
        },
      ],
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', dayCount: 'days.length' },
    prepare: ({ title, dayCount }) => ({
      title: `Itinerary · ${title || ''}`,
      subtitle: `${dayCount || 0} day${dayCount === 1 ? '' : 's'}`,
    }),
  },
})
