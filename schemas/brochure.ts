import { defineType, defineField } from 'sanity'

/**
 * Top-level brochure document.
 * Each brochure is per-event, per-season (e.g. Monaco 2026).
 * Published brochures render at /[slug] on brochures.grandprixgrandtours.com.
 */
export default defineType({
  name: 'brochure',
  title: 'Brochure',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Metadata' },
    { name: 'branding', title: 'Branding' },
    { name: 'seo', title: 'SEO & sharing' },
    { name: 'lead', title: 'Lead capture' },
  ],
  fields: [
    // === CONTENT GROUP ===
    defineField({
      name: 'title',
      type: 'string',
      description: 'Internal title (also used for SEO fallback). e.g. "Monaco Grand Prix 2026"',
      validation: (Rule) => Rule.required().max(120),
      group: 'content',
    }),
    defineField({
      name: 'pages',
      type: 'array',
      description: 'Ordered list of pages. Each page contains one or more sections.',
      of: [{ type: 'page' }],
      group: 'content',
    }),

    // === METADATA GROUP ===
    defineField({
      name: 'slug',
      type: 'slug',
      description: 'URL path on brochures.grandprixgrandtours.com',
      options: {
        source: 'title',
        maxLength: 80,
        slugify: (input) =>
          input
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 80),
      },
      validation: (Rule) => Rule.required(),
      group: 'meta',
    }),
    defineField({
      name: 'season',
      type: 'string',
      description: 'Calendar year. Used for filtering in the admin library.',
      options: {
        list: [
          { title: '2026', value: '2026' },
          { title: '2027', value: '2027' },
          { title: '2028', value: '2028' },
        ],
      },
      validation: (Rule) => Rule.required(),
      group: 'meta',
    }),
    defineField({
      name: 'event',
      type: 'string',
      description: 'Event name, e.g. "Monaco", "Silverstone". Used for filtering.',
      group: 'meta',
    }),
    defineField({
      name: 'theme',
      type: 'string',
      description: 'Visual theme applied across every page of this brochure.',
      options: {
        list: [
          { title: 'Dark', value: 'dark' },
          { title: 'Light', value: 'light' },
        ],
        layout: 'radio',
      },
      initialValue: 'dark',
      group: 'meta',
    }),
    defineField({
      name: 'status',
      type: 'string',
      description: 'Publishing state. Only `published` brochures are visible at /[slug].',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Unpublished', value: 'unpublished' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      validation: (Rule) => Rule.required(),
      group: 'meta',
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      description: 'Set automatically when status transitions to published.',
      group: 'meta',
    }),
    defineField({
      name: 'featured',
      type: 'boolean',
      description:
        'If true, the brochure\'s host root redirects to it. Only one brochure should be featured per host at a time.',
      initialValue: false,
      group: 'meta',
    }),
    defineField({
      name: 'company',
      type: 'reference',
      description:
        'Hosts this brochure on the referenced company\'s subdomain instead of the canonical brochures.grandprixgrandtours.com. Leave blank for canonical.',
      to: [{ type: 'company' }],
      group: 'meta',
    }),

    // === BRANDING GROUP ===
    defineField({
      name: 'accentColor',
      type: 'string',
      title: 'Accent colour',
      description:
        'Overrides the platform brand red for this brochure. Hex format (e.g. #1a8cd8). Leave blank for the default (#cf212a).',
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
      description:
        'Overrides the page background for this brochure. Hex format (e.g. #1a1a2e). Leave blank for the theme default.',
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
      description:
        'Overrides the page text colour for this brochure. Derives muted, subtle, and border variants. Leave blank for the theme default.',
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
      description: 'Independent colour for section headings. Falls back to text colour.',
      group: 'branding',
    }),
    defineField({
      name: 'bodyColor',
      type: 'string',
      title: 'Body text colour',
      description: 'Independent colour for paragraphs, subtitles, and captions. Falls back to text colour.',
      group: 'branding',
    }),
    defineField({
      name: 'eyebrowItalic',
      type: 'boolean',
      title: 'Italic eyebrows',
      description: 'When false, eyebrow text renders upright instead of italic.',
      group: 'branding',
    }),
    defineField({
      name: 'eyebrowTransform',
      type: 'string',
      title: 'Eyebrow text transform',
      description: 'Controls casing of eyebrow text.',
      options: {
        list: [
          { title: 'None (as typed)', value: 'none' },
          { title: 'Uppercase', value: 'uppercase' },
          { title: 'Lowercase', value: 'lowercase' },
          { title: 'Capitalize', value: 'capitalize' },
        ],
      },
      group: 'branding',
    }),
    defineField({
      name: 'titleItalic',
      type: 'boolean',
      title: 'Italic titles',
      description: 'When true, section titles render italic.',
      group: 'branding',
    }),
    defineField({
      name: 'titleTransform',
      type: 'string',
      title: 'Title text transform',
      description: 'Controls casing of section titles. Default: Uppercase.',
      options: {
        list: [
          { title: 'None (as typed)', value: 'none' },
          { title: 'Uppercase', value: 'uppercase' },
          { title: 'Lowercase', value: 'lowercase' },
          { title: 'Capitalize', value: 'capitalize' },
        ],
      },
      group: 'branding',
    }),
    defineField({
      name: 'fontOverrides',
      type: 'object',
      title: 'Font overrides',
      description: 'Override the default fonts for this brochure. Leave blank to use the platform defaults.',
      group: 'branding',
      fields: [
        defineField({
          name: 'display',
          type: 'string',
          title: 'Title font',
          description: 'Headlines and display text. Default: Formula1.',
        }),
        defineField({
          name: 'displayWeight',
          type: 'string',
          title: 'Title font weight',
          description: 'Default: 900 (Black).',
        }),
        defineField({
          name: 'script',
          type: 'string',
          title: 'Eyebrow font',
          description: 'Eyebrow and accent text. Default: Northwell.',
        }),
        defineField({
          name: 'scriptWeight',
          type: 'string',
          title: 'Eyebrow font weight',
          description: 'Default: 400 (Regular).',
        }),
        defineField({
          name: 'body',
          type: 'string',
          title: 'Body font',
          description: 'Paragraph and body text. Default: Titillium Web.',
        }),
        defineField({
          name: 'bodyWeight',
          type: 'string',
          title: 'Body font weight',
          description: 'Default: 400 (Regular).',
        }),
        defineField({
          name: 'mono',
          type: 'string',
          title: 'Label font',
          description: 'Labels, meta text, and data. Default: JetBrains Mono.',
        }),
        defineField({
          name: 'monoWeight',
          type: 'string',
          title: 'Label font weight',
          description: 'Default: 400 (Regular).',
        }),
      ],
    }),
    defineField({
      name: 'customFonts',
      type: 'array',
      title: 'Custom fonts',
      description: 'Uploaded fonts available in all font dropdowns. Each font can have multiple weight files.',
      group: 'branding',
      of: [{
        type: 'object',
        name: 'customFont',
        fields: [
          defineField({ name: 'name', type: 'string', title: 'Font name', validation: (Rule: any) => Rule.required() }),
          defineField({
            name: 'weights',
            type: 'array',
            title: 'Font weights',
            of: [{
              type: 'object',
              name: 'fontWeight',
              fields: [
                defineField({
                  name: 'weight',
                  type: 'string',
                  title: 'Weight',
                  validation: (Rule: any) => Rule.required(),
                  options: {
                    list: [
                      { title: '100 · Thin', value: '100' },
                      { title: '200 · Extra Light', value: '200' },
                      { title: '300 · Light', value: '300' },
                      { title: '400 · Regular', value: '400' },
                      { title: '500 · Medium', value: '500' },
                      { title: '600 · Semi Bold', value: '600' },
                      { title: '700 · Bold', value: '700' },
                      { title: '800 · Extra Bold', value: '800' },
                      { title: '900 · Black', value: '900' },
                    ],
                  },
                }),
                defineField({ name: 'dataUri', type: 'text', title: 'Font data (base64)', hidden: true }),
              ],
              preview: {
                select: { weight: 'weight' },
                prepare: ({ weight }: { weight?: string }) => ({ title: weight ?? 'Unknown weight' }),
              },
            }],
          }),
        ],
        preview: {
          select: { name: 'name', weights: 'weights' },
          prepare: ({ name, weights }: any) => ({
            title: name || 'Untitled font',
            subtitle: `${weights?.length ?? 0} weight(s)`,
          }),
        },
      }],
    }),
    defineField({
      name: 'titleScale',
      type: 'string',
      title: 'Title text size',
      description:
        'Scale multiplier for all headline/title text across the brochure. Default: M.',
      options: {
        list: [
          { title: 'XS — Compact', value: 'xs' },
          { title: 'S — Small', value: 's' },
          { title: 'M — Default', value: 'm' },
          { title: 'L — Large', value: 'l' },
          { title: 'XL — Extra Large', value: 'xl' },
        ],
      },
      group: 'branding',
    }),
    defineField({
      name: 'eyebrowScale',
      type: 'string',
      title: 'Eyebrow text size',
      description:
        'Scale multiplier for all eyebrow/script text across the brochure. Default: M.',
      options: {
        list: [
          { title: 'XS — Compact', value: 'xs' },
          { title: 'S — Small', value: 's' },
          { title: 'M — Default', value: 'm' },
          { title: 'L — Large', value: 'l' },
          { title: 'XL — Extra Large', value: 'xl' },
        ],
      },
      group: 'branding',
    }),
    defineField({
      name: 'taglineScale',
      type: 'string',
      title: 'Tagline / subtitle text size',
      description:
        'Scale multiplier for taglines, subtitles, and body text across the brochure. Default: M.',
      options: {
        list: [
          { title: 'XS — Compact', value: 'xs' },
          { title: 'S — Small', value: 's' },
          { title: 'M — Default', value: 'm' },
          { title: 'L — Large', value: 'l' },
          { title: 'XL — Extra Large', value: 'xl' },
        ],
      },
      group: 'branding',
    }),
    defineField({
      name: 'navColor',
      type: 'string',
      title: 'Navigation background',
      description:
        'Override the navigation bar background. Must be a dark colour. Hex format (e.g. #1a1a2e). Default: #161618.',
      validation: (Rule) =>
        Rule.regex(/^#[0-9a-fA-F]{6}$/, { name: 'hex colour' }).custom((value) =>
          value === undefined || value === '' || /^#[0-9a-fA-F]{6}$/.test(value)
            ? true
            : 'Must be a 6-digit hex colour like #161618'
        ),
      group: 'branding',
    }),
    defineField({
      name: 'customColors',
      type: 'array',
      title: 'Custom colour palette',
      description:
        'Named colours available as variables when recolouring circuit SVGs and annotations. Changing a colour here updates every element using it.',
      group: 'branding',
      of: [
        {
          type: 'object',
          name: 'customColor',
          fields: [
            { name: 'name', type: 'string', title: 'Name', validation: (Rule: any) => Rule.required() },
            { name: 'hex', type: 'string', title: 'Hex colour', validation: (Rule: any) => Rule.required() },
          ],
          preview: {
            select: { name: 'name', hex: 'hex' },
            prepare: ({ name, hex }: any) => ({ title: name || 'Untitled', subtitle: hex }),
          },
        },
      ],
    }),
    defineField({
      name: 'textureImage',
      type: 'image',
      title: 'Background texture',
      description:
        'Replaces the default halftone texture across all sections. Leave blank for the default.',
      options: { hotspot: false },
      group: 'branding',
    }),
    defineField({
      name: 'hideTexture',
      type: 'boolean',
      title: 'Hide background texture',
      description: 'Remove the halftone texture entirely, leaving flat section backgrounds.',
      initialValue: false,
      group: 'branding',
    }),
    defineField({
      name: 'logo',
      type: 'image',
      title: 'Logo',
      description:
        'Custom nav logo for this brochure. Leave blank to use the GPGT default logo.',
      options: { hotspot: false },
      group: 'branding',
    }),

    // === SEO GROUP ===
    defineField({
      name: 'seo',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'metaTitle',
          type: 'string',
          description: 'Overrides <title>. Falls back to brochure title.',
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          type: 'text',
          rows: 3,
          description: 'Meta description for search + social. Keep under 160 chars.',
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'ogImage',
          type: 'image',
          description: 'Social sharing preview image. Recommended 1200×630.',
          options: { hotspot: true },
        }),
        defineField({
          name: 'noIndex',
          type: 'boolean',
          description: 'If true, adds <meta robots="noindex"> (blocks search engines).',
          initialValue: false,
        }),
      ],
    }),

    // === LEAD CAPTURE GROUP ===
    defineField({
      name: 'leadCapture',
      type: 'object',
      description: 'HubSpot form config for the Enquire CTA on this brochure.',
      group: 'lead',
      fields: [
        defineField({
          name: 'hubspotFormId',
          type: 'string',
          description: 'HubSpot form ID (from HubSpot → Marketing → Forms).',
        }),
        defineField({
          name: 'hubspotPortalId',
          type: 'string',
          description: 'HubSpot portal/hub ID. Usually the same across all forms.',
        }),
        defineField({
          name: 'destinationEmail',
          type: 'string',
          description: 'Internal notification email when a lead submits.',
          validation: (Rule) => Rule.email(),
        }),
      ],
    }),
  ],

  preview: {
    select: {
      title: 'title',
      subtitle: 'status',
      season: 'season',
      media: 'seo.ogImage',
    },
    prepare({ title, subtitle, season, media }) {
      return {
        title,
        subtitle: `${season ? season + ' · ' : ''}${subtitle ?? 'draft'}`,
        media,
      }
    },
  },

  orderings: [
    {
      title: 'Published date, newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Season, newest first',
      name: 'seasonDesc',
      by: [{ field: 'season', direction: 'desc' }],
    },
  ],
})
