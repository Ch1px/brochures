'use client'

import type { SectionImageHero } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage } from '../fields'

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
      <FieldTextarea
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
    </>
  )
}
