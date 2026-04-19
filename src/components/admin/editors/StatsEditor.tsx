'use client'

import type { SectionStats, StatItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldObjectArray } from '../fields'

type Props = {
  section: SectionStats
  onChange: (update: Partial<SectionStats>) => void
}

export function StatsEditor({ section, onChange }: Props) {
  return (
    <>
      <FieldInput
        label="Eyebrow"
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
      />
      <FieldInput
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldObjectArray<StatItem>
        label="Stats"
        description="4 stats render in a full row; 3 or fewer centre-align."
        value={section.stats}
        onChange={(stats) => onChange({ stats })}
        maxItems={6}
        addLabel="+ Add stat"
        itemTitle={(i, it) => (it.label ? it.label : `Stat ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({ _key: nanokey(), value: '', unit: '', label: '' })}
        renderItem={(stat, update) => (
          <>
            <FieldInput
              label="Value"
              description="The number as a display string, e.g. “3.337”."
              value={stat.value}
              onChange={(value) => update({ value })}
            />
            <FieldInput
              label="Unit"
              description="Optional, e.g. “KM”, “KM/H”."
              value={stat.unit}
              onChange={(unit) => update({ unit })}
            />
            <FieldInput
              label="Label"
              value={stat.label}
              onChange={(label) => update({ label })}
            />
          </>
        )}
      />
    </>
  )
}
