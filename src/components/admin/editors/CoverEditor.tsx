'use client'

import type { SectionCover } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage } from '../fields'

type Props = {
  section: SectionCover
  onChange: (update: Partial<SectionCover>) => void
}

/**
 * Editor for cover + coverCentered sections — same fields, the variant is
 * set by _type (not editable from here; to switch variants, delete and re-add).
 */
export function CoverEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Edition"
        description="Top-right badge, e.g. “2026 Edition”."
        value={section.edition}
        onChange={(edition) => onChange({ edition })}
      />
      <FieldInput
        label="Brand mark"
        description="Top-left tick mark, e.g. “GPGT · Hospitality”."
        value={section.brandMark}
        onChange={(brandMark) => onChange({ brandMark })}
      />
      <FieldInput
        label="Supertitle"
        description="Small line above the title, e.g. “Formula 1”."
        value={section.sup}
        onChange={(sup) => onChange({ sup })}
      />
      <FieldInput
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldInput
        label="Title accent"
        description="Second line in Northwell script red, e.g. “Grand Prix”."
        value={section.titleAccent}
        onChange={(titleAccent) => onChange({ titleAccent })}
      />
      <FieldTextarea
        label="Tagline"
        value={section.tag}
        onChange={(tag) => onChange({ tag })}
        rows={2}
      />
      <FieldInput
        label="CTA label"
        value={section.cta}
        onChange={(cta) => onChange({ cta })}
      />
      <FieldInput
        label="Reference"
        description="Bottom-right reference line, e.g. “No. 001 / Volume XV”."
        value={section.ref}
        onChange={(ref) => onChange({ ref })}
      />
      <FieldImage
        label="Background image"
        description="Full-bleed image behind the cover."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
    </>
  )
}
