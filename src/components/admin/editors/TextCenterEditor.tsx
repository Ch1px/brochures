'use client'

import type { SectionTextCenter } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText } from '../fields'

type Props = {
  section: SectionTextCenter
  onChange: (update: Partial<SectionTextCenter>) => void
}

export function TextCenterEditor({ section, onChange }: Props) {
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
        label="Body"
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />
    </>
  )
}
