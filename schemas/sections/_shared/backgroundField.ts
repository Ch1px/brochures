import { defineField } from 'sanity'

/**
 * Shared background-colour field. Included in every section schema so an admin
 * can override the default page background on a per-section basis. Leave blank
 * for the brochure's theme default. Use `transparent` to clear the background.
 */
export const backgroundField = defineField({
  name: 'background',
  title: 'Section background',
  type: 'string',
  description:
    'Override the section background. A hex colour (e.g. #161618), an rgba() value, or "transparent". Leave empty to use the brochure theme default.',
})
