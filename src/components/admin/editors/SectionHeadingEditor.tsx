'use client'

import type { SectionSectionHeading } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo, FieldSelect } from '../fields'

type Props = {
  section: SectionSectionHeading
  onChange: (update: Partial<SectionSectionHeading>) => void
}

export function SectionHeadingEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Content</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Script italic in accent colour."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="A weekend of"
        />
        <FieldInput
          label="Title"
          description="Bold uppercase heading."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="Hospitality"
        />
      </div>
      <FieldRichText
        label="Body text"
        description="Optional supporting text beneath the title. Keep it brief — this is a chapter divider, not a content section."
        value={section.text}
        onChange={(text) => onChange({ text })}
        rows={3}
      />

      <div className="field-section-heading">Background</div>
      <FieldImage
        label="Background image"
        description="Full-bleed backdrop. Ideal: 1920×1080px landscape, JPG or PNG. Gets a dark overlay for text readability."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="Looping video replaces the image. Best as a short MP4/WebM under 10MB."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
      <FieldSelect
        label="Overlay strength"
        description="Controls the dark overlay. Stronger = more readable text, but dims the image."
        value={section.overlayStrength ?? 'medium'}
        onChange={(overlayStrength) => onChange({ overlayStrength: overlayStrength as SectionSectionHeading['overlayStrength'] })}
        options={[
          { value: 'none', label: 'None' },
          { value: 'light', label: 'Light' },
          { value: 'medium', label: 'Medium (default)' },
          { value: 'strong', label: 'Strong' },
        ]}
      />
    </>
  )
}
