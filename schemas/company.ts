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
 *
 * Branding & typography fields here act as defaults for every brochure
 * assigned to this company. Per-brochure values still override individually
 * via the live-fallback resolvers in `src/lib/brochureBranding.ts`.
 */
export default defineType({
  name: 'company',
  title: 'Company',
  type: 'document',
  groups: [
    { name: 'general', title: 'General', default: true },
    { name: 'branding', title: 'Branding' },
    { name: 'typography', title: 'Typography' },
  ],
  fields: [
    // === GENERAL ===
    defineField({
      name: 'name',
      type: 'string',
      description: 'Internal name, e.g. "Grandstand Tickets".',
      validation: (Rule) => Rule.required().max(120),
      group: 'general',
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
      group: 'general',
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
      group: 'general',
    }),
    defineField({
      name: 'displayName',
      type: 'string',
      description: 'Public display name shown on the holding page when no featured brochure is set.',
      validation: (Rule) => Rule.required(),
      group: 'general',
    }),
    defineField({
      name: 'website',
      type: 'url',
      description: 'Public-facing site linked from the holding page.',
      group: 'general',
    }),
    defineField({
      name: 'favicon',
      type: 'image',
      title: 'Favicon',
      description:
        'Browser tab icon for this company\'s brochures and holding page. Upload a square PNG (128×128 or larger) — non-square images will appear stretched.',
      options: { hotspot: false },
      group: 'general',
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
      group: 'general',
    }),

    // === BRANDING ===
    defineField({
      name: 'theme',
      type: 'string',
      description: 'Default theme for this company\'s brochures.',
      options: {
        list: [
          { title: 'Dark', value: 'dark' },
          { title: 'Light', value: 'light' },
        ],
        layout: 'radio',
      },
      group: 'branding',
    }),
    defineField({
      name: 'accentColor',
      type: 'string',
      title: 'Accent colour',
      description:
        'Hex colour used as the default accent for brochures of this company. Individual brochures can still override.',
      validation: (Rule) =>
        Rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }).custom((value) =>
          value === undefined || value === '' || /^#[0-9a-fA-F]{6}$/.test(value)
            ? true
            : 'Must be a 6-digit hex colour like #cf212a'
        ),
      group: 'branding',
    }),
    defineField({
      name: 'backgroundColor',
      type: 'string',
      title: 'Background colour',
      description: 'Default page background for this company\'s brochures.',
      validation: (Rule) =>
        Rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }).custom((value) =>
          value === undefined || value === '' || /^#[0-9a-fA-F]{6}$/.test(value)
            ? true
            : 'Must be a 6-digit hex colour like #161618'
        ),
      group: 'branding',
    }),
    defineField({
      name: 'textColor',
      type: 'string',
      title: 'Text colour',
      description: 'Default text colour for this company\'s brochures.',
      validation: (Rule) =>
        Rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }).custom((value) =>
          value === undefined || value === '' || /^#[0-9a-fA-F]{6}$/.test(value)
            ? true
            : 'Must be a 6-digit hex colour like #ffffff'
        ),
      group: 'branding',
    }),
    defineField({
      name: 'titleColor',
      type: 'string',
      title: 'Title colour',
      description: 'Independent default colour for section headings.',
      group: 'branding',
    }),
    defineField({
      name: 'bodyColor',
      type: 'string',
      title: 'Body text colour',
      description: 'Independent default colour for paragraphs and captions.',
      group: 'branding',
    }),
    defineField({
      name: 'navColor',
      type: 'string',
      title: 'Navigation background',
      description: 'Default navigation bar background. Hex format (e.g. #161618).',
      validation: (Rule) =>
        Rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }).custom((value) =>
          value === undefined || value === '' || /^#[0-9a-fA-F]{6}$/.test(value)
            ? true
            : 'Must be a 6-digit hex colour like #161618'
        ),
      group: 'branding',
    }),
    defineField({
      name: 'logo',
      type: 'image',
      description:
        'Used in the brochure nav for brochures belonging to this company, and on the holding page.',
      options: { hotspot: true },
      group: 'branding',
    }),
    defineField({
      name: 'textureImage',
      type: 'image',
      title: 'Background texture',
      description: 'Default halftone-style texture for this company\'s brochures.',
      options: { hotspot: false },
      group: 'branding',
    }),
    defineField({
      name: 'hideTexture',
      type: 'boolean',
      title: 'Hide background texture',
      description: 'When true, brochures of this company default to no texture.',
      group: 'branding',
    }),

    // === TYPOGRAPHY ===
    defineField({
      name: 'eyebrowItalic',
      type: 'boolean',
      title: 'Italic eyebrows',
      description: 'When false, eyebrow text renders upright by default.',
      group: 'typography',
    }),
    defineField({
      name: 'eyebrowTransform',
      type: 'string',
      title: 'Eyebrow text transform',
      description: 'Default casing of eyebrow text.',
      options: {
        list: [
          { title: 'None (as typed)', value: 'none' },
          { title: 'Uppercase', value: 'uppercase' },
          { title: 'Lowercase', value: 'lowercase' },
          { title: 'Capitalize', value: 'capitalize' },
        ],
      },
      group: 'typography',
    }),
    defineField({
      name: 'titleItalic',
      type: 'boolean',
      title: 'Italic titles',
      description: 'When true, section titles default to italic.',
      group: 'typography',
    }),
    defineField({
      name: 'titleTransform',
      type: 'string',
      title: 'Title text transform',
      description: 'Default casing of section titles.',
      options: {
        list: [
          { title: 'None (as typed)', value: 'none' },
          { title: 'Uppercase', value: 'uppercase' },
          { title: 'Lowercase', value: 'lowercase' },
          { title: 'Capitalize', value: 'capitalize' },
        ],
      },
      group: 'typography',
    }),
    defineField({
      name: 'fontOverrides',
      type: 'object',
      title: 'Font overrides',
      description: 'Default fonts for this company\'s brochures.',
      group: 'typography',
      fields: [
        defineField({ name: 'display', type: 'string', title: 'Title font' }),
        defineField({ name: 'displayWeight', type: 'string', title: 'Title font weight' }),
        defineField({ name: 'script', type: 'string', title: 'Eyebrow font' }),
        defineField({ name: 'scriptWeight', type: 'string', title: 'Eyebrow font weight' }),
        defineField({ name: 'body', type: 'string', title: 'Body font' }),
        defineField({ name: 'bodyWeight', type: 'string', title: 'Body font weight' }),
        defineField({ name: 'mono', type: 'string', title: 'Label font' }),
        defineField({ name: 'monoWeight', type: 'string', title: 'Label font weight' }),
      ],
    }),
    defineField({
      name: 'titleScale',
      type: 'string',
      title: 'Title text size',
      description: 'Default scale for headline/title text. Default: M.',
      options: {
        list: [
          { title: 'XXS — Tiny', value: 'xxs' },
          { title: 'XS — Compact', value: 'xs' },
          { title: 'S — Small', value: 's' },
          { title: 'M — Default', value: 'm' },
          { title: 'L — Large', value: 'l' },
          { title: 'XL — Extra Large', value: 'xl' },
        ],
      },
      group: 'typography',
    }),
    defineField({
      name: 'eyebrowScale',
      type: 'string',
      title: 'Eyebrow text size',
      description: 'Default scale for eyebrow text. Default: M.',
      options: {
        list: [
          { title: 'XXS — Tiny', value: 'xxs' },
          { title: 'XS — Compact', value: 'xs' },
          { title: 'S — Small', value: 's' },
          { title: 'M — Default', value: 'm' },
          { title: 'L — Large', value: 'l' },
          { title: 'XL — Extra Large', value: 'xl' },
        ],
      },
      group: 'typography',
    }),
    defineField({
      name: 'taglineScale',
      type: 'string',
      title: 'Tagline / subtitle text size',
      description: 'Default scale for taglines, subtitles, and body text. Default: M.',
      options: {
        list: [
          { title: 'XXS — Tiny', value: 'xxs' },
          { title: 'XS — Compact', value: 'xs' },
          { title: 'S — Small', value: 's' },
          { title: 'M — Default', value: 'm' },
          { title: 'L — Large', value: 'l' },
          { title: 'XL — Extra Large', value: 'xl' },
        ],
      },
      group: 'typography',
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'domain', media: 'logo' },
  },
})
