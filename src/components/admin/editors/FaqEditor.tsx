'use client'

import type { SectionFaq, FaqItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldRichText, FieldObjectArray } from '../fields'

type Props = {
  section: SectionFaq
  onChange: (update: Partial<SectionFaq>) => void
}

export function FaqEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Header</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Script-italic accent above the title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Good to know"
        />
        <FieldInput
          label="Title"
          description="Bold heading for the FAQ block."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="Frequently asked"
        />
      </div>
      <FieldRichText
        label="Subtitle"
        description="Optional supporting paragraph below the title."
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={3}
      />

      <div className="field-section-heading">Questions</div>
      <FieldObjectArray<FaqItem>
        label="Questions"
        description="Up to 6 question/answer pairs. Keep answers to 2–3 sentences."
        value={section.questions}
        onChange={(questions) => onChange({ questions })}
        maxItems={6}
        addLabel="+ Add question"
        itemTitle={(i, item) => item?.question?.trim() || `Question ${String(i + 1).padStart(2, '0')}`}
        createNew={() => ({ _key: nanokey(), question: '', answer: '' })}
        renderItem={(item, update) => (
          <>
            <FieldInput
              label="Question"
              value={item.question}
              onChange={(question) => update({ question })}
              placeholder="What's included in each package?"
            />
            <FieldRichText
              label="Answer"
              value={item.answer}
              onChange={(answer) => update({ answer })}
              rows={4}
              placeholder="Two to three sentences works best."
            />
          </>
        )}
      />
    </>
  )
}
