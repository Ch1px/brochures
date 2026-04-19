'use client'

import type { SectionSpotlight } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage } from '../fields'

type Props = {
  section: SectionSpotlight
  onChange: (update: Partial<SectionSpotlight>) => void
}

export function SpotlightEditor({ section, onChange }: Props) {
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
        label="Body"
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />
      <FieldImage
        label="Foreground image"
        description="Smaller framed image shown on the left."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldInput
        label="Caption"
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
      />
      <FieldImage
        label="Background image"
        description="Full-bleed image behind the section. A dark overlay is applied so the text stays readable."
        value={section.backgroundImage}
        onChange={(backgroundImage) => onChange({ backgroundImage })}
      />
    </>
  )
}
