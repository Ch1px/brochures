'use client'

import type { SectionLogos, LogoItem } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldTextarea, FieldRichText, FieldImage, FieldObjectArray } from '../fields'

type Props = {
  section: SectionLogos
  onChange: (update: Partial<SectionLogos>) => void
}

export function LogosEditor({ section, onChange }: Props) {
  const isStrip = section._type === 'logoStrip'
  return (
    <>
      <div className="field-section-heading">Header</div>
      <FieldInput
        label="Eyebrow"
        description="Script-italic accent above the title."
        value={section.eyebrow}
        onChange={(eyebrow) => onChange({ eyebrow })}
        placeholder="Our"
        aiAssist={{ field: 'eyebrow', sectionType: section._type, sectionContext: section }}
      />
      <FieldInput
        label="Title"
        description="Bold heading for the logos section."
        value={section.title}
        onChange={(title) => onChange({ title })}
        placeholder="Partners"
        aiAssist={{ field: 'title', sectionType: section._type, sectionContext: section }}
      />
      <FieldRichText
        label="Subtitle"
        description="Supporting text beneath the title."
        value={section.subtitle}
        onChange={(subtitle) => onChange({ subtitle })}
        rows={2}
      />

      <div className="field-section-heading">Logos</div>
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
              placeholder="Rolex"
            />
            <FieldImage
              label="Logo image"
              description="Transparent PNG works best on dark backgrounds."
              value={logo.image}
              onChange={(image) => update({ image })}
            />
            <FieldInput
              label="Link (optional)"
              description="If set, clicking the logo opens this URL in a new tab."
              value={logo.href}
              onChange={(href) => update({ href })}
              placeholder="https://www.rolex.com"
            />
          </>
        )}
      />
    </>
  )
}
