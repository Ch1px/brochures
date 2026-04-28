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
  const isImageLeft = section._type === 'imageContent'
  return (
    <>
      <div className="field-section-heading">Content</div>
      <FieldInput
        label="Eyebrow"
        description="Small label in script font above the title."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="The Experience"
      />
      <FieldTextarea
        label="Title"
        description="Section heading. Each line break becomes a new line."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="A Weekend Like No Other"
      />
      <FieldRichText
        label="Body"
        description="Main text. Use bold/italic from the toolbar, or start a line with - for bullets."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />

      <div className="field-section-heading">Media ({isImageLeft ? 'left column' : 'right column'})</div>
      <FieldImage
        label="Image"
        description="Ideal: 800×1000px portrait ratio. JPG or PNG."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Video (optional)"
        description="Looping video replaces the image. Best as a short MP4/WebM loop under 5MB."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
      <FieldInput
        label="Caption"
        description="Overlaid at the bottom of the image."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        placeholder="Monaco harbour at sunset"
      />
    </>
  )
}
