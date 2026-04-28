'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Annotation, AnnotationKind, BrochureTheme, CustomColor, FontOverrides, SanityImage } from '@/types/brochure'

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
  backgroundColor?: string
  textColor?: string
  fontOverrides?: FontOverrides
  customColors?: CustomColor[]
  logo?: SanityImage
  theme: BrochureTheme
  /** True when rendered inside the admin editor preview. Section components
   *  use this to keep authoring affordances (numbered placeholders for empty
   *  gallery slots, etc.) that should not appear on the public site. */
  editorMode?: boolean
  /** Editor-only: request to enter map edit mode. Called when the circuit
   *  SVG is clicked while not yet in map edit mode. */
  onRequestMapEdit?: () => void
  /** Editor-only: per-element SVG recolouring state. When `active` is true and
   *  `targetSectionKey` matches the section currently being edited, that
   *  section attaches click handlers to its recolourable SVG elements and
   *  reports clicks via `onElementClick`. The `multi` flag is true when the
   *  user held Cmd/Ctrl/Shift while clicking — used by the editor to toggle
   *  the element in/out of a multi-select. `selectedIds` is the current
   *  selection, surfaced so sections can outline the selected elements.
   *  Public reader leaves all of this undefined. */
  recolor?: {
    active: boolean
    targetSectionKey: string | null
    selectedIds: string[]
    onElementClick: (
      sectionKey: string,
      elementId: string,
      x: number,
      y: number,
      multi: boolean,
    ) => void
  }
  /** Editor-only: annotation editing state for circuit map sections. */
  annotations?: {
    selectedKey: string | null
    onSelect: (key: string | null) => void
    onMove: (sectionKey: string, annotationKey: string, x: number, y: number) => void
    onTransform: (sectionKey: string, annotationKey: string, update: { rotation?: number; scale?: number }) => void
    onUpdate: (sectionKey: string, annotationKey: string, update: Record<string, unknown>) => void
    pendingKind: AnnotationKind | null
    onPlaceNew: (sectionKey: string, x: number, y: number) => void
    onAddAnnotation: (sectionKey: string, annotation: Annotation) => void
  }
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
