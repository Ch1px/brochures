'use client'

import type { SectionSectionHeading } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage } from '../fields'

type Props = {
  section: SectionSectionHeading
  onChange: (update: Partial<SectionSectionHeading>) => void
}

export function SectionHeadingEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Eyebrow"
        description="Script italic accent in red, e.g. “A weekend of”."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldInput
        label="Title"
        description="Bold uppercase title, e.g. “Hospitality”."
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldTextarea
        label="Body text"
        description="Optional body beneath the title."
        value={section.text}
        onChange={(text) => onChange({ text })}
        rows={3}
      />
      <FieldImage
        label="Background image"
        description="Optional full-bleed backdrop."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
    </>
  )
}
