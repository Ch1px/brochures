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
import { useBrochureHistory } from '@/hooks/useBrochureHistory'
import { useEditorLayout } from '@/hooks/useEditorLayout'
import { useEditorShortcuts } from '@/hooks/useEditorShortcuts'
import { labelFor } from '@/lib/sectionLabels'
import { nanokey } from '@/lib/nanokey'
import { sectionDefaults } from '@/lib/sectionDefaults'
import { EditorTopbar } from './EditorTopbar'
import { PagesPanel } from './PagesPanel'
import { PreviewStage } from './PreviewStage'
import { AddSectionModal } from './AddSectionModal'
import { PropertiesPanel } from './PropertiesPanel'
import { BrochureSettingsModal } from './BrochureSettingsModal'
import { RecolorPopover } from './RecolorPopover'
import { CollapseButton, CollapsedRail, ResizeHandle } from './EditorLayoutControls'

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
        const cloned = JSON.parse(JSON.stringify(page.sections[idx])) as Section
        cloned._key = nanokey()
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
                accentColor={brochure.accentColor}
                recolorMode={recolorMode}
                onRecolorModeChange={setRecolorMode}
                onPickByColor={handlePickByColor}
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
          fallback={brochure.accentColor}
          recentColors={recentColors}
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
