'use client'

import { FieldInput } from './FieldInput'

type Props = {
  ctaText?: string
  ctaHref?: string
  onChange: (update: { ctaText?: string; ctaHref?: string }) => void
}

export function FieldCTAGroup({ ctaText, ctaHref, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Call to Action</div>
      <div className="field-row-2">
        <FieldInput
          label="CTA label"
          description="Button text. Leave blank to hide."
          value={ctaText}
          onChange={(v) => onChange({ ctaText: v })}
          placeholder="Enquire Now"
        />
        <FieldInput
          label="CTA link"
          description="#next, #enquire, or a full URL."
          value={ctaHref}
          onChange={(v) => onChange({ ctaHref: v })}
          placeholder="#enquire"
        />
      </div>
    </>
  )
}
