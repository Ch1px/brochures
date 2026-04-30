import { defineField } from 'sanity'

/**
 * Per-section image-treatment fields. Included in every image-bearing
 * section schema so admins can tint, desaturate, or soften images on a
 * per-section basis. All fields are optional and inherit their "no
 * treatment" defaults when blank.
 *
 * Sections that already declare `overlayStrength` + `overlayColor`
 * inline (cover, closing, sectionHeading, spotlight, linkedCards) use
 * `imageMediaFields` instead, which omits the overlay fields.
 */
export const imageTreatmentFields = [
  defineField({
    name: 'overlayStrength',
    type: 'string',
    title: 'Image overlay strength',
    description: 'Tints the section image(s) with a flat overlay. Leave blank for no overlay.',
    options: {
      list: [
        { title: 'None (default)', value: 'none' },
        { title: 'Light', value: 'light' },
        { title: 'Medium', value: 'medium' },
        { title: 'Strong', value: 'strong' },
      ],
    },
  }),
  defineField({
    name: 'overlayColor',
    title: 'Image overlay colour',
    type: 'string',
    description: 'Override the overlay tint. Hex format (e.g. #0a0a0c) or a brand token like "var:bg". Leave blank to inherit from the brochure background.',
  }),
  defineField({
    name: 'mediaGrayscale',
    type: 'string',
    title: 'Image greyscale',
    description: 'Desaturate the section image(s). Leave blank for full colour.',
    options: {
      list: [
        { title: 'None (default)', value: 'none' },
        { title: 'Light', value: 'light' },
        { title: 'Medium', value: 'medium' },
        { title: 'Full', value: 'full' },
      ],
    },
  }),
  defineField({
    name: 'mediaBlur',
    type: 'string',
    title: 'Image blur',
    description: 'Soften the section image(s) with a gaussian blur. Leave blank for sharp.',
    options: {
      list: [
        { title: 'None (default)', value: 'none' },
        { title: 'Light', value: 'light' },
        { title: 'Medium', value: 'medium' },
        { title: 'Strong', value: 'strong' },
      ],
    },
  }),
]

/**
 * Greyscale + blur only. Used by sections that already declare their
 * own `overlayStrength` / `overlayColor` fields inline (cover,
 * closing, sectionHeading*, spotlight, linkedCards).
 */
export const imageMediaFields = [
  defineField({
    name: 'mediaGrayscale',
    type: 'string',
    title: 'Image greyscale',
    description: 'Desaturate the section image(s). Leave blank for full colour.',
    options: {
      list: [
        { title: 'None (default)', value: 'none' },
        { title: 'Light', value: 'light' },
        { title: 'Medium', value: 'medium' },
        { title: 'Full', value: 'full' },
      ],
    },
  }),
  defineField({
    name: 'mediaBlur',
    type: 'string',
    title: 'Image blur',
    description: 'Soften the section image(s) with a gaussian blur. Leave blank for sharp.',
    options: {
      list: [
        { title: 'None (default)', value: 'none' },
        { title: 'Light', value: 'light' },
        { title: 'Medium', value: 'medium' },
        { title: 'Strong', value: 'strong' },
      ],
    },
  }),
]
