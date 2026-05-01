'use client'

import type { SectionPackages } from '@/types/brochure'
import { nanokey } from '@/lib/nanokey'
import { FieldInput, FieldBoolean, FieldList, FieldObjectArray, FieldImage } from '../fields'

type Props = {
  section: SectionPackages
  onChange: (update: Partial<SectionPackages>) => void
}

type Tier = NonNullable<SectionPackages['packages']>[number]

export function PackagesEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Header</div>
      <div className="field-row-2">
        <FieldInput
          label="Eyebrow"
          description="Script-italic accent above the title."
          value={section.eyebrow}
          onChange={(eyebrow) => onChange({ eyebrow })}
          placeholder="Choose your"
          aiAssist={{ field: 'eyebrow', sectionType: 'packages', sectionContext: section }}
        />
        <FieldInput
          label="Title"
          description="Bold heading for the packages section."
          value={section.title}
          onChange={(title) => onChange({ title })}
          placeholder="Packages"
          aiAssist={{ field: 'title', sectionType: 'packages', sectionContext: section }}
        />
      </div>

      <div className="field-section-heading">Packages</div>
      <FieldObjectArray<Tier>
        label="Packages"
        description="Up to 3 render clearly; a 4th will be cramped."
        value={section.packages}
        onChange={(packages) => onChange({ packages })}
        maxItems={4}
        addLabel="+ Add package"
        itemTitle={(i, p) => (p.name ? `${p.tier ? p.tier + ' \u00b7 ' : ''}${p.name}` : `Package ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({
          _key: nanokey(),
          tier: '',
          name: '',
          currency: '\u00a3',
          price: '',
          from: 'From \u00b7 per person',
          featured: false,
          features: [],
        })}
        renderItem={(pkg, update) => (
          <>
            <FieldImage
              label="Image"
              description="Optional header image at the top of the package card."
              value={pkg.image}
              onChange={(image) => update({ image })}
            />
            <FieldInput
              label="Tier"
              description="Small label above the name, e.g. 'Essential', 'Popular', 'Exclusive'."
              value={pkg.tier}
              onChange={(tier) => update({ tier })}
              placeholder="Essential"
            />
            <FieldInput
              label="Name"
              description="Package display name shown on the card."
              value={pkg.name}
              onChange={(name) => update({ name })}
              placeholder="The Monaco Experience"
            />
            <div className="field-row-2">
              <FieldInput
                label="Currency"
                description="Currency symbol."
                value={pkg.currency}
                onChange={(currency) => update({ currency })}
                placeholder={'\u00a3'}
              />
              <FieldInput
                label="Price"
                description="Display string with separators, e.g. '14,500'."
                value={pkg.price}
                onChange={(price) => update({ price })}
                placeholder="14,500"
              />
            </div>
            <FieldInput
              label="From line"
              description="Pricing qualifier shown below the price."
              value={pkg.from}
              onChange={(from) => update({ from })}
              placeholder="From \u00b7 per person"
            />
            <FieldBoolean
              label="Featured"
              description="Red-bordered highlight. Typically used on the middle tier."
              value={pkg.featured}
              onChange={(featured) => update({ featured })}
            />
            <FieldList
              label="Features"
              value={pkg.features}
              onChange={(features) => update({ features })}
              placeholder="What's included"
              addLabel="+ Add feature"
            />
          </>
        )}
      />
    </>
  )
}
