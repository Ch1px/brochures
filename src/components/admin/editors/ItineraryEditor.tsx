'use client'

import type { SectionItinerary } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldRichText, FieldObjectArray } from '../fields'

type Props = {
  section: SectionItinerary
  onChange: (update: Partial<SectionItinerary>) => void
}

type Day = NonNullable<SectionItinerary['days']>[number]

export function ItineraryEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Header</div>
      <FieldInput
        label="Title"
        description="Main heading for the itinerary section."
        value={section.title}
        onChange={(title) => onChange({ title })}
        placeholder="Your itinerary"
        aiAssist={{ field: 'title', sectionType: 'itinerary', sectionContext: section }}
      />

      <div className="field-section-heading">Schedule</div>
      <FieldObjectArray<Day>
        label="Days"
        description="Each day appears as a card in the itinerary timeline."
        value={section.days}
        onChange={(days) => onChange({ days })}
        addLabel="+ Add day"
        itemTitle={(i, d) => (d.title ? `${d.day || String(i + 1).padStart(2, '0')} \u00b7 ${d.title}` : `Day ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({
          _key: nanokey(),
          day: '',
          label: '',
          title: '',
          description: '',
        })}
        renderItem={(day, update) => (
          <>
            <div className="field-row-2">
              <FieldInput
                label="Day number"
                description="e.g. '01', '02'."
                value={day.day}
                onChange={(v) => update({ day: v })}
                placeholder="01"
              />
              <FieldInput
                label="Weekday"
                description="e.g. 'Thursday'."
                value={day.label}
                onChange={(label) => update({ label })}
                placeholder="Thursday"
              />
            </div>
            <FieldInput
              label="Title"
              description="Headline for this day."
              value={day.title}
              onChange={(title) => update({ title })}
              placeholder="Arrival & welcome reception"
            />
            <FieldRichText
              label="Description"
              description="Detailed schedule for the day. Use bold for times."
              value={day.description}
              onChange={(description) => update({ description })}
              rows={2}
              aiAssist={{ field: 'description', sectionType: 'itinerary', sectionContext: section }}
            />
          </>
        )}
      />
    </>
  )
}
