'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  Brochure,
  BrochureStatus,
  BrochureTheme,
  ColorOverride,
  Section,
  SectionCircuitMap,
} from '@/types/brochure'
import { useAutosave } from '@/hooks/useAutosave'
import { nanokey } from '@/lib/nanokey'
import { sectionDefaults } from '@/lib/sectionDefaults'
import { EditorTopbar } from './EditorTopbar'
import { PagesPanel } from './PagesPanel'
import { PreviewStage } from './PreviewStage'
import { AddSectionModal } from './AddSectionModal'
import { PropertiesPanel } from './PropertiesPanel'
import { BrochureSettingsModal } from './BrochureSettingsModal'
import { RecolorPopover } from './RecolorPopover'

type Props = {
  initialBrochure: Brochure
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
export function BrochureEditor({ initialBrochure }: Props) {
  const [brochure, setBrochure] = useState<Brochure>(initialBrochure)
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

  const { status: saveStatus } = useAutosave(brochure)

  // Resolve the currently-selected section from the brochure tree
  const currentSection = useMemo<Section | null>(() => {
    if (!currentSectionKey) return null
    for (const page of brochure.pages) {
      const found = page.sections.find((s) => s._key === currentSectionKey)
      if (found) return found
    }
    return null
  }, [brochure.pages, currentSectionKey])

  const handleTitleChange = useCallback((title: string) => {
    setBrochure((prev) => ({ ...prev, title }))
  }, [])

  const handleStatusChange = useCallback((status: BrochureStatus) => {
    setBrochure((prev) => ({ ...prev, status }))
  }, [])

  const handleThemeChange = useCallback((theme: BrochureTheme) => {
    setBrochure((prev) => ({ ...prev, theme }))
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
      active: recolorMode,
      targetSectionKey: currentSectionKey,
      selectedIds: recolorSelection?.elementIds ?? [],
      onElementClick: handleRecolorElementClick,
    }),
    [recolorMode, currentSectionKey, recolorSelection, handleRecolorElementClick]
  )

  return (
    <div className="editor-root">
      <EditorTopbar
        brochure={brochure}
        saveStatus={saveStatus}
        onTitleChange={handleTitleChange}
        onStatusChange={handleStatusChange}
        onThemeChange={handleThemeChange}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="editor-body">
        <aside className="editor-panel-left">
          <div className="editor-panel-header">Pages</div>
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

        <main className="editor-panel-center">
          <PreviewStage
            brochure={brochure}
            currentPageIndex={currentPageIndex}
            currentSectionKey={currentSectionKey}
            setCurrentSectionKey={setCurrentSectionKey}
            recolor={recolorContext}
          />
        </main>

        <aside className="editor-panel-right">
          <div className="editor-panel-header">Properties</div>
          <PropertiesPanel
            section={currentSection}
            onChange={handleSectionChange}
            accentColor={brochure.accentColor}
            recolorMode={recolorMode}
            onRecolorModeChange={setRecolorMode}
          />
        </aside>
      </div>

      {recolorSelection ? (
        <RecolorPopover
          x={recolorSelection.x}
          y={recolorSelection.y}
          elementIds={recolorSelection.elementIds}
          value={recolorPopoverValue}
          fallback={brochure.accentColor}
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
        onClose={() => setSettingsOpen(false)}
        onSaved={(updates) =>
          setBrochure((prev) => ({
            ...prev,
            slug: updates.slug,
            season: updates.season,
            event: updates.event,
            seo: updates.seo,
            leadCapture: updates.leadCapture,
            accentColor: updates.accentColor,
            logo: updates.logo,
          }))
        }
      />
    </div>
  )
}
