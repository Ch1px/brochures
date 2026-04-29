'use client'

import type { SectionLinkedCards, LinkedCardItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldImage, FieldObjectArray } from '../fields'

type Props = {
  section: SectionLinkedCards
  onChange: (update: Partial<SectionLinkedCards>) => void
}

export function LinkedCardsEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Header</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Small label above the title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Explore"
        />
        <FieldInput
          label="Title"
          description="Section heading."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="Other Experiences"
        />
      </div>

      <div className="field-section-heading">Cards</div>
      <FieldObjectArray<LinkedCardItem>
        label="Cards"
        description="Up to 4 linked cards with images and link buttons."
        value={section.cards}
        onChange={(cards) => onChange({ cards })}
        maxItems={4}
        addLabel="+ Add card"
        itemTitle={(i, c) => c.title || `Card ${String(i + 1).padStart(2, '0')}`}
        createNew={() => ({ _key: nanokey(), title: '', text: '', linkText: 'Take me there', linkHref: '#' })}
        renderItem={(card, update) => (
          <>
            <FieldInput
              label="Title"
              description="Card heading."
              value={card.title}
              onChange={(title) => update({ title })}
              placeholder="Paddock Club"
            />
            <FieldTextarea
              label="Description"
              description="Short description. 1–2 sentences."
              value={card.text}
              onChange={(text) => update({ text })}
              rows={3}
            />
            <FieldImage
              label="Image"
              description="Card image. Ideal: 800×500px landscape, JPG or PNG."
              value={card.image}
              onChange={(image) => update({ image })}
            />
            <div className="field-row-2">
              <FieldInput
                label="Link text"
                description="Button label."
                value={card.linkText}
                onChange={(linkText) => update({ linkText })}
                placeholder="Take me there"
              />
              <FieldInput
                label="Link URL"
                description="Full URL or internal path."
                value={card.linkHref}
                onChange={(linkHref) => update({ linkHref })}
                placeholder="https://..."
              />
            </div>
          </>
        )}
      />
    </>
  )
}
