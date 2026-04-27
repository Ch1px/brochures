'use client'

import type { SectionLogos, LogoItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldImage, FieldObjectArray } from '../fields'

type Props = {
  section: SectionLogos
  onChange: (update: Partial<SectionLogos>) => void
}

export function LogosEditor({ section, onChange }: Props) {
  const isStrip = section._type === 'logoStrip'
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
      <FieldTextarea
        label="Subtitle"
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
      />
      <FieldObjectArray<LogoItem>
        label="Logos"
        description={
          isStrip
            ? 'Best as a single row of 4–8 logos.'
            : 'Best as 6–12 logos arranged in a grid.'
        }
        value={section.logos}
        onChange={(logos) => onChange({ logos })}
        maxItems={isStrip ? 12 : 24}
        addLabel="+ Add logo"
        itemTitle={(i, l) => l.name || `Logo ${String(i + 1).padStart(2, '0')}`}
        createNew={() => ({ _key: nanokey(), name: '' })}
        renderItem={(logo, update) => (
          <>
            <FieldInput
              label="Name"
              description="Brand name; used as alt text and in the editor list."
              value={logo.name}
              onChange={(name) => update({ name })}
            />
            <FieldImage
              label="Logo image"
              value={logo.image}
              onChange={(image) => update({ image })}
            />
            <FieldInput
              label="Link (optional)"
              description="If set, clicking the logo opens this URL in a new tab."
              value={logo.href}
              onChange={(href) => update({ href })}
            />
          </>
        )}
      />
    </>
  )
}
