'use client'

import type { SectionSpotlight } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldVideo, FieldBoolean, FieldSelect } from '../fields'

type Props = {
  section: SectionSpotlight
  onChange: (update: Partial<SectionSpotlight>) => void
}

export function SpotlightEditor({ section, onChange }: Props) {
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
      <FieldBoolean
        label="Show foreground image"
        description="When off, the framed image is hidden and the text fills the section."
        value={section.showForegroundImage ?? true}
        onChange={(showForegroundImage) => onChange({ showForegroundImage })}
      />
      <FieldImage
        label="Foreground image"
        description="Smaller framed image shown on the left."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Foreground video (optional)"
        description="If set, plays in place of the foreground image. The image above is used as the poster while the video loads."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />
      <FieldInput
        label="Caption"
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
      />
      <FieldImage
        label="Background image"
        description="Full-bleed image behind the section. A dark overlay is applied so the text stays readable."
        value={section.backgroundImage}
        onChange={(backgroundImage) => onChange({ backgroundImage })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="If set, plays in place of the background image. The image above is used as the poster while the video loads."
        value={section.backgroundVideo}
        onChange={(backgroundVideo) => onChange({ backgroundVideo })}
      />
      <FieldBoolean
        label="Parallax background"
        description="The background drifts slower than the content as the page scrolls."
        value={section.backgroundParallax}
        onChange={(backgroundParallax) => onChange({ backgroundParallax })}
      />
      <FieldSelect
        label="Overlay strength"
        description="How much the dark gradient dims the background image."
        value={section.overlayStrength ?? 'medium'}
        onChange={(v) => onChange({ overlayStrength: v as 'none' | 'light' | 'medium' | 'strong' })}
        options={[
          { value: 'none', label: 'None' },
          { value: 'light', label: 'Light' },
          { value: 'medium', label: 'Medium' },
          { value: 'strong', label: 'Strong' },
        ]}
      />
    </>
  )
}
