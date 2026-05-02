'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Annotation, AnnotationKind, BrochureTheme, CircuitDrawing, CustomColor, FontOverrides, SanityImage } from '@/types/brochure'

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
  titleColor?: string
  fontOverrides?: FontOverrides
  customColors?: CustomColor[]
  logo?: SanityImage
  theme: BrochureTheme
  /** Resolved (brochure-or-company) text transforms for title and eyebrow.
   *  Section components feed their title/eyebrow text through
   *  `useNormalisedTitle` / `useNormalisedEyebrow` so that the visible casing
   *  matches the chosen transform — in particular, `capitalize` requires
   *  lowercase input (CSS `text-transform: capitalize` only upper-cases the
   *  first letter of each word and leaves existing caps untouched). */
  titleTransform?: string
  eyebrowTransform?: string
  /** True when rendered inside the admin editor preview. Section components
   *  use this to keep authoring affordances (numbered placeholders for empty
   *  gallery slots, etc.) that should not appear on the public site. */
  editorMode?: boolean
  /** True when rendered for the offline HTML export (`/[slug]/static-export`).
   *  Section components use this to disable runtime-only behaviour such as
   *  lazy-loaded videos — the offline file has no React runtime to attach
   *  src after mount, and media URLs are aborted by Puppeteer anyway. The
   *  poster image (`.media-bg-layer`) takes the video's place. */
  staticExport?: boolean
  /** True when rendered as a thumbnail (admin library mini preview). Section
   *  components use this to skip expensive runtime media (video, parallax,
   *  IntersectionObservers) — the user only needs a static visual, not a
   *  playing one. */
  thumbnail?: boolean
  /** Editor-only: inline text edit from the preview. Called when the user
   *  commits an inline edit (blur or Escape). */
  onInlineEdit?: (sectionKey: string, fieldPath: string, value: string) => void
  /** Editor-only: inline media replace/remove from the preview. Accepts any
   *  value type (SanityImage, SanityFile, undefined for remove). */
  onInlineMediaEdit?: (sectionKey: string, fieldPath: string, value: unknown) => void
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
    /** Tool setter — used by the on-stage toolbar to switch tools without a
     *  round-trip through the right panel. Pass null for the Select tool. */
    onSetPendingKind: (kind: AnnotationKind | null) => void
    onPlaceNew: (sectionKey: string, x: number, y: number) => void
    onAddAnnotation: (sectionKey: string, annotation: Annotation) => void
    /** Free-hand drawings are stored separately from annotations and baked
     *  into the circuit SVG at render time so they scale with the map. */
    onAddDrawing: (sectionKey: string, drawing: CircuitDrawing) => void
    /** Selected drawing key — for direct manipulation on the stage. */
    selectedDrawingKey: string | null
    onSelectDrawing: (key: string | null) => void
    onUpdateDrawing: (sectionKey: string, drawingKey: string, update: Partial<CircuitDrawing>) => void
    onDeleteDrawing: (sectionKey: string, drawingKey: string) => void
    /** When `pendingKind === 'draw'`, which sub-tool and stroke style to use. */
    drawTool: 'freehand' | 'line'
    drawStyle: 'solid' | 'dashed' | 'dotted'
    onSetDrawTool: (tool: 'freehand' | 'line') => void
    onSetDrawStyle: (style: 'solid' | 'dashed' | 'dotted') => void
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

/**
 * Pre-process a title string so CSS `text-transform: capitalize` produces
 * proper title case ("Monaco Grand Prix") even when the source was typed in
 * ALL CAPS. CSS capitalize only upper-cases the first letter of each word —
 * it does NOT lower-case the rest — so we lower-case the source ourselves
 * for that specific transform. All other transforms pass through unchanged
 * because CSS `uppercase` / `lowercase` / `none` work as expected.
 *
 * Non-destructive: only affects render output. The Sanity field keeps the
 * admin's typed casing. (One caveat: editing inline while in capitalize mode
 * shows the lower-cased text in the contentEditable, and saves what the
 * admin sees — same UX as if they had typed in lowercase.)
 *
 * Returns a normaliser function so a single hook call can be reused inside
 * loops (per-card titles, etc.) without violating hook rules.
 */
export function useTitleNormaliser(): (text: string | undefined) => string {
  const { titleTransform } = useContext(BrochureBrandingContext)
  return (text) => {
    if (!text) return ''
    if (titleTransform === 'capitalize') return text.toLowerCase()
    return text
  }
}

/** As `useTitleNormaliser`, but reads the brochure-level eyebrow transform. */
export function useEyebrowNormaliser(): (text: string | undefined) => string {
  const { eyebrowTransform } = useContext(BrochureBrandingContext)
  return (text) => {
    if (!text) return ''
    if (eyebrowTransform === 'capitalize') return text.toLowerCase()
    return text
  }
}
