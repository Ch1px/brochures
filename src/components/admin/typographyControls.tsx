'use client'

import type { ReactNode } from 'react'
import type { CustomFont } from '@/types/brochure'
import {
  fontOptionsForRole,
  weightOptionsForRole,
  fontFamilyForSlug,
  googleFontsUrlForSlug,
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
}: FontCardProps) {
  const family = fontFamilyForSlug(fontSlug, role, customFonts)
  const weight = fontWeight || undefined
  const transform = previewTransform || (previewUppercase ? 'uppercase' : undefined)

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
          options={fontOptionsForRole(role, customFonts)}
        />
        <FieldSelect
          label="Weight"
          value={fontWeight ?? ''}
          onChange={onWeightChange}
          options={weightOptionsForRole(role, fontSlug, customFonts)}
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
