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
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Small label above title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="By the numbers"
        />
        <FieldInput
          label="Title"
          description="Section heading."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="Key Facts"
        />
      </div>
      <FieldObjectArray<StatItem>
        label="Stats"
        description="4 stats render in a full row; 3 or fewer centre-align. Up to 6 supported."
        value={section.stats}
        onChange={(stats) => onChange({ stats })}
        maxItems={6}
        addLabel="+ Add stat"
        itemTitle={(i, it) => (it.label ? `${it.value || '—'} ${it.unit || ''} · ${it.label}` : `Stat ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({ _key: nanokey(), value: '', unit: '', label: '' })}
        renderItem={(stat, update) => (
          <>
            <div className="field-row-2">
              <FieldInput
                label="Value"
                description="The number, e.g. '3.337'."
                value={stat.value}
                onChange={(value) => update({ value })}
                placeholder="3.337"
              />
              <FieldInput
                label="Unit"
                description="e.g. 'KM', 'KM/H'."
                value={stat.unit}
                onChange={(unit) => update({ unit })}
                placeholder="KM"
              />
            </div>
            <FieldInput
              label="Label"
              description="Descriptor shown below the number."
              value={stat.label}
              onChange={(label) => update({ label })}
              placeholder="Circuit length"
            />
          </>
        )}
      />
    </>
  )
}
