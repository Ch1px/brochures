'use client'

import type { SectionTextCenter } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldCTAGroup } from '../fields'

type Props = {
  section: SectionTextCenter
  onChange: (update: Partial<SectionTextCenter>) => void
}

export function TextCenterEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Content</div>
      <FieldInput
        label="Eyebrow"
        description="Small label above the title, e.g. 'About the Event'."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="About the Event"
      />
      <FieldTextarea
        label="Title"
        description="Centre-aligned heading. Each line break becomes a new line."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="A Truly Unique Experience"
      />
      <FieldRichText
        label="Body"
        description="Centre-aligned body text. Use the toolbar for bold/italic, or start a line with - for a bullet list. Blank lines create new paragraphs."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />

      <FieldCTAGroup
        ctaText={section.ctaText}
        ctaHref={section.ctaHref}
        onChange={(u) => onChange(u)}
      />
    </>
  )
}
