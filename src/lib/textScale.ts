import type { CSSProperties } from 'react'
import type { TextScalePreset } from '@/types/brochure'
import { SCALE_MAP } from './fontPalette'

// Re-export for consumers that import from here
export { SCALE_MAP }

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
