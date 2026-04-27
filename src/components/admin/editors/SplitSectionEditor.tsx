'use client'

import type { SectionContentImage } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo } from '../fields'

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
      <FieldRichText
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
      <FieldVideo
        label="Video (optional)"
        description="If set, plays in place of the image. The image above is used as the poster while the video loads."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
      <FieldInput
        label="Caption"
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
      />
    </>
  )
}
