'use client'

import type { SectionSectionHeading } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo } from '../fields'

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
      <FieldRichText
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
      <FieldVideo
        label="Background video (optional)"
        description="If set, plays in place of the background image. The image above is used as the poster while the video loads."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
    </>
  )
}
