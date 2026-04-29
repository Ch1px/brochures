import type { CSSProperties } from 'react'
import type { TextScalePreset } from '@/types/brochure'

/**
 * Multipliers for each text-size preset. Applied via CSS custom properties
 * that wrap existing `clamp()` font-size values:
 *   font-size: calc(var(--title-scale, 1) * clamp(…))
 */
const SCALE_MAP: Record<TextScalePreset, number> = {
  xs: 0.7,
  s: 0.85,
  m: 1,
  l: 1.15,
  xl: 1.3,
}

/**
 * Returns CSS custom properties for brochure-wide text scaling.
 * Follows the same pattern as `accentColorVars()` — spread onto the brochure
 * root element in both `BrochureReader` and `PreviewStage`.
 *
 * Returns `undefined` when all scales are default (M) so no extra properties
 * are injected.
 */
export function textScaleVars(brochure: {
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  taglineScale?: TextScalePreset
}): CSSProperties | undefined {
  const vars: Record<string, string> = {}

  if (brochure.titleScale && brochure.titleScale !== 'm') {
    vars['--title-scale'] = String(SCALE_MAP[brochure.titleScale])
  }
  if (brochure.eyebrowScale && brochure.eyebrowScale !== 'm') {
    vars['--eyebrow-scale'] = String(SCALE_MAP[brochure.eyebrowScale])
  }
  if (brochure.taglineScale && brochure.taglineScale !== 'm') {
    vars['--tagline-scale'] = String(SCALE_MAP[brochure.taglineScale])
  }

  return Object.keys(vars).length > 0 ? (vars as unknown as CSSProperties) : undefined
}
