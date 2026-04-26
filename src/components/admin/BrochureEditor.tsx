'use client'

import { useCallback, useMemo, useState } from 'react'
import type { Brochure, BrochureStatus, BrochureTheme, Section } from '@/types/brochure'
import { useAutosave } from '@/hooks/useAutosave'
import { sectionDefaults } from '@/lib/sectionDefaults'
import { EditorTopbar } from './EditorTopbar'
import { PagesPanel } from './PagesPanel'
import { PreviewStage } from './PreviewStage'
import { AddSectionModal } from './AddSectionModal'
import { PropertiesPanel } from './PropertiesPanel'
import { BrochureSettingsModal } from './BrochureSettingsModal'

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
          />
        </main>

        <aside className="editor-panel-right">
          <div className="editor-panel-header">Properties</div>
          <PropertiesPanel section={currentSection} onChange={handleSectionChange} accentColor={brochure.accentColor} />
        </aside>
      </div>

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
