'use client'

import type { SectionFeatures } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldObjectArray, FieldCTAGroup } from '../fields'

type Props = {
  section: SectionFeatures
  onChange: (update: Partial<SectionFeatures>) => void
}

type Card = NonNullable<SectionFeatures['cards']>[number]

export function FeaturesEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Header</div>
      <div className="field-row-2">
        <FieldInput
          label="Title"
          description="First part of the heading."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="A weekend of"
          aiAssist={{ field: 'title', sectionType: 'features', sectionContext: section }}
        />
        <FieldInput
          label="Title accent"
          description="Second part in accent colour."
          value={section.titleAccent}
          onChange={(titleAccent) => onChange({ titleAccent })}
          placeholder="speed"
          aiAssist={{ field: 'titleAccent', sectionType: 'features', sectionContext: section }}
        />
      </div>
      <FieldRichText
        label="Subtitle"
        description="Supporting text beneath the title."
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
      />

      <FieldCTAGroup
        ctaText={section.ctaText}
        ctaHref={section.ctaHref}
        onChange={(u) => onChange(u)}
      />

      <div className="field-section-heading">Feature cards</div>
      <FieldObjectArray<Card>
        label="Cards"
        description="Up to 3 cards render in a row. Each card has a title, body text, and image."
        value={section.cards}
        onChange={(cards) => onChange({ cards })}
        maxItems={3}
        addLabel="+ Add card"
        itemTitle={(i, c) => c.title || `Card ${String(i + 1).padStart(2, '0')}`}
        createNew={() => ({ _key: nanokey(), title: '', text: '' })}
        renderItem={(card, update) => (
          <>
            <FieldInput
              label="Title"
              description="Card heading."
              value={card.title}
              onChange={(title) => update({ title })}
              placeholder="Paddock Club Access"
            />
            <FieldRichText
              label="Text"
              description="Card body. Keep it concise — 2–3 sentences."
              value={card.text}
              onChange={(text) => update({ text })}
              rows={3}
            />
            <FieldImage
              label="Image"
              description="Card image. Ideal: 600×400px landscape, JPG or PNG."
              value={card.image}
              onChange={(image) => update({ image })}
            />
          </>
        )}
      />
    </>
  )
}
