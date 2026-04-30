'use client'

import type { SectionIntro } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo, FieldCTAGroup, FieldSelect } from '../fields'

type Props = {
  section: SectionIntro
  onChange: (update: Partial<SectionIntro>) => void
}

export function IntroEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Content</div>
      <div className="field-row-2">
        <FieldInput
          label="Accent letter"
          description="Large decorative letter. Ignored if a letter image is set."
          value={section.letter}
          onChange={(letter) => onChange({ letter })}
          maxLength={2}
          placeholder="A"
        />
        <FieldInput
          label="Eyebrow"
          description="Small label above title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Introduction"
        />
      </div>
      <FieldImage
        label="Letter image (optional)"
        description="Replaces the accent letter with an image (e.g. a logomark). PNG with transparent background recommended."
        value={section.letterImage}
        onChange={(letterImage) => onChange({ letterImage })}
      />
      {section.letterImage ? (
        <FieldSelect
          label="Letter image size"
          description="Multiplier on the default letter slot height."
          value={
            typeof section.letterImageScale === 'number'
              ? String(section.letterImageScale)
              : ''
          }
          onChange={(v) => onChange({ letterImageScale: v ? Number(v) : undefined })}
          options={[
            { value: '', label: 'Default' },
            { value: '0.5', label: '50%' },
            { value: '0.75', label: '75%' },
            { value: '1', label: '100%' },
            { value: '1.25', label: '125%' },
            { value: '1.5', label: '150%' },
            { value: '2', label: '200%' },
            { value: '2.5', label: '250%' },
          ]}
        />
      ) : null}
      <FieldTextarea
        label="Title"
        description="The section heading. Write naturally — each line break becomes a new line."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="Your Complete Race Weekend Experience"
      />
      <FieldRichText
        label="Body"
        description="Main editorial text. Use the toolbar for bold/italic, or start a line with - for a bullet list. Blank lines create new paragraphs."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />

      <FieldCTAGroup
        ctaText={section.ctaText}
        ctaHref={section.ctaHref}
        onChange={(u) => onChange(u)}
      />

      <div className="field-section-heading">Media</div>
      <FieldImage
        label="Image"
        description="Right-column image. Ideal: 800×1000px portrait, JPG or PNG."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Video (optional)"
        description="Short looping video replaces the image. Best as a compressed MP4/WebM under 5MB."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
      <FieldInput
        label="Caption"
        description="Overlaid on the bottom-left of the image."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        placeholder="Monte Carlo, Monaco — the jewel of F1"
      />
    </>
  )
}
