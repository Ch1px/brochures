'use client'

import type { SectionCover } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage, FieldVideo } from '../fields'

type Props = {
  section: SectionCover
  onChange: (update: Partial<SectionCover>) => void
}

export function CoverEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Title & Copy</div>
      <FieldInput
        label="Supertitle"
        description="Small line above the title, e.g. 'Formula 1'."
        value={section.sup}
        onChange={(sup) => onChange({ sup })}
        placeholder="Formula 1"
      />
      <FieldInput
        label="Title"
        description="The main cover headline, e.g. 'Monaco'."
        value={section.title}
        onChange={(title) => onChange({ title })}
        placeholder="Monaco"
      />
      <FieldInput
        label="Title accent"
        description="Second line in script font with accent colour, e.g. 'Grand Prix'."
        value={section.titleAccent}
        onChange={(titleAccent) => onChange({ titleAccent })}
        placeholder="Grand Prix"
      />
      <FieldTextarea
        label="Tagline"
        description="Supporting text beneath the title. Keep it to 1–2 lines."
        value={section.tag}
        onChange={(tag) => onChange({ tag })}
        rows={2}
        placeholder="Experience the most prestigious race on the F1 calendar..."
      />

      <div className="field-section-heading">Chrome</div>
      <div className="field-row-2">
        <FieldInput
          label="Edition badge"
          description="Top-right corner."
          value={section.edition}
          onChange={(edition) => onChange({ edition })}
          placeholder="2026 Edition"
        />
        <FieldInput
          label="Brand mark"
          description="Top-left corner."
          value={section.brandMark}
          onChange={(brandMark) => onChange({ brandMark })}
          placeholder="GPGT · Hospitality"
        />
      </div>
      <div className="field-row-2">
        <FieldInput
          label="CTA label"
          description="Button text at bottom-left."
          value={section.cta}
          onChange={(cta) => onChange({ cta })}
          placeholder="Take your seat"
        />
        <FieldInput
          label="Reference"
          description="Bottom-right line."
          value={section.ref}
          onChange={(ref) => onChange({ ref })}
          placeholder="No. 001 / Volume XV"
        />
      </div>

      <div className="field-section-heading">Background</div>
      <FieldImage
        label="Background image"
        description="Full-bleed cover image. Ideal: 1920×1080px landscape, JPG or PNG."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="Looping video replaces the image. The image above is used as the poster while loading. Keep under 10MB for best performance."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
    </>
  )
}
