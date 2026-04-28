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
      <div className="field-section-heading">Quote</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Small label above the name, e.g. 'A word from'."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="A word from"
        />
        <FieldInput
          label="Name"
          description="Rendered in Northwell script."
          value={section.name}
          onChange={(name) => onChange({ name })}
          placeholder="John Smith"
        />
      </div>
      <FieldTextarea
        label="Quote"
        description="The featured italic quote, accented with a red bar. Keep to 2-3 sentences for best visual impact."
        value={section.quote}
        onChange={(quote) => onChange({ quote })}
        rows={4}
        placeholder="This was truly the experience of a lifetime..."
      />

      <div className="field-section-heading">Body</div>
      <FieldRichText
        label="Body"
        description="Supporting text beneath the quote. Use the toolbar for bold/italic formatting."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={4}
      />

      <div className="field-section-heading">Photo</div>
      <FieldImage
        label="Photo"
        description="Circular portrait with accent ring. Ideal: square crop, at least 400x400px, JPG or PNG."
        value={section.photo}
        onChange={(photo) => onChange({ photo })}
      />
    </>
  )
}
