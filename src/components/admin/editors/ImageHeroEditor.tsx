'use client'

import type { SectionImageHero } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo, FieldCTAGroup } from '../fields'

type Props = {
  section: SectionImageHero
  onChange: (update: Partial<SectionImageHero>) => void
}

export function ImageHeroEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Content</div>
      <FieldInput
        label="Eyebrow"
        description="Small label above the title, e.g. 'The Experience'."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="The Experience"
        aiAssist={{ field: 'eyebrow', sectionType: 'imageHero', sectionContext: section }}
      />
      <FieldTextarea
        label="Title"
        description="Bold headline overlaid on the hero image."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="An Unforgettable Weekend"
        aiAssist={{ field: 'title', sectionType: 'imageHero', sectionContext: section }}
      />
      <FieldRichText
        label="Text"
        description="Supporting body copy beneath the title. Keep it concise -- one or two short paragraphs work best."
        value={section.text}
        onChange={(text) => onChange({ text })}
        rows={4}
      />

      <FieldCTAGroup
        ctaText={section.ctaText}
        ctaHref={section.ctaHref}
        onChange={(u) => onChange(u)}
      />

      <div className="field-section-heading">Background</div>
      <FieldImage
        label="Background image"
        description="Full-bleed image behind the overlay. Ideal: 1920x1080px landscape, JPG or PNG."
        value={section.image}
        onChange={(image) => onChange({ image: image! })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="If set, plays in place of the background image. The image above is used as the poster while the video loads. Keep under 10MB for best performance."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
    </>
  )
}
