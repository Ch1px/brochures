'use client'

import { useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DraggableAttributes,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Brochure, Page, Section } from '@/types/brochure'
import { labelFor } from '@/lib/sectionLabels'
import { cloneWithNewKeys, nanokey } from '@/lib/nanokey'

type Props = {
  brochure: Brochure
  setBrochure: (updater: (prev: Brochure) => Brochure) => void
  currentPageIndex: number
  setCurrentPageIndex: (idx: number) => void
  currentSectionKey: string | null
  setCurrentSectionKey: (key: string | null) => void
  onRequestAddSection: (pageIndex: number) => void
}

// IDs are prefixed so pages and sections never collide inside the shared
// DndContext. `p:` for pages, `s:` for sections.
const pageId = (key: string) => `p:${key}`
const sectionId = (key: string) => `s:${key}`

/**
 * Pages tree — matches the builder's left panel.
 *
 * Top level: pages with number, name, rename/delete actions and drag handle.
 * Nested: sections within each page with type label, delete action, drag
 * handle. Both pages and sections reorder via @dnd-kit drag-and-drop.
 *
 * Active page header has a red left-bar indicator + subtle tint.
 */
export function PagesPanel({
  brochure,
  setBrochure,
  currentPageIndex,
  setCurrentPageIndex,
  currentSectionKey,
  setCurrentSectionKey,
  onRequestAddSection,
}: Props) {
  const [renamingPageKey, setRenamingPageKey] = useState<string | null>(null)

  // Require a small drag distance before activation so clicks on the handle
  // (or rows) don't get hijacked into drags.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  )

  // ───────── Page mutations ─────────

  function addPage() {
    const newPage: Page = {
      _key: nanokey(),
      name: `Page ${brochure.pages.length + 1}`,
      sections: [],
    }
    setBrochure((prev) => ({ ...prev, pages: [...prev.pages, newPage] }))
    setCurrentPageIndex(brochure.pages.length)
    setCurrentSectionKey(null)
  }

  function renamePage(pageKey: string, name: string) {
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((p) => (p._key === pageKey ? { ...p, name } : p)),
    }))
  }

  function duplicatePage(pageIndex: number) {
    const source = brochure.pages[pageIndex]
    if (!source) return
    const copy: Page = {
      ...cloneWithNewKeys(source),
      _key: nanokey(),
      name: `${source.name} (copy)`,
    }
    setBrochure((prev) => ({
      ...prev,
      pages: [...prev.pages.slice(0, pageIndex + 1), copy, ...prev.pages.slice(pageIndex + 1)],
    }))
    setCurrentPageIndex(pageIndex + 1)
    setCurrentSectionKey(null)
  }

  function deletePage(pageIndex: number) {
    if (brochure.pages.length <= 1) {
      if (!confirm('Delete the only page? The brochure will have no content.')) return
    } else {
      if (!confirm(`Delete "${brochure.pages[pageIndex].name}" and all its sections?`)) return
    }
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== pageIndex),
    }))
    if (currentPageIndex >= pageIndex && currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
    }
    setCurrentSectionKey(null)
  }

  // ───────── Section mutations ─────────

  function addSection(pageIndex: number) {
    onRequestAddSection(pageIndex)
  }

  function duplicateSection(pageIndex: number, sectionKey: string) {
    const page = brochure.pages[pageIndex]
    if (!page) return
    const sectionIndex = page.sections.findIndex((s) => s._key === sectionKey)
    if (sectionIndex === -1) return
    const source = page.sections[sectionIndex]
    const copy: Section = { ...cloneWithNewKeys(source), _key: nanokey() }
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) =>
        i === pageIndex
          ? {
              ...p,
              sections: [
                ...p.sections.slice(0, sectionIndex + 1),
                copy,
                ...p.sections.slice(sectionIndex + 1),
              ],
            }
          : p
      ),
    }))
    setCurrentPageIndex(pageIndex)
    setCurrentSectionKey(copy._key)
  }

  function deleteSection(pageIndex: number, sectionKey: string) {
    const section = brochure.pages[pageIndex]?.sections.find((s) => s._key === sectionKey)
    if (!section) return
    if (!confirm(`Delete "${labelFor(section._type)}" section?`)) return
    setBrochure((prev) => ({
      ...prev,
      pages: prev.pages.map((p, i) =>
        i === pageIndex ? { ...p, sections: p.sections.filter((s) => s._key !== sectionKey) } : p
      ),
    }))
    if (currentSectionKey === sectionKey) setCurrentSectionKey(null)
  }

  // ───────── Drag-and-drop ─────────

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current as
      | { type: 'page' | 'section'; pageIndex?: number }
      | undefined
    const overData = over.data.current as
      | { type: 'page' | 'section'; pageIndex?: number }
      | undefined
    if (!activeData || !overData) return

    if (activeData.type === 'page' && overData.type === 'page') {
      setBrochure((prev) => {
        const oldIdx = prev.pages.findIndex((p) => pageId(p._key) === active.id)
        const newIdx = prev.pages.findIndex((p) => pageId(p._key) === over.id)
        if (oldIdx === -1 || newIdx === -1) return prev
        // Keep the active page selection following the drag.
        if (currentPageIndex === oldIdx) setCurrentPageIndex(newIdx)
        else if (oldIdx < currentPageIndex && newIdx >= currentPageIndex)
          setCurrentPageIndex(currentPageIndex - 1)
        else if (oldIdx > currentPageIndex && newIdx <= currentPageIndex)
          setCurrentPageIndex(currentPageIndex + 1)
        return { ...prev, pages: arrayMove(prev.pages, oldIdx, newIdx) }
      })
      return
    }

    if (
      activeData.type === 'section' &&
      overData.type === 'section' &&
      activeData.pageIndex === overData.pageIndex &&
      activeData.pageIndex !== undefined
    ) {
      const pageIndex = activeData.pageIndex
      setBrochure((prev) => {
        const page = prev.pages[pageIndex]
        if (!page) return prev
        const oldIdx = page.sections.findIndex((s) => sectionId(s._key) === active.id)
        const newIdx = page.sections.findIndex((s) => sectionId(s._key) === over.id)
        if (oldIdx === -1 || newIdx === -1) return prev
        return {
          ...prev,
          pages: prev.pages.map((p, i) =>
            i === pageIndex ? { ...p, sections: arrayMove(p.sections, oldIdx, newIdx) } : p
          ),
        }
      })
    }
  }

  // ───────── Render ─────────

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="editor-pages-list">
        <SortableContext
          items={brochure.pages.map((p) => pageId(p._key))}
          strategy={verticalListSortingStrategy}
        >
          {brochure.pages.map((page, pageIndex) => (
            <SortablePage
              key={page._key}
              page={page}
              pageIndex={pageIndex}
              isActive={pageIndex === currentPageIndex}
              isRenaming={renamingPageKey === page._key}
              currentSectionKey={currentSectionKey}
              onSelectPage={() => {
                setCurrentPageIndex(pageIndex)
                setCurrentSectionKey(null)
              }}
              onSelectSection={(key) => {
                setCurrentPageIndex(pageIndex)
                setCurrentSectionKey(key)
              }}
              onStartRename={() => setRenamingPageKey(page._key)}
              onFinishRename={(name) => {
                renamePage(page._key, name)
                setRenamingPageKey(null)
              }}
              onCancelRename={() => setRenamingPageKey(null)}
              onDeletePage={() => deletePage(pageIndex)}
              onDuplicatePage={() => duplicatePage(pageIndex)}
              onAddSection={() => addSection(pageIndex)}
              onDeleteSection={(sectionKey) => deleteSection(pageIndex, sectionKey)}
              onDuplicateSection={(sectionKey) => duplicateSection(pageIndex, sectionKey)}
            />
          ))}
        </SortableContext>
      </div>

      <div className="editor-pages-footer">
        <button className="editor-add-page" onClick={addPage}>
          + Add page
        </button>
      </div>
    </DndContext>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Sortable page row
// ─────────────────────────────────────────────────────────────────────────

type SortablePageProps = {
  page: Page
  pageIndex: number
  isActive: boolean
  isRenaming: boolean
  currentSectionKey: string | null
  onSelectPage: () => void
  onSelectSection: (sectionKey: string) => void
  onStartRename: () => void
  onFinishRename: (name: string) => void
  onCancelRename: () => void
  onDeletePage: () => void
  onDuplicatePage: () => void
  onAddSection: () => void
  onDeleteSection: (sectionKey: string) => void
  onDuplicateSection: (sectionKey: string) => void
}

function SortablePage({
  page,
  pageIndex,
  isActive,
  isRenaming,
  currentSectionKey,
  onSelectPage,
  onSelectSection,
  onStartRename,
  onFinishRename,
  onCancelRename,
  onDeletePage,
  onDuplicatePage,
  onAddSection,
  onDeleteSection,
  onDuplicateSection,
}: SortablePageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: pageId(page._key),
    data: { type: 'page', pageIndex },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`editor-page-group ${isActive ? 'active-page' : ''} ${isDragging ? 'dragging' : ''}`.trim()}
    >
      <div
        className="editor-page-group-header"
        onClick={() => {
          if (isRenaming) return
          onSelectPage()
        }}
      >
        <DragHandle attributes={attributes} listeners={listeners} />
        <span className="editor-page-num">{String(pageIndex + 1).padStart(2, '0')}</span>

        {isRenaming ? (
          <input
            className="editor-page-name-input"
            defaultValue={page.name}
            autoFocus
            onBlur={(e) => {
              const trimmed = e.currentTarget.value.trim() || 'Untitled'
              onFinishRename(trimmed)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
              if (e.key === 'Escape') onCancelRename()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="editor-page-name">{page.name}</span>
        )}

        <div className="editor-page-group-actions" onClick={(e) => e.stopPropagation()}>
          <IconBtn label="Rename" onClick={onStartRename}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </IconBtn>
          <IconBtn label="Duplicate" onClick={onDuplicatePage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="11" height="11" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </IconBtn>
          <IconBtn label="Delete" danger onClick={onDeletePage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </IconBtn>
        </div>
      </div>

      <div className="editor-section-list">
        <SortableContext
          items={page.sections.map((s) => sectionId(s._key))}
          strategy={verticalListSortingStrategy}
        >
          {page.sections.map((section, sectionIndex) => (
            <SortableSection
              key={section._key}
              section={section}
              pageIndex={pageIndex}
              sectionIndex={sectionIndex}
              isActive={currentSectionKey === section._key}
              onSelect={() => onSelectSection(section._key)}
              onDelete={() => onDeleteSection(section._key)}
              onDuplicate={() => onDuplicateSection(section._key)}
            />
          ))}
        </SortableContext>
        <button className="editor-add-section" onClick={onAddSection} title="Add section">
          + Add section
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Sortable section row
// ─────────────────────────────────────────────────────────────────────────

type SortableSectionProps = {
  section: Section
  pageIndex: number
  sectionIndex: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
}

function SortableSection({
  section,
  pageIndex,
  sectionIndex,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: sectionId(section._key),
    data: { type: 'section', pageIndex },
  })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`editor-section-item ${isActive ? 'active-section' : ''} ${isDragging ? 'dragging' : ''}`.trim()}
      onClick={onSelect}
    >
      <DragHandle attributes={attributes} listeners={listeners} />
      <span className="editor-section-num">{String(sectionIndex + 1).padStart(2, '0')}</span>
      <span className="editor-section-type">{labelFor(section._type)}</span>
      <div className="editor-section-item-actions" onClick={(e) => e.stopPropagation()}>
        <IconBtn label="Duplicate" onClick={onDuplicate}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </IconBtn>
        <IconBtn label="Delete" danger onClick={onDelete}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
          </svg>
        </IconBtn>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────────────────

type SortableState = ReturnType<typeof useSortable>

function DragHandle({
  attributes,
  listeners,
}: {
  attributes: DraggableAttributes
  listeners: SortableState['listeners']
}) {
  return (
    <button
      type="button"
      className="editor-drag-handle"
      aria-label="Drag to reorder"
      title="Drag to reorder"
      onClick={(e) => e.stopPropagation()}
      {...attributes}
      {...listeners}
    >
      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden>
        <circle cx="5" cy="3" r="1.4" />
        <circle cx="11" cy="3" r="1.4" />
        <circle cx="5" cy="8" r="1.4" />
        <circle cx="11" cy="8" r="1.4" />
        <circle cx="5" cy="13" r="1.4" />
        <circle cx="11" cy="13" r="1.4" />
      </svg>
    </button>
  )
}

function IconBtn({
  children,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      className={`editor-icon-btn ${danger ? 'danger' : ''}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}
