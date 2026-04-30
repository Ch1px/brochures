import { defineType, defineField } from 'sanity'

/**
 * Company — a child company of the parent group whose brochures live on a
 * dedicated subdomain (e.g. `brochures.grandstandtickets.com`). Acts as a
 * tenant: brochures referencing a company show only on that company's host
 * and inherit its branding for the holding page when no featured brochure
 * is set.
 *
 * Brochures with no company reference belong to the canonical host
 * (brochures.grandprixgrandtours.com). Existing brochures stay canonical
 * unless explicitly assigned a company.
 */
export default defineType({
  name: 'company',
  title: 'Company',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
      description: 'Internal name, e.g. "Grandstand Tickets".',
      validation: (Rule) => Rule.required().max(120),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'Used internally for references. Not part of any URL.',
      options: {
        source: 'name',
        maxLength: 80,
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 80),
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'domain',
      type: 'string',
      description:
        'The host this company\'s brochures render on, without protocol or path. Example: brochures.grandstandtickets.com',
      validation: (Rule) =>
        Rule.required()
          .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, { name: 'hostname' })
          .custom((value) => {
            if (!value) return 'Required'
            if (value !== value.toLowerCase()) return 'Use lowercase'
            return true
          }),
    }),
    defineField({
      name: 'displayName',
      type: 'string',
      description: 'Public display name shown on the holding page when no featured brochure is set.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'website',
      type: 'url',
      description: 'Public-facing site linked from the holding page.',
    }),
    defineField({
      name: 'logo',
      type: 'image',
      description:
        'Used in the brochure nav for brochures belonging to this company, and on the holding page.',
      options: { hotspot: true },
    }),
    defineField({
      name: 'favicon',
      type: 'image',
      title: 'Favicon',
      description:
        'Browser tab icon for this company\'s brochures and holding page. Upload a square PNG (128×128 or larger) — non-square images will appear stretched.',
      options: { hotspot: false },
    }),
    defineField({
      name: 'accentColor',
      type: 'string',
      title: 'Accent colour',
      description:
        'Hex colour used as the default brand red for brochures of this company. Individual brochures can still override.',
      validation: (Rule) =>
        Rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }).custom((value) =>
          value === undefined || value === '' || /^#[0-9a-fA-F]{6}$/.test(value)
            ? true
            : 'Must be a 6-digit hex colour like #cf212a'
        ),
    }),
    defineField({
      name: 'featuredBrochure',
      type: 'reference',
      description:
        'Brochure to redirect to from the company\'s root URL. If unset, the root shows a holding page.',
      to: [{ type: 'brochure' }],
      options: {
        filter: '!defined(company) || company._ref == ^._id',
      },
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'domain', media: 'logo' },
  },
})
