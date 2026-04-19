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
      <FieldInput
        label="Title"
        value={section.title}
        onChange={(title) => onChange({ title })}
      />
      <FieldObjectArray<Tier>
        label="Packages"
        description="Up to 3 render clearly; a 4th will be cramped."
        value={section.packages}
        onChange={(packages) => onChange({ packages })}
        maxItems={4}
        addLabel="+ Add package"
        itemTitle={(i, p) => (p.name ? `${p.tier ? p.tier + ' · ' : ''}${p.name}` : `Package ${String(i + 1).padStart(2, '0')}`)}
        createNew={() => ({
          _key: nanokey(),
          tier: '',
          name: '',
          currency: '£',
          price: '',
          from: 'From · per person',
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
              description="Small label above the name, e.g. “Essential”, “Popular”, “Exclusive”."
              value={pkg.tier}
              onChange={(tier) => update({ tier })}
            />
            <FieldInput
              label="Name"
              value={pkg.name}
              onChange={(name) => update({ name })}
            />
            <FieldInput
              label="Currency"
              value={pkg.currency}
              onChange={(currency) => update({ currency })}
            />
            <FieldInput
              label="Price"
              description="As a display string so thousands separators are preserved, e.g. “14,500”."
              value={pkg.price}
              onChange={(price) => update({ price })}
            />
            <FieldInput
              label="From line"
              value={pkg.from}
              onChange={(from) => update({ from })}
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
