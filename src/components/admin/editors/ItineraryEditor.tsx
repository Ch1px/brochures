'use client'

import type { SectionItinerary } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldObjectArray } from '../fields'

type Props = {
  section: SectionItinerary
  onChange: (update: Partial<SectionItinerary>) => void
}

type Day = NonNullable<SectionItinerary['days']>[number]

export function ItineraryEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldObjectArray<Day>
        label="Days"
        value={section.days}
        onChange={(days) => onChange({ days })}
        addLabel="+ Add day"
        itemTitle={(i, d) => (d.title ? `${d.day || String(i + 1).padStart(2, '0')} · ${d.title}` : `Day ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({
          _key: nanokey(),
          day: '',
          label: '',
          title: '',
          description: '',
        })}
        renderItem={(day, update) => (
          <>
            <FieldInput
              label="Day number"
              description="e.g. “01”, “02”."
              value={day.day}
              onChange={(v) => update({ day: v })}
            />
            <FieldInput
              label="Weekday"
              description="e.g. “Thursday”."
              value={day.label}
              onChange={(label) => update({ label })}
            />
            <FieldInput
              label="Title"
              value={day.title}
              onChange={(title) => update({ title })}
            />
            <FieldTextarea
              label="Description"
              value={day.description}
              onChange={(description) => update({ description })}
              rows={2}
            />
          </>
        )}
      />
    </>
  )
}
