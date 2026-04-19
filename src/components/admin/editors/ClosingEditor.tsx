'use client'

import type { SectionClosing } from '@/types/brochure'
import { FieldInput, FieldTextarea } from '../fields'

type Props = {
  section: SectionClosing
  onChange: (update: Partial<SectionClosing>) => void
}

export function ClosingEditor({ section, onChange }: Props) {
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
        label="Subtitle"
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={3}
      />
      <FieldInput
        label="CTA label"
        value={section.ctaText}
        onChange={(ctaText) => onChange({ ctaText })}
      />
      <FieldInput
        label="CTA link"
        description="Use “#enquire” to open the lead-capture modal; or a full URL for an external link."
        value={section.ctaHref}
        onChange={(ctaHref) => onChange({ ctaHref })}
      />
      <FieldInput
        label="Contact email"
        value={section.email}
        onChange={(email) => onChange({ email })}
      />
      <FieldInput
        label="Contact phone"
        value={section.phone}
        onChange={(phone) => onChange({ phone })}
      />
    </>
  )
}
