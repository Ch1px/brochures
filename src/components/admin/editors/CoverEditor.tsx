'use client'

import type { SectionCover } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage, FieldVideo, FieldSelect } from '../fields'

const IMAGE_SCALE_OPTIONS = [
  { value: '', label: 'Default' },
  { value: '0.5', label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1', label: '100%' },
  { value: '1.25', label: '125%' },
  { value: '1.5', label: '150%' },
  { value: '2', label: '200%' },
  { value: '2.5', label: '250%' },
]

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
        description={section.supImage ? 'Hidden — supertitle image is in use.' : "Small line above the title, e.g. 'Formula 1'."}
        value={section.sup}
        onChange={(sup) => onChange({ sup })}
        placeholder="Formula 1"
        aiAssist={{ field: 'sup', sectionType: section._type, sectionContext: section }}
      />
      <FieldImage
        label="Supertitle image (optional)"
        description="Replaces the supertitle text with an image (e.g. a small logo). PNG with transparent background recommended."
        value={section.supImage}
        onChange={(supImage) => onChange({ supImage })}
      />
      {section.supImage ? (
        <FieldSelect
          label="Supertitle image size"
          value={typeof section.supImageScale === 'number' ? String(section.supImageScale) : ''}
          onChange={(v) => onChange({ supImageScale: v ? Number(v) : undefined })}
          options={IMAGE_SCALE_OPTIONS}
        />
      ) : null}
      <FieldInput
        label="Title"
        description={section.titleImage ? 'Hidden — title image is in use. Kept for SEO/alt text.' : "The main cover headline, e.g. 'Monaco'."}
        value={section.title}
        onChange={(title) => onChange({ title })}
        placeholder="Monaco"
        aiAssist={{ field: 'title', sectionType: section._type, sectionContext: section }}
      />
      <FieldImage
        label="Title image (optional)"
        description="Replaces the title text with an image (e.g. an event lockup). PNG with transparent background recommended."
        value={section.titleImage}
        onChange={(titleImage) => onChange({ titleImage })}
      />
      {section.titleImage ? (
        <FieldSelect
          label="Title image size"
          value={typeof section.titleImageScale === 'number' ? String(section.titleImageScale) : ''}
          onChange={(v) => onChange({ titleImageScale: v ? Number(v) : undefined })}
          options={IMAGE_SCALE_OPTIONS}
        />
      ) : null}
      <FieldInput
        label="Title accent"
        description={section.titleAccentImage ? 'Hidden — title accent image is in use.' : "Second line in script font with accent colour, e.g. 'Grand Prix'."}
        value={section.titleAccent}
        onChange={(titleAccent) => onChange({ titleAccent })}
        placeholder="Grand Prix"
        aiAssist={{ field: 'titleAccent', sectionType: section._type, sectionContext: section }}
      />
      <FieldImage
        label="Title accent image (optional)"
        description="Replaces the title accent with an image (e.g. a script-style logomark)."
        value={section.titleAccentImage}
        onChange={(titleAccentImage) => onChange({ titleAccentImage })}
      />
      {section.titleAccentImage ? (
        <FieldSelect
          label="Title accent image size"
          value={typeof section.titleAccentImageScale === 'number' ? String(section.titleAccentImageScale) : ''}
          onChange={(v) => onChange({ titleAccentImageScale: v ? Number(v) : undefined })}
          options={IMAGE_SCALE_OPTIONS}
        />
      ) : null}
      <FieldTextarea
        label="Tagline"
        description="Supporting text beneath the title. Keep it to 1–2 lines."
        value={section.tag}
        onChange={(tag) => onChange({ tag })}
        rows={2}
        placeholder="Experience the most prestigious race on the F1 calendar..."
        aiAssist={{ field: 'tag', sectionType: section._type, sectionContext: section }}
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
          label="CTA link"
          description="#next, #enquire, or a full URL. Defaults to #enquire."
          value={section.ctaHref}
          onChange={(ctaHref) => onChange({ ctaHref })}
          placeholder="#enquire"
        />
      </div>
      <FieldInput
        label="Reference"
        description="Bottom-right line."
        value={section.ref}
        onChange={(ref) => onChange({ ref })}
        placeholder="No. 001 / Volume XV"
      />

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
