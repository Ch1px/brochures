'use client'

import type { ReactNode } from 'react'
import type { CustomFont } from '@/types/brochure'
import {
  fontOptionsForRole,
  weightOptionsForRole,
  fontFamilyForSlug,
  fontLabelForSlug,
  googleFontsUrlForSlug,
  WEIGHT_LABELS,
} from '@/lib/fontPalette'
import { FieldSelect } from './fields/FieldSelect'

/**
 * Shared typography UI used by both the brochure-level settings modal and
 * the company-level settings modal. Kept dependency-free of the rest of the
 * settings UI so callers can mount it inside any tabbed layout.
 */

/** Injects <link> tags for any Google Fonts needed by the current selections. */
export function FontPreviewLinks({ slugs }: { slugs: (string | undefined)[] }) {
  const urls = slugs
    .map((s) => googleFontsUrlForSlug(s))
    .filter((u): u is string => u !== null)
  const unique = [...new Set(urls)]
  return (
    <>
      {unique.map((url) => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
    </>
  )
}

export type FontCardProps = {
  role: string
  label: string
  description: string
  previewText: string
  previewSize: number
  previewItalic?: boolean
  previewUppercase?: boolean
  previewTransform?: string | undefined
  fontSlug: string | undefined
  fontWeight: string | undefined
  customFonts?: CustomFont[] | null
  onFontChange: (slug: string) => void
  onWeightChange: (weight: string) => void
  extraControls?: ReactNode
  /** When set, the empty option in the Family / Weight selects is relabelled
   *  "Inherit from {inheritFromName} ({inheritedFamily/weight})" so admins
   *  understand that picking it clears their override and falls back to the
   *  host company's default. */
  inheritFromName?: string
  inheritedFamilySlug?: string
  inheritedWeight?: string
}

export function FontCard({
  role,
  label,
  description,
  previewText,
  previewSize,
  previewItalic,
  previewUppercase,
  previewTransform,
  fontSlug,
  fontWeight,
  customFonts,
  onFontChange,
  onWeightChange,
  extraControls,
  inheritFromName,
  inheritedFamilySlug,
  inheritedWeight,
}: FontCardProps) {
  // The dropdowns reflect ONLY the brochure-level override — when undefined
  // they snap to the empty "Inherit from {Company}" option so admins can
  // tell at a glance whether their value is overriding the company default.
  // The preview text uses the effective (merged) font/weight so it visually
  // matches what the brochure renders.
  const effectiveSlug = fontSlug ?? inheritedFamilySlug
  const effectiveWeight = fontWeight ?? inheritedWeight
  const family = fontFamilyForSlug(effectiveSlug, role, customFonts)
  const weight = effectiveWeight || undefined
  const transform = previewTransform || (previewUppercase ? 'uppercase' : undefined)

  // Build options; rewrite the empty (clear-override) option to advertise the
  // company-inherited value when one exists, so admins discover that picking
  // it falls back to the company default rather than the platform default.
  const familyOptions = (() => {
    const base = fontOptionsForRole(role, customFonts)
    if (inheritFromName && inheritedFamilySlug) {
      const inheritedLabel = fontLabelForSlug(inheritedFamilySlug, customFonts) ?? inheritedFamilySlug
      return [
        { value: '', label: `Inherit from ${inheritFromName} (${inheritedLabel})` },
        ...base.slice(1),
      ]
    }
    return base
  })()
  const weightOptions = (() => {
    const base = weightOptionsForRole(role, fontSlug, customFonts)
    if (inheritFromName && inheritedWeight) {
      const inheritedLabel = WEIGHT_LABELS[inheritedWeight] ?? inheritedWeight
      return [
        { value: '', label: `Inherit from ${inheritFromName} (${inheritedLabel})` },
        ...base.slice(1),
      ]
    }
    return base
  })()

  return (
    <div className="font-card">
      <div
        className="font-card-preview"
        style={{
          fontFamily: family,
          fontWeight: weight,
          fontSize: previewSize,
          fontStyle: previewItalic ? 'italic' : undefined,
          textTransform: transform as React.CSSProperties['textTransform'],
          letterSpacing: transform === 'uppercase' ? '0.12em' : undefined,
        }}
      >
        {previewText}
      </div>
      <div className="font-card-meta">
        <span className="font-card-label">{label}</span>
        <span className="font-card-desc">{description}</span>
      </div>
      <div className="font-card-controls">
        <FieldSelect
          label="Family"
          value={fontSlug ?? ''}
          onChange={onFontChange}
          options={familyOptions}
        />
        <FieldSelect
          label="Weight"
          value={fontWeight ?? ''}
          onChange={onWeightChange}
          options={weightOptions}
        />
        {extraControls}
      </div>
    </div>
  )
}

/** Shared scale-preset options for type-scale selectors. */
export const SCALE_OPTIONS = [
  { value: 'xxs', label: 'XXS — Tiny' },
  { value: 'xs', label: 'XS — Compact' },
  { value: 's', label: 'S — Small' },
  { value: 'm', label: 'M — Default' },
  { value: 'l', label: 'L — Large' },
  { value: 'xl', label: 'XL — Extra Large' },
]
