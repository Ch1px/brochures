'use client'

import type { SectionContentImage } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldImage } from '../fields'

type Props = {
  section: SectionContentImage
  onChange: (update: Partial<SectionContentImage>) => void
}

/**
 * Editor for contentImage + imageContent — identical fields, the left/right
 * layout is determined by _type at render time.
 */
export function SplitSectionEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Eyebrow"
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldTextarea
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
      />
      <FieldTextarea
        label="Body"
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />
      <FieldImage
        label="Image"
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldInput
        label="Caption"
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
      />
    </>
  )
}
