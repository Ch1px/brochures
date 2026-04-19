'use client'

import type { SectionGalleryEditorial, SanityImage } from '@/types/brochure'
import { FieldInput, FieldLabel, FieldImageSlot } from '../fields'

type Props = {
  section: SectionGalleryEditorial
  onChange: (update: Partial<SectionGalleryEditorial>) => void
}

const SLOT_COUNT = 4

export function GalleryEditorialEditor({ section, onChange }: Props) {
  const images = section.images ?? []

  function setSlot(index: number, img: SanityImage | undefined) {
    const next = [...images]
    while (next.length < SLOT_COUNT) next.push(undefined as unknown as SanityImage)
    next[index] = img as SanityImage
    // Trim trailing empties so the array is clean
    while (next.length > 0 && next[next.length - 1] == null) next.pop()
    onChange({ images: next })
  }

  return (
    <>
      <FieldInput
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldLabel label="Images" description="Slot 1 is large; slot 4 spans two columns. Slots without images show numbered placeholders.">
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
