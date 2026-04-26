'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { BrochureTheme, SanityImage } from '@/types/brochure'

/**
 * Lightweight context for brochure-wide branding values that descendant
 * sections need to read directly (without prop-drilling through
 * SectionRenderer / AnimatedSection).
 *
 * Currently only `accentColor` has a real consumer (CircuitMap, which
 * re-themes its SVG using the brochure accent at render time). `logo`
 * and `theme` are exposed for completeness so future consumers don't
 * need a second context.
 */

export type BrochureBranding = {
  accentColor?: string
  logo?: SanityImage
  theme: BrochureTheme
  /** True when rendered inside the admin editor preview. Section components
   *  use this to keep authoring affordances (numbered placeholders for empty
   *  gallery slots, etc.) that should not appear on the public site. */
  editorMode?: boolean
}

const DEFAULT_BRANDING: BrochureBranding = { theme: 'dark' }

const BrochureBrandingContext = createContext<BrochureBranding>(DEFAULT_BRANDING)

export function BrochureBrandingProvider({
  value,
  children,
}: {
  value: BrochureBranding
  children: ReactNode
}) {
  return (
    <BrochureBrandingContext.Provider value={value}>{children}</BrochureBrandingContext.Provider>
  )
}

export function useBrochureBranding(): BrochureBranding {
  return useContext(BrochureBrandingContext)
}
