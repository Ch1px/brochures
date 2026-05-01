'use client'

import type { SectionGalleryHero, SanityImage } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldLabel, FieldImage, FieldImageSlot } from '../fields'

type Props = {
  section: SectionGalleryHero
  onChange: (update: Partial<SectionGalleryHero>) => void
}

/**
 * Gallery Hero = 4 images: index 0 is the lead (with caption overlay),
 * indexes 1-3 are thumbnails. We edit the lead with the larger FieldImage
 * and the thumbnails with the smaller FieldImageSlot.
 */
export function GalleryHeroEditor({ section, onChange }: Props) {
  const images = section.images ?? []

  function setImage(index: number, img: SanityImage | undefined) {
    const next = [...images]
    while (next.length < 4) next.push(undefined as unknown as SanityImage)
    next[index] = img as SanityImage
    while (next.length > 0 && next[next.length - 1] == null) next.pop()
    onChange({ images: next })
  }

  return (
    <>
      <div className="field-section-heading">Header</div>
      <FieldInput
        label="Eyebrow"
        description="Script-italic accent above the title."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="Experience"
        aiAssist={{ field: 'eyebrow', sectionType: 'galleryHero', sectionContext: section }}
      />
      <FieldInput
        label="Title"
        description="Bold heading for the hero gallery."
        value={section.title}
        onChange={(title) => onChange({ title })}
        placeholder="Race day gallery"
        aiAssist={{ field: 'title', sectionType: 'galleryHero', sectionContext: section }}
      />

      <div className="field-section-heading">Gallery</div>
      <FieldImage
        label="Lead image"
        description="The large hero image at the top of the section."
        value={images[0]}
        onChange={(img) => setImage(0, img)}
      />
      <FieldLabel label="Thumbnails" description="Three smaller images shown as a strip beneath the lead.">
        <div className="field-image-slot-grid thumbs">
          {[1, 2, 3].map((i) => (
            <FieldImageSlot
              key={i}
              slotLabel={`Thumb ${String(i).padStart(2, '0')}`}
              value={images[i]}
              onChange={(img) => setImage(i, img)}
            />
          ))}
        </div>
      </FieldLabel>

      <div className="field-section-heading">Caption</div>
      <FieldTextarea
        label="Lead caption"
        description="Overlaid on the bottom of the lead image."
        value={section.caption}
        onChange={(caption) => onChange({ caption })}
        rows={2}
        placeholder="The atmosphere is electric as the cars line up on the grid..."
        aiAssist={{ field: 'caption', sectionType: 'galleryHero', sectionContext: section }}
      />
    </>
  )
}
