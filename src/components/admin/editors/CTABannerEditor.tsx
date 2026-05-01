'use client'

import type { SectionCTABanner } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldCTAGroup } from '../fields'

type Props = {
  section: SectionCTABanner
  onChange: (update: Partial<SectionCTABanner>) => void
}

export function CTABannerEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Content</div>
      <FieldInput
        label="Eyebrow"
        description="Small label above the title, e.g. 'Ready?'."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="Ready?"
        aiAssist={{ field: 'eyebrow', sectionType: 'ctaBanner', sectionContext: section }}
      />
      <FieldTextarea
        label="Title"
        description="Centre-aligned heading. Each line break becomes a new line."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="Take the next step"
        aiAssist={{ field: 'title', sectionType: 'ctaBanner', sectionContext: section }}
      />
      <FieldRichText
        label="Body"
        description="Short supporting text above the button."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={3}
      />

      <FieldCTAGroup
        ctaText={section.ctaText}
        ctaHref={section.ctaHref}
        onChange={(u) => onChange(u)}
      />
    </>
  )
}
