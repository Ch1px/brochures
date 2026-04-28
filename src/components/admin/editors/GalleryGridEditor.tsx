'use client'

import type { SectionGalleryGrid, SanityImage } from '@/types/brochure'
import { FieldInput, FieldLabel, FieldImageSlot } from '../fields'

type Props = {
  section: SectionGalleryGrid
  onChange: (update: Partial<SectionGalleryGrid>) => void
}

const SLOT_COUNT = 6

export function GalleryGridEditor({ section, onChange }: Props) {
  const images = section.images ?? []

  function setSlot(index: number, img: SanityImage | undefined) {
    const next = [...images]
    while (next.length < SLOT_COUNT) next.push(undefined as unknown as SanityImage)
    next[index] = img as SanityImage
    while (next.length > 0 && next[next.length - 1] == null) next.pop()
    onChange({ images: next })
  }

  return (
    <>
      <div className="field-section-heading">Header</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Script-italic accent above the title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Explore"
        />
        <FieldInput
          label="Title"
          description="Bold heading for the gallery grid."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="The circuit"
        />
      </div>

      <div className="field-section-heading">Gallery</div>
      <FieldLabel label="Images" description="6 equal tiles, 3 columns x 2 rows.">
        <div className="field-image-slot-grid">
          {Array.from({ length: SLOT_COUNT }).map((_, i) => (
            <FieldImageSlot
              key={i}
              slotLabel={`Slot ${String(i + 1).padStart(2, '0')}`}
              value={images[i]}
              onChange={(img) => setSlot(i, img)}
            />
          ))}
        </div>
      </FieldLabel>
    </>
  )
}
