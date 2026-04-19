'use client'

import type { SectionFeatures } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldImage, FieldObjectArray } from '../fields'

type Props = {
  section: SectionFeatures
  onChange: (update: Partial<SectionFeatures>) => void
}

type Card = NonNullable<SectionFeatures['cards']>[number]

export function FeaturesEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldInput
        label="Title accent"
        description="Second half of the title in red, e.g. “speed” in “A weekend of speed”."
        value={section.titleAccent}
        onChange={(titleAccent) => onChange({ titleAccent })}
      />
      <FieldTextarea
        label="Subtitle"
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
      />
      <FieldObjectArray<Card>
        label="Cards"
        description="Exactly three cards render in a row."
        value={section.cards}
        onChange={(cards) => onChange({ cards })}
        maxItems={3}
        addLabel="+ Add card"
        itemTitle={(i) => `Card ${String(i + 1).padStart(2, '0')}`}
        createNew={() => ({ _key: nanokey(), title: '', text: '' })}
        renderItem={(card, update) => (
          <>
            <FieldInput
              label="Title"
              value={card.title}
              onChange={(title) => update({ title })}
            />
            <FieldTextarea
              label="Text"
              value={card.text}
              onChange={(text) => update({ text })}
              rows={3}
            />
            <FieldImage
              label="Image"
              value={card.image}
              onChange={(image) => update({ image })}
            />
          </>
        )}
      />
    </>
  )
}
