'use client'

import type { SectionFooter, SocialLink, SocialPlatform } from '@/types/brochure'
import { FieldInput, FieldTextarea, FieldSelect, FieldObjectArray } from '../fields'
import { nanokey } from '@/lib/nanokey'

type Props = {
  section: SectionFooter
  onChange: (update: Partial<SectionFooter>) => void
}

const PLATFORM_OPTIONS: { value: SocialPlatform; label: string }[] = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
]

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  x: 'X (Twitter)',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

export function FooterEditor({ section, onChange }: Props) {
  return (
    <>
      <div className="field-section-heading">Legal</div>
      <FieldTextarea
        label="Legal / copyright"
        description="Shown left-aligned on the footer bar."
        value={section.legal}
        onChange={(legal) => onChange({ legal })}
        rows={2}
        placeholder="© 2026 Grand Prix Grand Tours. All rights reserved."
      />

      <div className="field-section-heading">Contact</div>
      <div className="field-row-2">
        <FieldInput
          label="Contact email"
          description="Displayed as a mailto link."
          value={section.email}
          onChange={(email) => onChange({ email })}
          placeholder="info@grandprixgrandtours.com"
        />
        <FieldInput
          label="Contact phone"
          description="Displayed as a tel link."
          value={section.phone}
          onChange={(phone) => onChange({ phone })}
          placeholder="+44 20 1234 5678"
        />
      </div>

      <div className="field-section-heading">Social</div>
      <FieldObjectArray<SocialLink>
        label="Social links"
        description="Rendered as platform icons on the right of the bar."
        value={section.socials}
        onChange={(socials) => onChange({ socials })}
        createNew={() => ({ _key: nanokey(), platform: 'instagram', href: '' })}
        itemTitle={(_, item) => PLATFORM_LABELS[item.platform] || 'Social'}
        addLabel="+ Add social link"
        renderItem={(item, update) => (
          <>
            <FieldSelect
              label="Platform"
              description="Choose the social network."
              value={item.platform}
              onChange={(platform) => update({ platform: platform as SocialPlatform })}
              options={PLATFORM_OPTIONS}
            />
            <FieldInput
              label="URL"
              description="Full profile URL including https://."
              value={item.href}
              onChange={(href) => update({ href })}
              placeholder="https://instagram.com/grandprixgrandtours"
            />
          </>
        )}
      />
    </>
  )
}
