'use client'

import type { SectionClosing } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo } from '../fields'

type Props = {
  section: SectionClosing
  onChange: (update: Partial<SectionClosing>) => void
}

export function ClosingEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Content</div>
      <FieldInput
        label="Eyebrow"
        description="Small label above the title, e.g. 'Get in Touch'."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="Get in Touch"
      />
      <FieldTextarea
        label="Title"
        description="Main closing headline. Keep it to one or two lines."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="Ready to Experience the Race?"
      />
      <FieldRichText
        label="Subtitle"
        description="Supporting text beneath the title. A short paragraph works best."
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={3}
      />

      <div className="field-section-heading">Call to Action</div>
      <div className="field-row-2">
        <FieldInput
          label="CTA label"
          description="Button text."
          value={section.ctaText}
          onChange={(ctaText) => onChange({ ctaText })}
          placeholder="Enquire Now"
        />
        <FieldInput
          label="CTA link"
          description="Use '#enquire' for the lead-capture modal, or a full URL."
          value={section.ctaHref}
          onChange={(ctaHref) => onChange({ ctaHref })}
          placeholder="#enquire"
        />
      </div>

      <div className="field-section-heading">Contact Details</div>
      <div className="field-row-2">
        <FieldInput
          label="Contact email"
          description="Shown below the CTA button."
          value={section.email}
          onChange={(email) => onChange({ email })}
          placeholder="info@grandprixgrandtours.com"
        />
        <FieldInput
          label="Contact phone"
          description="Shown alongside the email."
          value={section.phone}
          onChange={(phone) => onChange({ phone })}
          placeholder="+44 20 1234 5678"
        />
      </div>

      <div className="field-section-heading">Background</div>
      <FieldImage
        label="Background image"
        description="Optional full-bleed background image. The decorative SVG renders on top. Ideal: 1920×1080px landscape."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="Looping video replaces the image. The image above is used as the poster while loading."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
    </>
  )
}
