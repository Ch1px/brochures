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
      <FieldTextarea
        label="Legal / copyright"
        description="Shown left-aligned on the footer bar."
        value={section.legal}
        onChange={(legal) => onChange({ legal })}
        rows={2}
      />
      <FieldInput
        label="Contact email"
        value={section.email}
        onChange={(email) => onChange({ email })}
      />
      <FieldInput
        label="Contact phone"
        value={section.phone}
        onChange={(phone) => onChange({ phone })}
      />
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
              value={item.platform}
              onChange={(platform) => update({ platform: platform as SocialPlatform })}
              options={PLATFORM_OPTIONS}
            />
            <FieldInput
              label="URL"
              value={item.href}
              onChange={(href) => update({ href })}
            />
          </>
        )}
      />
    </>
  )
}
