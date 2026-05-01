'use client'

import type { SectionGalleryDuo, SanityImage } from '@/types/brochure'
import { FieldInput, FieldLabel, FieldImageSlot } from '../fields'

type Props = {
  section: SectionGalleryDuo
  onChange: (update: Partial<SectionGalleryDuo>) => void
}

const SLOT_COUNT = 2

export function GalleryDuoEditor({ section, onChange }: Props) {
  const images = section.images ?? []
  const captions = section.captions ?? []

  function setImage(index: number, img: SanityImage | undefined) {
    const next = [...images]
    while (next.length < SLOT_COUNT) next.push(undefined as unknown as SanityImage)
    next[index] = img as SanityImage
    while (next.length > 0 && next[next.length - 1] == null) next.pop()
    onChange({ images: next })
  }

  function setCaption(index: number, caption: string) {
    const next = [...captions]
    while (next.length < SLOT_COUNT) next.push('')
    next[index] = caption
    onChange({ captions: next })
  }

  return (
    <>
      <div className="field-section-heading">Header</div>
      <FieldInput
        label="Eyebrow"
        description="Script-italic accent above the title."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="Discover"
        aiAssist={{ field: 'eyebrow', sectionType: 'galleryDuo', sectionContext: section }}
      />
      <FieldInput
        label="Title"
        description="Bold heading for the duo gallery."
        value={section.title}
        onChange={(title) => onChange({ title })}
        placeholder="Two perspectives"
        aiAssist={{ field: 'title', sectionType: 'galleryDuo', sectionContext: section }}
      />

      <div className="field-section-heading">Images</div>
      <FieldLabel label="Slots" description="Two large side-by-side images, each with its own caption overlay.">
        <div className="field-image-slot-grid">
          {Array.from({ length: SLOT_COUNT }).map((_, i) => (
            <div key={i} className="field-image-slot-with-caption">
              <FieldImageSlot
                slotLabel={`Slot ${String(i + 1).padStart(2, '0')}`}
                value={images[i]}
                onChange={(img) => setImage(i, img)}
              />
              <input
                type="text"
                className="field-input"
                placeholder={`Caption ${i + 1}`}
                value={captions[i] ?? ''}
                onChange={(e) => setCaption(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </FieldLabel>
    </>
  )
}
