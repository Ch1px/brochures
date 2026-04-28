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
      <div className="field-section-heading">Content</div>
      <FieldInput
        label="Eyebrow"
        description="Small label above the title, e.g. 'Hospitality'."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="Hospitality"
      />
      <FieldTextarea
        label="Title"
        description="Bold section heading. Each line break becomes a new line."
        value={section.title}
        onChange={(title) => onChange({ title })}
        rows={2}
        placeholder="World-Class Hospitality"
      />
      <FieldRichText
        label="Body"
        description="Main editorial text. Use the toolbar for bold/italic, or start a line with - for a bullet list."
        value={section.body}
        onChange={(body) => onChange({ body })}
        rows={6}
      />
      <FieldInput
        label="Caption"
        description="Short text overlaid on the foreground image."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        placeholder="Exclusive paddock access"
      />

      <div className="field-section-heading">Foreground</div>
      <FieldBoolean
        label="Show foreground image"
        description="When off, the framed image is hidden and the text fills the section."
        value={section.showForegroundImage ?? true}
        onChange={(showForegroundImage) => onChange({ showForegroundImage })}
      />
      <FieldImage
        label="Foreground image"
        description="Smaller framed image shown on the left. Ideal: 800x1000px portrait, JPG or PNG."
        value={section.image}
        onChange={(image) => onChange({ image })}
      />
      <FieldVideo
        label="Foreground video (optional)"
        description="If set, plays in place of the foreground image. The image above is used as the poster while the video loads."
        value={section.video}
        onChange={(video) => onChange({ video })}
      />

      <div className="field-section-heading">Background</div>
      <FieldImage
        label="Background image"
        description="Full-bleed image behind the section. A dark overlay is applied so the text stays readable. Ideal: 1920x1080px landscape."
        value={section.backgroundImage}
        onChange={(backgroundImage) => onChange({ backgroundImage })}
      />
      <FieldVideo
        label="Background video (optional)"
        description="If set, plays in place of the background image. The image above is used as the poster while the video loads. Keep under 10MB."
        value={section.backgroundVideo}
        onChange={(backgroundVideo) => onChange({ backgroundVideo })}
      />
      <div className="field-row-2">
        <FieldSelect
          label="Overlay strength"
          description="How much the dark gradient dims the background."
          value={section.overlayStrength ?? 'medium'}
          onChange={(v) => onChange({ overlayStrength: v as 'none' | 'light' | 'medium' | 'strong' })}
          options={[
            { value: 'none', label: 'None' },
            { value: 'light', label: 'Light' },
            { value: 'medium', label: 'Medium' },
            { value: 'strong', label: 'Strong' },
          ]}
        />
        <FieldBoolean
          label="Parallax background"
          description="Background drifts slower than content as the page scrolls."
          value={section.backgroundParallax}
          onChange={(backgroundParallax) => onChange({ backgroundParallax })}
        />
      </div>
    </>
  )
}
