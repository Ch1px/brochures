'use client'

import type { SectionIntro } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage } from '../fields'

type Props = {
  section: SectionIntro
  onChange: (update: Partial<SectionIntro>) => void
}

export function IntroEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Accent letter"
        description="Large decorative letter in the top-left."
        value={section.letter}
        onChange={(letter) => onChange({ letter })}
        maxLength={2}
      />
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
        label="Image"
        description="Right-column image."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldInput
        label="Caption"
        description="Overlaid on the bottom-left of the image."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
      />
    </>
  )
}
