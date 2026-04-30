import { defineType, defineField } from 'sanity'
import { backgroundField } from './_shared/backgroundField'
import { sectionStyleFields } from './_shared/sectionStyleFields'
import { imageMediaFields } from './_shared/imageTreatmentFields'

export default defineType({
  name: 'spotlight',
  title: 'Spotlight',
  type: 'object',
  description: 'Image + content split with a full-bleed background image behind the section.',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'title', type: 'text', rows: 2, validation: (Rule) => Rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 6 }),
    defineField({ name: 'ctaText', type: 'string', description: 'Optional CTA button label.' }),
    defineField({ name: 'ctaHref', type: 'string', description: 'CTA target: "#next", "#enquire", or a full URL.' }),
    defineField({
      name: 'showForegroundImage',
      title: 'Show foreground image',
      type: 'boolean',
      description: 'When off, the framed image is hidden and the text fills the section.',
      initialValue: true,
    }),
    defineField({
      name: 'image',
      title: 'Foreground image',
      type: 'image',
      options: { hotspot: true },
      description: 'The smaller framed image on the left.',
    }),
    defineField({
      name: 'video',
      title: 'Foreground video',
      type: 'file',
      description: 'Optional looping video. If set, plays in place of the foreground image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
    defineField({ name: 'caption', type: 'string' }),
    defineField({
      name: 'backgroundImage',
      title: 'Background image',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-bleed image behind the section. A dark overlay is applied so the text stays readable.',
    }),
    defineField({
      name: 'backgroundVideo',
      title: 'Background video',
      type: 'file',
      description: 'Optional looping background video. If set, plays in place of the background image; the image is used as the poster.',
      options: { accept: 'video/*' },
    }),
    defineField({
      name: 'backgroundParallax',
      title: 'Parallax background',
      type: 'boolean',
      description: 'When enabled, the background image/video moves slower than the content as the page scrolls.',
      initialValue: false,
    }),
    defineField({
      name: 'overlayStrength',
      title: 'Overlay strength',
      type: 'string',
      description: 'How much the dark gradient dims the background image.',
      initialValue: 'medium',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Light', value: 'light' },
          { title: 'Medium', value: 'medium' },
          { title: 'Strong', value: 'strong' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'overlayColor',
      title: 'Overlay colour',
      type: 'string',
      description: 'Override the overlay tint for this section. Hex format (e.g. #0a0a0c) or a brand token like "var:bg". Leave blank to inherit from the brochure background.',
    }),
    ...imageMediaFields,
    ...sectionStyleFields,
    backgroundField,
  ],
  preview: {
    select: { title: 'title', subtitle: 'eyebrow', media: 'image' },
    prepare: ({ title, subtitle, media }) => ({
      title: `Spotlight · ${(title || '').slice(0, 40)}`,
      subtitle,
      media,
    }),
  },
})
