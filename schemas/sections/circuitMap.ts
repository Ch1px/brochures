import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'

/**
 * Circuit Map section. The SVG is uploaded via the builder, which remaps
 * the source palette to the brochure theme (brand red + white/muted grays)
 * and stores the themed SVG XML as a string on this field.
 *
 * Colour remap reference (applied client-side on upload):
 *   #EF4444 → #e10600  (brand red)
 *   #96A3B5 → rgba(255,255,255,0.7)
 *   #64748B → rgba(255,255,255,0.35)
 *   #FDE68A → #ffffff
 *   #0F1115 → #ffffff
 *   #3C8C67 → rgba(255,255,255,0.06)
 *   #F59E0B → #ffb340
 */
export default defineType({
  name: 'circuitMap',
  title: 'Circuit Map',
  type: 'object',
  description: 'SVG circuit diagram with eyebrow, title, caption, and up to 3 stats below.',
  fields: [
    defineField({
      name: 'eyebrow',
      type: 'string',
      description: 'Small label, e.g. "The circuit"',
    }),
    defineField({
      name: 'title',
      type: 'string',
      description: 'Circuit name, e.g. "Circuit de Monaco"',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'caption',
      type: 'text',
      rows: 2,
      description: 'Short descriptive caption beneath the title',
    }),
    defineField({
      name: 'svg',
      type: 'text',
      rows: 4,
      description:
        'Themed SVG XML. Uploaded via the builder, which remaps source colours to the brochure palette.',
    }),
    defineField({
      name: 'svgOriginal',
      type: 'text',
      rows: 4,
      description:
        'Untouched original SVG. Re-themed at render time so the circuit picks up the brochure accent colour.',
    }),
    defineField({
      name: 'colorOverrides',
      type: 'array',
      description:
        'Per-element colour overrides applied on top of the themed SVG at render time. elementId is a stable index id assigned in document order (e.g. "el-3").',
      of: [
        {
          type: 'object',
          name: 'colorOverride',
          fields: [
            { name: 'elementId', type: 'string', title: 'Element id', validation: (Rule: any) => Rule.required() },
            { name: 'color', type: 'string', title: 'Colour (hex)', validation: (Rule: any) => Rule.required() },
          ],
          preview: {
            select: { elementId: 'elementId', color: 'color' },
            prepare: ({ elementId, color }: any) => ({
              title: elementId,
              subtitle: color,
            }),
          },
        },
      ],
    }),
    defineField({
      name: 'stats',
      type: 'array',
      description: 'Up to 3 stats displayed in a strip below the map',
      validation: (Rule) => Rule.max(3),
      of: [
        {
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
        },
      ],
    }),
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'caption', svg: 'svg' },
    prepare: ({ title, subtitle, svg }) => ({
      title: `Circuit Map · ${title || ''}`,
      subtitle: `${svg ? '✓ SVG loaded' : '○ No SVG'}${subtitle ? ' · ' + subtitle.slice(0, 60) : ''}`,
    }),
  },
})
