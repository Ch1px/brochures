'use client'

import type { SectionQuoteProfile } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage } from '../fields'

type Props = {
  section: SectionQuoteProfile
  onChange: (update: Partial<SectionQuoteProfile>) => void
}

export function QuoteProfileEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Eyebrow"
        description="Small label above the name, e.g. “A word from”."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldInput
        label="Name"
        description="Rendered in Northwell script."
        value={section.name}
        onChange={(name) => onChange({ name })}
      />
      <FieldImage
        label="Photo"
        description="Circular portrait with red ring accent."
        value={section.photo}
        onChange={(photo) => onChange({ photo })}
      />
      <FieldTextarea
        label="Quote"
        description="The featured italic quote (red-bar accented)."
        value={section.quote}
        onChange={(quote) => onChange({ quote })}
        rows={4}
      />
      <FieldRichText
        label="Body"
        description="Supporting text beneath the quote."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={4}
      />
    </>
  )
}
