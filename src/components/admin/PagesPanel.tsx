'use client'

import { useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
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
  const [activeDrag, setActiveDrag] = useState<{
    type: 'page' | 'section'
    label: string
    fromPageIndex: number
  } | null>(null)
  const [dragOverPageKey, setDragOverPageKey] = useState<string | null>(null)

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

  function moveSection(fromPageIndex: number, sectionKey: string, toPageIndex: number) {
    if (fromPageIndex === toPageIndex) return
    setBrochure((prev) => {
      const fromPage = prev.pages[fromPageIndex]
      if (!fromPage) return prev
      const section = fromPage.sections.find((s) => s._key === sectionKey)
      if (!section) return prev
      return {
        ...prev,
        pages: prev.pages.map((p, i) => {
          if (i === fromPageIndex) return { ...p, sections: p.sections.filter((s) => s._key !== sectionKey) }
          if (i === toPageIndex) return { ...p, sections: [...p.sections, section] }
          return p
        }),
      }
    })
    setCurrentPageIndex(toPageIndex)
    setCurrentSectionKey(sectionKey)
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
      activeData.pageIndex !== undefined &&
      overData.pageIndex !== undefined
    ) {
      const fromPageIndex = activeData.pageIndex
      const toPageIndex = overData.pageIndex

      if (fromPageIndex === toPageIndex) {
        // Same page — reorder within the page
        setBrochure((prev) => {
          const page = prev.pages[fromPageIndex]
          if (!page) return prev
          const oldIdx = page.sections.findIndex((s) => sectionId(s._key) === active.id)
          const newIdx = page.sections.findIndex((s) => sectionId(s._key) === over.id)
          if (oldIdx === -1 || newIdx === -1) return prev
          return {
            ...prev,
            pages: prev.pages.map((p, i) =>
              i === fromPageIndex ? { ...p, sections: arrayMove(p.sections, oldIdx, newIdx) } : p
            ),
          }
        })
      } else {
        // Cross-page — move section from one page to another
        setBrochure((prev) => {
          const fromPage = prev.pages[fromPageIndex]
          if (!fromPage) return prev
          const sectionIdx = fromPage.sections.findIndex((s) => sectionId(s._key) === active.id)
          if (sectionIdx === -1) return prev
          const section = fromPage.sections[sectionIdx]

          const toPage = prev.pages[toPageIndex]
          if (!toPage) return prev
          const targetIdx = toPage.sections.findIndex((s) => sectionId(s._key) === over.id)
          const insertAt = targetIdx === -1 ? toPage.sections.length : targetIdx

          return {
            ...prev,
            pages: prev.pages.map((p, i) => {
              if (i === fromPageIndex) return { ...p, sections: p.sections.filter((_, si) => si !== sectionIdx) }
              if (i === toPageIndex) return { ...p, sections: [...p.sections.slice(0, insertAt), section, ...p.sections.slice(insertAt)] }
              return p
            }),
          }
        })
        setCurrentPageIndex(toPageIndex)
      }
    }

    // Section dropped on a page header (not on another section) — move to end of that page
    if (
      activeData.type === 'section' &&
      overData.type === 'page' &&
      activeData.pageIndex !== undefined
    ) {
      const fromPageIndex = activeData.pageIndex
      const toPageIndex = brochure.pages.findIndex((p) => pageId(p._key) === over.id)
      if (toPageIndex === -1 || fromPageIndex === toPageIndex) return

      setBrochure((prev) => {
        const fromPage = prev.pages[fromPageIndex]
        if (!fromPage) return prev
        const sectionIdx = fromPage.sections.findIndex((s) => sectionId(s._key) === active.id)
        if (sectionIdx === -1) return prev
        const section = fromPage.sections[sectionIdx]

        return {
          ...prev,
          pages: prev.pages.map((p, i) => {
            if (i === fromPageIndex) return { ...p, sections: p.sections.filter((_, si) => si !== sectionIdx) }
            if (i === toPageIndex) return { ...p, sections: [...p.sections, section] }
            return p
          }),
        }
      })
      setCurrentPageIndex(toPageIndex)
    }
  }

  // ───────── Render ─────────

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(event: DragStartEvent) => {
        const data = event.active.data.current as { type: 'page' | 'section'; pageIndex?: number } | undefined
        if (!data) return
        if (data.type === 'section') {
          const activeId = String(event.active.id)
          const key = activeId.replace('s:', '')
          const page = brochure.pages[data.pageIndex ?? 0]
          const section = page?.sections.find((s) => s._key === key)
          setActiveDrag({
            type: 'section',
            label: section ? labelFor(section._type) : 'Section',
            fromPageIndex: data.pageIndex ?? 0,
          })
        } else {
          setActiveDrag({ type: 'page', label: 'Page', fromPageIndex: data.pageIndex ?? 0 })
        }
      }}
      onDragOver={(event: DragOverEvent) => {
        const overData = event.over?.data.current as { type: 'page' | 'section'; pageIndex?: number } | undefined
        if (!overData || !activeDrag || activeDrag.type !== 'section') {
          setDragOverPageKey(null)
          return
        }
        if (overData.type === 'page') {
          const overId = String(event.over!.id)
          setDragOverPageKey(overId.replace('p:', ''))
        } else if (overData.type === 'section' && overData.pageIndex !== activeDrag.fromPageIndex) {
          const page = brochure.pages[overData.pageIndex ?? 0]
          setDragOverPageKey(page?._key ?? null)
        } else {
          setDragOverPageKey(null)
        }
      }}
      onDragEnd={(event) => {
        setActiveDrag(null)
        setDragOverPageKey(null)
        handleDragEnd(event)
      }}
      onDragCancel={() => {
        setActiveDrag(null)
        setDragOverPageKey(null)
      }}
    >
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
              isDragTarget={dragOverPageKey === page._key}
              isRenaming={renamingPageKey === page._key}
              currentSectionKey={currentSectionKey}
              totalPages={brochure.pages.length}
              onSelectPage={() => {
                setCurrentPageIndex(pageIndex)
                setCurrentSectionKey(null)
              }}
              onMoveSection={(sectionKey, toPageIndex) => {
                moveSection(pageIndex, sectionKey, toPageIndex)
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
  totalPages: number
  isActive: boolean
  isDragTarget: boolean
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
  onMoveSection: (sectionKey: string, toPageIndex: number) => void
}

function SortablePage({
  page,
  pageIndex,
  totalPages,
  isActive,
  isDragTarget,
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
  onMoveSection,
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
      className={[
        'editor-page-group',
        isActive ? 'active-page' : '',
        isDragging ? 'dragging' : '',
        isDragTarget ? 'drag-target' : '',
      ].filter(Boolean).join(' ')}
    >
      <div
        className="editor-page-group-header"
        onClick={() => {
          if (isRenaming) return
          onSelectPage()
        }}
      >
        <DragHandle attributes={attributes} listeners={listeners} />
        <svg
          className={`editor-page-chevron ${isActive ? 'open' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          width={12}
          height={12}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
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

      <div className={`editor-section-list-wrap ${isActive ? 'expanded' : ''}`}>
        <div className="editor-section-list-inner">
          {isActive ? (
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
                    totalPages={totalPages}
                    isActive={currentSectionKey === section._key}
                    onSelect={() => onSelectSection(section._key)}
                    onDelete={() => onDeleteSection(section._key)}
                    onDuplicate={() => onDuplicateSection(section._key)}
                    onMove={(toPageIndex) => onMoveSection(section._key, toPageIndex)}
                  />
                ))}
              </SortableContext>
              <button className="editor-add-section" onClick={onAddSection} title="Add section">
                + Add section
              </button>
            </div>
          ) : (
            <div className="editor-section-list-collapsed">
              {page.sections.length} section{page.sections.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
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
  totalPages: number
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onDuplicate: () => void
  onMove: (toPageIndex: number) => void
}

function SortableSection({
  section,
  pageIndex,
  sectionIndex,
  totalPages,
  isActive,
  onSelect,
  onDelete,
  onDuplicate,
  onMove,
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
