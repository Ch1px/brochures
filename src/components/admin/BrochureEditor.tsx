'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Annotation,
  AnnotationKind,
  Brochure,
  BrochureStatus,
  CircuitDrawing,
  ColorOverride,
  SanityImage,
  Section,
  SectionCircuitMap,
} from '@/types/brochure'
import { useAutosave } from '@/hooks/useAutosave'
import { useBrochureHistory } from '@/hooks/useBrochureHistory'
import { useEditorLayout } from '@/hooks/useEditorLayout'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'
import { labelFor } from '@/lib/sectionLabels'
import { cloneWithNewKeys, nanokey } from '@/lib/nanokey'
import { applyFieldPath } from '@/lib/applyFieldPath'
import { sectionDefaults } from '@/lib/sectionDefaults'
import { resolvedAccentColor } from '@/lib/brochureBranding'
import { EditorTopbar } from './EditorTopbar'
import { PagesPanel } from './PagesPanel'
import { PreviewStage } from './PreviewStage'
import { AddSectionModal } from './AddSectionModal'
import { PropertiesPanel } from './PropertiesPanel'
import { BrochureSettingsModal } from './BrochureSettingsModal'
import { RecolorPopover } from './RecolorPopover'
import { SaveToast } from './SaveToast'
import { CollapseButton, CollapsedRail, ResizeHandle } from './EditorLayoutControls'
import { LiveblocksProvider, RoomProvider, roomIdForBrochure } from '@/lib/liveblocks'
import { PeerPresenceProvider } from './PeerPresenceProvider'

/**
 * Section types that expose image-treatment controls (overlay, greyscale,
 * blur). Used by the bulk "Apply to all" action to avoid writing the four
 * fields onto sections that don't render any image (logos, stats, footer,
 * itinerary, textCenter, ctaBanner, circuitMap).
 */
const IMAGE_TREATMENT_TYPES = new Set<string>([
  'cover',
  'coverCentered',
  'intro',
  'contentImage',
  'imageContent',
  'sectionHeading',
  'sectionHeadingCentered',
  'features',
  'imageHero',
  'packages',
  'galleryEditorial',
  'galleryGrid',
  'galleryDuo',
  'galleryHero',
  'quoteProfile',
  'closing',
  'spotlight',
  'linkedCards',
])

/**
 * Per-type bulk-apply groups. Each group is a set of `_type` values that
 * are conceptually "the same kind of section" — variants are grouped
 * together (cover + coverCentered, contentImage + imageContent).
 * The label is used in the button text (e.g. "Apply to all section
 * headings") so it should read as a plural noun.
 */
const IMAGE_TREATMENT_GROUPS: Array<{ types: string[]; label: string }> = [
  { types: ['cover', 'coverCentered'], label: 'covers' },
  { types: ['sectionHeading', 'sectionHeadingCentered'], label: 'section headings' },
  { types: ['contentImage', 'imageContent'], label: 'split sections' },
  { types: ['intro'], label: 'intros' },
  { types: ['features'], label: 'features sections' },
  { types: ['imageHero'], label: 'image heroes' },
  { types: ['packages'], label: 'packages sections' },
  { types: ['galleryEditorial'], label: 'editorial galleries' },
  { types: ['galleryGrid'], label: 'grid galleries' },
  { types: ['galleryDuo'], label: 'duo galleries' },
  { types: ['galleryHero'], label: 'hero galleries' },
  { types: ['quoteProfile'], label: 'quote profiles' },
  { types: ['closing'], label: 'closings' },
  { types: ['spotlight'], label: 'spotlights' },
  { types: ['linkedCards'], label: 'linked-card sections' },
]

function findImageTreatmentGroup(type: string) {
  return IMAGE_TREATMENT_GROUPS.find((g) => g.types.includes(type)) ?? null
}

export type CompanyOption = {
  _id: string
  name: string
  domain: string
  accentColor?: string
  logo?: SanityImage
}

type Props = {
  initialBrochure: Brochure
  companies: CompanyOption[]
  /** When true, the editor wraps itself in a Liveblocks room so the
   *  topbar can show peer-presence avatars. Server determines this
   *  from `LIVEBLOCKS_SECRET_KEY` — without the key the editor still
   *  loads, the avatar stack just doesn't render. */
  liveblocksEnabled: boolean
}

/**
 * The admin brochure editor.
 *
 * Layout:
 *   [ topbar                             ]
 *   [ pages ] [  preview stage ] [ props ]
 *
 * Panels:
 *   2A ✓ — shell, topbar, autosave
 *   2B ✓ — PagesPanel (left)
 *   2C ✓ — PreviewStage (center)
 *   2D ✓ — AddSectionModal
 *   2E.1 ✓ — PropertiesPanel shell + 6 simple editors (covers 9 _type values)
 *   2E.2 — PropertiesPanel complex editors (features, stats, packages, itinerary, galleries, quote, circuit)
 *   2F — image/SVG upload integration
 */
export function BrochureEditor(props: Props) {
  const { liveblocksEnabled, initialBrochure } = props
  if (!liveblocksEnabled) return <BrochureEditorInner {...props} />
  return (
    <LiveblocksProvider>
      <RoomProvider
        id={roomIdForBrochure(initialBrochure._id)}
        initialPresence={{ cursor: null, selectedSectionKey: null, currentPageKey: null }}
      >
        <BrochureEditorInner {...props} />
      </RoomProvider>
    </LiveblocksProvider>
  )
}

function BrochureEditorInner({ initialBrochure, companies, liveblocksEnabled }: Props) {
  const { brochure, setBrochure, undo, redo } = useBrochureHistory(initialBrochure)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [currentSectionKey, setCurrentSectionKey] = useState<string | null>(null)

  // Track which page we're adding a section to; null = modal closed
  const [addSectionForPage, setAddSectionForPage] = useState<number | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Recolour mode: when on, clicks inside the active circuit-map SVG report
  // back here so we can show the picker popover. State lives at the editor
  // root because the popover renders outside the right panel and the clicks
  // originate inside the centre preview stage. `selection` tracks the set of
  // elements currently being recoloured (multi-select via Cmd/Ctrl/Shift).
  const [recolorMode, setRecolorMode] = useState(false)
  const [recolorSelection, setRecolorSelection] = useState<{
    sectionKey: string
    elementIds: string[]
    x: number
    y: number
  } | null>(null)

  // Reset the popover when the user navigates to a different section. We
  // intentionally LEAVE recolorMode alone — admins flipping between sections
  // shouldn't have to keep re-toggling the mode.
  useEffect(() => {
    setRecolorSelection(null)
  }, [currentSectionKey])

  // Close the popover whenever recolour mode is turned off so a stale picker
  // doesn't sit around after clicks have stopped routing to it.
  useEffect(() => {
    if (!recolorMode) setRecolorSelection(null)
  }, [recolorMode])

  // Disable recolour mode automatically if the active section isn't a
  // circuit-map (the toggle has no meaning elsewhere).
  useEffect(() => {
    if (!currentSectionKey) {
      setRecolorMode(false)
      return
    }
    const section = brochure.pages
      .flatMap((p) => p.sections)
      .find((s) => s._key === currentSectionKey)
    if (!section || section._type !== 'circuitMap') {
      setRecolorMode(false)
    }
  }, [brochure.pages, currentSectionKey])

  // ───────── Map edit mode (recolour + annotations) ─────────
  // Auto-on whenever the selected section is a circuit map. The on-stage
  // toolbar replaces the explicit "Edit map" button; admins go straight to
  // editing without a separate mode toggle.
  const [selectedAnnotationKey, setSelectedAnnotationKey] = useState<string | null>(null)
  const [selectedDrawingKey, setSelectedDrawingKey] = useState<string | null>(null)
  const [pendingAnnotationKind, setPendingAnnotationKind] = useState<AnnotationKind | null>(null)
  const [drawTool, setDrawTool] = useState<'freehand' | 'line'>('freehand')
  const [drawStyle, setDrawStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid')

  // True when the currently-selected section is a circuit map. Drives the
  // floating toolbar visibility and the (always-on) recolour click delegate.
  const mapEditMode = useMemo(() => {
    if (!currentSectionKey) return false
    const section = brochure.pages
      .flatMap((p) => p.sections)
      .find((s) => s._key === currentSectionKey)
    return section?._type === 'circuitMap'
  }, [brochure.pages, currentSectionKey])

  // Reset all section-scoped tool state when switching sections so a Draw or
  // Add tool from the previous map doesn't follow the user across.
  useEffect(() => {
    setRecolorMode(false)
    setSelectedAnnotationKey(null)
    setSelectedDrawingKey(null)
    setPendingAnnotationKind(null)
  }, [currentSectionKey])

  // Recolour is the default click behaviour while on a circuit map. Disabled
  // only while an Add tool is pending (so clicks fall through to the overlay
  // for placement) or while drawing (DrawingCanvas owns clicks).
  useEffect(() => {
    if (!mapEditMode) {
      setRecolorMode(false)
      setRecolorSelection(null)
      return
    }
    setRecolorMode(pendingAnnotationKind === null)
  }, [mapEditMode, pendingAnnotationKind])


  // Move an annotation (called from drag handler)
  const handleAnnotationMove = useCallback(
    (sectionKey: string, annotationKey: string, x: number, y: number) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return {
              ...cm,
              annotations: (cm.annotations ?? []).map((a) =>
                a._key === annotationKey ? { ...a, x, y } : a,
              ),
            } as Section
          }),
        })),
      }))
    },
    [],
  )

  const handleAnnotationTransform = useCallback(
    (sectionKey: string, annotationKey: string, update: { rotation?: number; scale?: number }) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return {
              ...cm,
              annotations: (cm.annotations ?? []).map((a) =>
                a._key === annotationKey ? { ...a, ...update } : a,
              ),
            } as Section
          }),
        })),
      }))
    },
    [],
  )

  // Generic annotation field update (used by inline text editing etc.)
  const handleAnnotationUpdate = useCallback(
    (sectionKey: string, annotationKey: string, update: Record<string, unknown>) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return {
              ...cm,
              annotations: (cm.annotations ?? []).map((a) =>
                a._key === annotationKey ? { ...a, ...update } : a,
              ),
            } as Section
          }),
        })),
      }))
    },
    [],
  )

  // Place a new annotation at click coordinates
  const handlePlaceNewAnnotation = useCallback(
    (sectionKey: string, x: number, y: number) => {
      const kind = pendingAnnotationKind
      if (!kind || kind === 'draw') return
      const key = nanokey()
      let newAnnotation: Annotation
      if (kind === 'text') {
        newAnnotation = { _key: key, kind: 'text', x, y, label: 'Label' }
      } else if (kind === 'image') {
        newAnnotation = { _key: key, kind: 'image', x, y }
      } else if (kind === 'svg') {
        newAnnotation = { _key: key, kind: 'svg', x, y }
      } else {
        newAnnotation = { _key: key, kind: 'pin', x, y, icon: 'pin' }
      }
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return { ...cm, annotations: [...(cm.annotations ?? []), newAnnotation] } as Section
          }),
        })),
      }))
      setSelectedAnnotationKey(key)
      setPendingAnnotationKind(null)
    },
    [pendingAnnotationKind],
  )

  // Insert a fully-formed annotation (used by drawing tool)
  const handleAddAnnotation = useCallback(
    (sectionKey: string, annotation: Annotation) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return { ...cm, annotations: [...(cm.annotations ?? []), annotation] } as Section
          }),
        })),
      }))
      setSelectedAnnotationKey(annotation._key)
    },
    [],
  )

  const handleAddDrawing = useCallback(
    (sectionKey: string, drawing: CircuitDrawing) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return { ...cm, drawings: [...(cm.drawings ?? []), drawing] } as Section
          }),
        })),
      }))
    },
    [],
  )

  const handleUpdateDrawing = useCallback(
    (sectionKey: string, drawingKey: string, update: Partial<CircuitDrawing>) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return {
              ...cm,
              drawings: (cm.drawings ?? []).map((d) =>
                d._key === drawingKey ? { ...d, ...update } : d,
              ),
            } as Section
          }),
        })),
      }))
    },
    [],
  )

  const handleDeleteDrawing = useCallback(
    (sectionKey: string, drawingKey: string) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            return {
              ...cm,
              drawings: (cm.drawings ?? []).filter((d) => d._key !== drawingKey),
            } as Section
          }),
        })),
      }))
    },
    [],
  )

  const { status: saveStatus, flushNow } = useAutosave(brochure)

  const layout = useEditorLayout()

  // Resolve the currently-selected section from the brochure tree
  const currentSection = useMemo<Section | null>(() => {
    if (!currentSectionKey) return null
    for (const page of brochure.pages) {
      const found = page.sections.find((s) => s._key === currentSectionKey)
      if (found) return found
    }
    return null
  }, [brochure.pages, currentSectionKey])

  // Brochure-level accent with company-branding fallback. Section editors
  // (Styles tab, Recolor popover) read this so their "fallback" swatch tracks
  // whatever the brochure currently inherits from its host company.
  const effectiveAccent = resolvedAccentColor(brochure)

  const handleTitleChange = useCallback((title: string) => {
    setBrochure((prev) => ({ ...prev, title }))
  }, [])

  const handleStatusChange = useCallback((status: BrochureStatus, rev?: string) => {
    setBrochure((prev) => ({ ...prev, status, ...(rev ? { _rev: rev } : null) }))
  }, [])

  const handleFeatureChange = useCallback((featured: boolean, rev?: string) => {
    setBrochure((prev) => ({ ...prev, featured, ...(rev ? { _rev: rev } : null) }))
  }, [])

  const updateBrochure = useCallback(
    (updater: (prev: Brochure) => Brochure) => {
      setBrochure(updater)
    },
    []
  )

  const handleRequestAddSection = useCallback((pageIndex: number) => {
    setAddSectionForPage(pageIndex)
  }, [])

  const handlePickSectionType = useCallback(
    (type: Section['_type']) => {
      const pageIndex = addSectionForPage
      if (pageIndex == null) return
      const newSection = sectionDefaults(type)
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((p, i) =>
          i === pageIndex ? { ...p, sections: [...p.sections, newSection] } : p
        ),
      }))
      setCurrentPageIndex(pageIndex)
      setCurrentSectionKey(newSection._key)
    },
    [addSectionForPage]
  )

  // Merge a partial update into the currently-selected section.
  // This is the single write path for all field edits in the properties panel.
  const handleSectionChange = useCallback(
    (update: Partial<Section>) => {
      if (!currentSectionKey) return
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) =>
            s._key === currentSectionKey ? ({ ...s, ...update } as Section) : s
          ),
        })),
      }))
    },
    [currentSectionKey]
  )

  // Bulk-apply the four image-treatment fields (overlay strength + colour,
  // greyscale, blur) from the current section to every other image-bearing
  // section in the brochure. Raw values are propagated — undefined included —
  // so the source section becomes the single source of truth.
  //
  // Optional `typeFilter` narrows the action to a specific group of section
  // types (e.g. all section-heading variants). When omitted, every
  // image-bearing section is updated.
  //
  // Spotlight is a special case: it has independent foreground-image fields
  // that don't fall back to the section-level vars. To keep "Apply to all"
  // visually consistent, the bulk action mirrors the four values onto the
  // foreground fields too. Admins who want a different foreground treatment
  // can override it after via the Spotlight section's Styles tab.
  const handleApplyImageTreatmentToAll = useCallback(
    (
      treatment: {
        overlayStrength?: string
        overlayColor?: string
        mediaGrayscale?: string
        mediaBlur?: string
      },
      typeFilter?: string[],
    ) => {
      const allowed = typeFilter ? new Set(typeFilter) : null
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (!IMAGE_TREATMENT_TYPES.has(s._type)) return s
            if (allowed && !allowed.has(s._type)) return s
            if (s._type === 'spotlight') {
              return {
                ...s,
                ...treatment,
                foregroundOverlayStrength: treatment.overlayStrength,
                foregroundOverlayColor: treatment.overlayColor,
                foregroundMediaGrayscale: treatment.mediaGrayscale,
                foregroundMediaBlur: treatment.mediaBlur,
              } as Section
            }
            return { ...s, ...treatment } as Section
          }),
        })),
      }))
    },
    [setBrochure]
  )

  // Inline text edit from the preview stage — applies a field path update
  const handleInlineEdit = useCallback(
    (sectionKey: string, fieldPath: string, value: string) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) =>
            s._key === sectionKey ? applyFieldPath(s, fieldPath, value) : s
          ),
        })),
      }))
    },
    [],
  )

  // Inline media edit (image/video replace/remove) from the preview stage
  const handleInlineMediaEdit = useCallback(
    (sectionKey: string, fieldPath: string, value: unknown) => {
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) =>
            s._key === sectionKey ? applyFieldPath(s, fieldPath, value) : s
          ),
        })),
      }))
    },
    [],
  )

  // Click handler reported up from CircuitMap when the admin clicks a
  // recolourable element. Plain click → replaces selection with [id]. Click
  // with modifier (Cmd / Ctrl / Shift) → toggles id in the current selection,
  // letting the admin recolour multiple elements with a single colour pick.
  const handleRecolorElementClick = useCallback(
    (sectionKey: string, elementId: string, x: number, y: number, multi: boolean) => {
      setRecolorSelection((prev) => {
        if (multi && prev && prev.sectionKey === sectionKey) {
          const exists = prev.elementIds.includes(elementId)
          const nextIds = exists
            ? prev.elementIds.filter((id) => id !== elementId)
            : [...prev.elementIds, elementId]
          if (nextIds.length === 0) return null
          // Keep the popover anchored at the original click point so the UI
          // doesn't jump around as the user multi-selects.
          return { ...prev, elementIds: nextIds }
        }
        return { sectionKey, elementIds: [elementId], x, y }
      })
    },
    []
  )

  // Resolve the override value (if any) shared by every selected element. If
  // they have differing or no overrides, return undefined so the picker
  // starts from the fallback colour.
  const recolorPopoverValue = useMemo(() => {
    if (!recolorSelection) return undefined
    const section = brochure.pages
      .flatMap((p) => p.sections)
      .find((s) => s._key === recolorSelection.sectionKey)
    if (!section || section._type !== 'circuitMap') return undefined
    const overrides = section.colorOverrides ?? []
    const colors = recolorSelection.elementIds.map(
      (id) => overrides.find((o) => o.elementId === id)?.color,
    )
    if (colors.length === 0) return undefined
    const first = colors[0]
    if (!first) return undefined
    return colors.every((c) => c === first) ? first : undefined
  }, [brochure.pages, recolorSelection])

  // Upsert / remove colour overrides for a list of element ids in one pass.
  // Used so a single picker change applies cleanly across a multi-selection.
  const updateOverrides = useCallback(
    (sectionKey: string, elementIds: string[], color: string | null) => {
      if (elementIds.length === 0) return
      const idSet = new Set(elementIds)
      setBrochure((prev) => ({
        ...prev,
        pages: prev.pages.map((page) => ({
          ...page,
          sections: page.sections.map((s) => {
            if (s._key !== sectionKey || s._type !== 'circuitMap') return s
            const cm = s as SectionCircuitMap
            const existing = cm.colorOverrides ?? []
            let next: ColorOverride[]
            if (color === null) {
              next = existing.filter((o) => !idSet.has(o.elementId))
            } else {
              const updated = existing.map((o) =>
                idSet.has(o.elementId) ? { ...o, color } : o,
              )
              const existingIds = new Set(existing.map((o) => o.elementId))
              const additions: ColorOverride[] = []
              elementIds.forEach((id) => {
                if (!existingIds.has(id)) {
                  additions.push({ _key: nanokey(), elementId: id, color })
                }
              })
              next = [...updated, ...additions]
            }
            return { ...cm, colorOverrides: next } as Section
          }),
        })),
      }))
    },
    []
  )

  const recolorContext = useMemo(
    () => ({
      active: mapEditMode && recolorMode,
      targetSectionKey: currentSectionKey,
      selectedIds: recolorSelection?.elementIds ?? [],
      onElementClick: handleRecolorElementClick,
    }),
    [mapEditMode, recolorMode, currentSectionKey, recolorSelection, handleRecolorElementClick]
  )

  const annotationContext = useMemo(
    () => mapEditMode ? {
      selectedKey: selectedAnnotationKey,
      onSelect: setSelectedAnnotationKey,
      onMove: handleAnnotationMove,
      onTransform: handleAnnotationTransform,
      onUpdate: handleAnnotationUpdate,
      pendingKind: pendingAnnotationKind,
      onSetPendingKind: setPendingAnnotationKind,
      onPlaceNew: handlePlaceNewAnnotation,
      onAddAnnotation: handleAddAnnotation,
      onAddDrawing: handleAddDrawing,
      selectedDrawingKey,
      onSelectDrawing: setSelectedDrawingKey,
      onUpdateDrawing: handleUpdateDrawing,
      onDeleteDrawing: handleDeleteDrawing,
      drawTool,
      drawStyle,
      onSetDrawTool: setDrawTool,
      onSetDrawStyle: setDrawStyle,
    } : undefined,
    [mapEditMode, selectedAnnotationKey, handleAnnotationMove, handleAnnotationTransform, handleAnnotationUpdate, pendingAnnotationKind, handlePlaceNewAnnotation, handleAddAnnotation, handleAddDrawing, selectedDrawingKey, handleUpdateDrawing, handleDeleteDrawing, drawTool, drawStyle]
  )

  // Recent colours used in the active circuit-map section, most-recent-first
  // and deduped. Powers the quick-pick swatches in the popover so admins can
  // re-apply a colour without dialling the picker each time.
  const recentColors = useMemo(() => {
    if (!currentSection || currentSection._type !== 'circuitMap') return []
    const cm = currentSection as SectionCircuitMap
    const seen = new Set<string>()
    const out: string[] = []
    const overrides = cm.colorOverrides ?? []
    for (let i = overrides.length - 1; i >= 0; i--) {
      const c = overrides[i]?.color?.toLowerCase()
      if (!c) continue
      if (seen.has(c)) continue
      seen.add(c)
      out.push(c)
      if (out.length >= 8) break
    }
    return out
  }, [currentSection])

  // Triggered from the CircuitMap editor's overrides list when the admin
  // clicks a swatch — selects every element currently using that colour and
  // opens the popover (centred) so they can re-recolour the whole group.
  const handlePickByColor = useCallback(
    (color: string) => {
      if (!currentSection || currentSection._type !== 'circuitMap') return
      const cm = currentSection as SectionCircuitMap
      const target = color.toLowerCase()
      const ids = (cm.colorOverrides ?? [])
        .filter((o) => o.color?.toLowerCase() === target)
        .map((o) => o.elementId)
      if (ids.length === 0) return
      setPendingAnnotationKind(null)
      setRecolorMode(true)
      const x = window.innerWidth / 2 - 140
      const y = window.innerHeight / 2 - 120
      setRecolorSelection({
        sectionKey: currentSection._key,
        elementIds: ids,
        x,
        y,
      })
    },
    [currentSection]
  )

  // ───────── Keyboard shortcut handlers ─────────

  // Flat list of every section keyed by page index, for ↑/↓ navigation that
  // wraps across page boundaries.
  const flatSections = useMemo(() => {
    const out: { pageIndex: number; sectionKey: string }[] = []
    brochure.pages.forEach((page, pageIndex) => {
      page.sections.forEach((s) => out.push({ pageIndex, sectionKey: s._key }))
    })
    return out
  }, [brochure.pages])

  const navigateSection = useCallback(
    (delta: -1 | 1) => {
      if (flatSections.length === 0) return
      const currentIdx = currentSectionKey
        ? flatSections.findIndex((s) => s.sectionKey === currentSectionKey)
        : -1
      const nextIdx =
        currentIdx === -1
          ? delta > 0
            ? 0
            : flatSections.length - 1
          : (currentIdx + delta + flatSections.length) % flatSections.length
      const target = flatSections[nextIdx]
      setCurrentPageIndex(target.pageIndex)
      setCurrentSectionKey(target.sectionKey)
    },
    [flatSections, currentSectionKey]
  )

  const duplicateCurrentSection = useCallback(() => {
    if (!currentSectionKey) return
    let newKey: string | null = null
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((page) => {
        const idx = page.sections.findIndex((s) => s._key === currentSectionKey)
        if (idx === -1) return page
        const cloned: Section = { ...cloneWithNewKeys(page.sections[idx]), _key: nanokey() }
        newKey = cloned._key
        return {
          ...page,
          sections: [
            ...page.sections.slice(0, idx + 1),
            cloned,
            ...page.sections.slice(idx + 1),
          ],
        }
      }),
    }))
    if (newKey) setCurrentSectionKey(newKey)
  }, [currentSectionKey, setBrochure])

  const deleteCurrentSection = useCallback(() => {
    if (!currentSectionKey) return
    const section = brochure.pages
      .flatMap((p) => p.sections)
      .find((s) => s._key === currentSectionKey)
    if (!section) return
    if (!confirm(`Delete "${labelFor(section._type)}" section?`)) return
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => ({
        ...p,
        sections: p.sections.filter((s) => s._key !== currentSectionKey),
      })),
    }))
    setCurrentSectionKey(null)
  }, [currentSectionKey, brochure.pages, setBrochure])

  // ───────── Map editor keyboard shortcuts ─────────
  // Tool selection (V/T/P/I/S/D) + Delete for selected drawings. Only fires
  // while a circuit map is the active section.
  useEffect(() => {
    if (!mapEditMode) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (el?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault()
        setPendingAnnotationKind(null)
        return
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        setPendingAnnotationKind('text')
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault()
        setPendingAnnotationKind('pin')
        return
      }
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        setPendingAnnotationKind('image')
        return
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        setPendingAnnotationKind('svg')
        return
      }
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setPendingAnnotationKind('draw')
        return
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDrawingKey && currentSectionKey) {
        e.preventDefault()
        handleDeleteDrawing(currentSectionKey, selectedDrawingKey)
        setSelectedDrawingKey(null)
        return
      }

      if (e.key === 'Escape') {
        if (pendingAnnotationKind || selectedDrawingKey || selectedAnnotationKey) {
          e.preventDefault()
          setPendingAnnotationKind(null)
          setSelectedDrawingKey(null)
          setSelectedAnnotationKey(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mapEditMode, currentSectionKey, selectedDrawingKey, selectedAnnotationKey, pendingAnnotationKind, handleDeleteDrawing])

  // ───────── Annotation keyboard shortcuts ─────────
  useEffect(() => {
    if (!selectedAnnotationKey) return
    const onKey = (e: KeyboardEvent) => {
      // Don't intercept when typing in an input/textarea/contentEditable
      const el = e.target as HTMLElement
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (el?.isContentEditable) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        // Delete the selected annotation
        setBrochure((prev) => ({
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            sections: page.sections.map((s) => {
              if (s._type !== 'circuitMap') return s
              const cm = s as SectionCircuitMap
              if (!(cm.annotations ?? []).some((a) => a._key === selectedAnnotationKey)) return s
              return { ...cm, annotations: (cm.annotations ?? []).filter((a) => a._key !== selectedAnnotationKey) } as Section
            }),
          })),
        }))
        setSelectedAnnotationKey(null)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        setSelectedAnnotationKey(null)
        setPendingAnnotationKind(null)
        return
      }

      // Arrow key nudging: 1% step, Shift for 0.1% fine-tuning
      const step = e.shiftKey ? 0.1 : 1
      let dx = 0, dy = 0
      if (e.key === 'ArrowLeft') dx = -step
      else if (e.key === 'ArrowRight') dx = step
      else if (e.key === 'ArrowUp') dy = -step
      else if (e.key === 'ArrowDown') dy = step
      if (dx !== 0 || dy !== 0) {
        e.preventDefault()
        setBrochure((prev) => ({
          ...prev,
          pages: prev.pages.map((page) => ({
            ...page,
            sections: page.sections.map((s) => {
              if (s._type !== 'circuitMap') return s
              const cm = s as SectionCircuitMap
              if (!(cm.annotations ?? []).some((a) => a._key === selectedAnnotationKey)) return s
              return {
                ...cm,
                annotations: (cm.annotations ?? []).map((a) =>
                  a._key === selectedAnnotationKey
                    ? { ...a, x: Math.min(100, Math.max(0, Math.round((a.x + dx) * 100) / 100)), y: Math.min(100, Math.max(0, Math.round((a.y + dy) * 100) / 100)) }
                    : a
                ),
              } as Section
            }),
          })),
        }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedAnnotationKey, setBrochure])

  useEditorShortcuts({
    onSave: () => void flushNow(),
    onUndo: undo,
    onRedo: redo,
    onDuplicate: duplicateCurrentSection,
    onDelete: deleteCurrentSection,
    onDeselect: () => setCurrentSectionKey(null),
    onPrev: () => navigateSection(-1),
    onNext: () => navigateSection(1),
  })

  // ───────── Properties panel context ─────────

  const propertiesContext = useMemo(() => {
    if (!currentSection) return null
    const page = brochure.pages[currentPageIndex]
    if (!page) return null
    const sectionIndex = page.sections.findIndex((s) => s._key === currentSectionKey)
    return {
      pageName: page.name,
      sectionIndex,
      totalSections: page.sections.length,
    }
  }, [currentSection, brochure.pages, currentPageIndex, currentSectionKey])

  // Compute the per-type bulk-apply group for the currently selected section
  // (e.g. all section headings, all spotlights). The button only renders when
  // there's more than one section in the group — applying to a group of one
  // is a no-op.
  const imageTreatmentGroup = useMemo(() => {
    if (!currentSection) return null
    const group = findImageTreatmentGroup(currentSection._type)
    if (!group) return null
    let count = 0
    for (const page of brochure.pages) {
      for (const s of page.sections) {
        if (group.types.includes(s._type)) count++
      }
    }
    return { ...group, count }
  }, [currentSection, brochure.pages])

  return (
    <PeerPresenceProvider
      selectedSectionKey={currentSectionKey}
      currentPageKey={brochure.pages[currentPageIndex]?._key ?? null}
      liveblocksEnabled={liveblocksEnabled}
    >
    <div className="editor-root">
      <EditorTopbar
        brochure={brochure}
        companies={companies}
        saveStatus={saveStatus}
        liveblocksEnabled={liveblocksEnabled}
        onTitleChange={handleTitleChange}
        onStatusChange={handleStatusChange}
        onFeatureChange={handleFeatureChange}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="editor-body">
        {layout.leftCollapsed ? (
          <CollapsedRail label="Pages" side="left" onExpand={layout.toggleLeft} />
        ) : (
          <>
            <aside className="editor-panel-left" style={{ width: layout.leftWidth }}>
              <div className="editor-panel-header">
                <span>Pages</span>
                <CollapseButton side="left" onClick={layout.toggleLeft} />
              </div>
              <PagesPanel
                brochure={brochure}
                setBrochure={updateBrochure}
                currentPageIndex={currentPageIndex}
                setCurrentPageIndex={setCurrentPageIndex}
                currentSectionKey={currentSectionKey}
                setCurrentSectionKey={setCurrentSectionKey}
                onRequestAddSection={handleRequestAddSection}
              />
            </aside>
            <ResizeHandle
              width={layout.leftWidth}
              onChange={layout.setLeftWidth}
              side="left"
            />
          </>
        )}

        <main className="editor-panel-center">
          <PreviewStage
            brochure={brochure}
            currentPageIndex={currentPageIndex}
            currentSectionKey={currentSectionKey}
            setCurrentSectionKey={setCurrentSectionKey}
            recolor={recolorContext}
            annotations={annotationContext}
            onInlineEdit={handleInlineEdit}
            onInlineMediaEdit={handleInlineMediaEdit}
            previewDevice={layout.previewDevice}
            previewWidth={layout.previewWidth}
            onPreviewDeviceChange={layout.setPreviewDevice}
            onPreviewWidthChange={layout.setPreviewWidth}
            liveblocksEnabled={liveblocksEnabled}
          />
        </main>

        {layout.rightCollapsed ? (
          <CollapsedRail label="Properties" side="right" onExpand={layout.toggleRight} />
        ) : (
          <>
            <ResizeHandle
              width={layout.rightWidth}
              onChange={layout.setRightWidth}
              side="right"
            />
            <aside className="editor-panel-right" style={{ width: layout.rightWidth }}>
              <div className="editor-panel-header">
                <CollapseButton side="right" onClick={layout.toggleRight} />
                <span>Properties</span>
              </div>
              <PropertiesPanel
                section={currentSection}
                context={propertiesContext}
                onChange={handleSectionChange}
                onApplyImageTreatmentToAll={handleApplyImageTreatmentToAll}
                imageTreatmentGroup={imageTreatmentGroup}
                brandContext={{
                  accentColor: effectiveAccent,
                  backgroundColor: brochure.backgroundColor,
                  textColor: brochure.textColor,
                  titleColor: brochure.titleColor,
                  theme: brochure.theme,
                  customColors: brochure.customColors,
                }}
                onAddCustomColor={(name, hex) => {
                  setBrochure((prev) => ({
                    ...prev,
                    customColors: [
                      ...(prev.customColors ?? []),
                      { _key: nanokey(), name, hex },
                    ],
                  }))
                }}
                accentColor={effectiveAccent}
                onPickByColor={handlePickByColor}
                selectedAnnotationKey={selectedAnnotationKey}
                onSelectAnnotation={setSelectedAnnotationKey}
                selectedDrawingKey={selectedDrawingKey}
                onSelectDrawing={setSelectedDrawingKey}
              />
            </aside>
          </>
        )}
      </div>

      {recolorSelection ? (
        <RecolorPopover
          x={recolorSelection.x}
          y={recolorSelection.y}
          elementIds={recolorSelection.elementIds}
          value={recolorPopoverValue}
          fallback={effectiveAccent}
          recentColors={recentColors}
          brandContext={{
            accentColor: effectiveAccent,
            backgroundColor: brochure.backgroundColor,
            textColor: brochure.textColor,
            titleColor: brochure.titleColor,
            theme: brochure.theme,
            customColors: brochure.customColors,
          }}
          onChange={(color) =>
            updateOverrides(recolorSelection.sectionKey, recolorSelection.elementIds, color)
          }
          onReset={() =>
            updateOverrides(recolorSelection.sectionKey, recolorSelection.elementIds, null)
          }
          onClose={() => setRecolorSelection(null)}
        />
      ) : null}

      <AddSectionModal
        open={addSectionForPage !== null}
        onClose={() => setAddSectionForPage(null)}
        onPick={handlePickSectionType}
      />

      <BrochureSettingsModal
        open={settingsOpen}
        brochure={brochure}
        companies={companies}
        onClose={() => setSettingsOpen(false)}
        onSaved={(updates) =>
          setBrochure((prev) => ({
            ...prev,
            _rev: updates.rev,
            slug: updates.slug,
            season: updates.season,
            event: updates.event,
            seo: updates.seo,
            leadCapture: updates.leadCapture,
            theme: updates.theme,
            accentColor: updates.accentColor,
            backgroundColor: updates.backgroundColor,
            textColor: updates.textColor,
            titleColor: updates.titleColor,
            bodyColor: updates.bodyColor,
            eyebrowItalic: updates.eyebrowItalic,
            eyebrowTransform: updates.eyebrowTransform as Brochure['eyebrowTransform'],
            titleItalic: updates.titleItalic,
            titleTransform: updates.titleTransform as Brochure['titleTransform'],
            fontOverrides: updates.fontOverrides,
            customFonts: updates.customFonts,
            titleScale: updates.titleScale,
            eyebrowScale: updates.eyebrowScale,
            taglineScale: updates.taglineScale,
            customColors: updates.customColors,
            navColor: updates.navColor,
            textureImage: updates.textureImage,
            hideTexture: updates.hideTexture,
            logo: updates.logo,
            company: updates.companyId
              ? { _type: 'reference', _ref: updates.companyId }
              : undefined,
            // Refresh the decoded company-branding snapshot so the live-
            // fallback resolver picks up the new accent/logo immediately,
            // without waiting for a refetch.
            companyBranding: updates.companyBranding,
          }))
        }
      />
      <SaveToast status={saveStatus} />
    </div>
    </PeerPresenceProvider>
  )
}
