'use client'

import type { SectionIntro } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo } from '../fields'

type Props = {
  section: SectionIntro
  onChange: (update: Partial<SectionIntro>) => void
}

export function IntroEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Accent letter"
        description="Large decorative letter in the top-left."
        value={section.letter}
        onChange={(letter) => onChange({ letter })}
        maxLength={2}
      />
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
        description="Use the toolbar or start a line with - for a bullet."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />
      <FieldImage
        label="Image"
        description="Right-column image."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Video (optional)"
        description="If set, plays in place of the image. The image above is used as the poster while the video loads. Best as a short MP4/WebM loop."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
      <FieldInput
        label="Caption"
        description="Overlaid on the bottom-left of the image."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
      />
    </>
  )
}
