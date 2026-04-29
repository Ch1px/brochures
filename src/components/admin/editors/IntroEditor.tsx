'use client'

import type { SectionIntro } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo, FieldCTAGroup } from '../fields'

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
          description="Large decorative letter."
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
