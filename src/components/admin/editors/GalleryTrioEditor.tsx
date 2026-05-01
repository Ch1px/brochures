'use client'

import type { SectionGalleryTrio, SanityImage } from '@/types/brochure'
import { FieldInput, FieldLabel, FieldImageSlot } from '../fields'

type Props = {
  section: SectionGalleryTrio
  onChange: (update: Partial<SectionGalleryTrio>) => void
}

const SLOT_COUNT = 3

export function GalleryTrioEditor({ section, onChange }: Props) {
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
          description="Bold heading for the gallery row."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="The circuit"
        />
      </div>

      <div className="field-section-heading">Gallery</div>
      <FieldLabel label="Images" description="3 equal tiles in a single row.">
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
