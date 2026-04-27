'use client'

import type { SectionImageHero } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo } from '../fields'

type Props = {
  section: SectionImageHero
  onChange: (update: Partial<SectionImageHero>) => void
}

export function ImageHeroEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Eyebrow"
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldTextarea
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
      />
      <FieldRichText
        label="Text"
        value={section.text}
        onChange={(text) => onChange({ text })}
        rows={4}
      />
      <FieldImage
        label="Background image"
        description="Full-bleed image behind the overlay."
        value={section.image}
        onChange={(image) => onChange({ image: image! })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="If set, plays in place of the background image. The image above is used as the poster while the video loads."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
    </>
  )
}
