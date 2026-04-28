'use client'

import { useEffect, useRef } from 'react'

type Handlers = {
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onDeselect?: () => void
  onPrev?: () => void
  onNext?: () => void
}

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

/**
 * Editor-wide keyboard shortcuts.
 *
 *   ⌘/Ctrl + S         — flush save
 *   ⌘/Ctrl + Z         — undo
 *   ⌘/Ctrl + Shift + Z — redo
 *   ⌘/Ctrl + D         — duplicate selected section
 *   Delete             — delete selected section
 *   Esc                — deselect
 *   ↑ / ↓              — prev / next section across all pages
 *
 * When the user is typing in an input/textarea/contenteditable, only
 * meta-key combos fire (and ⌘D defers so we don't break text editing).
 */
export function useEditorShortcuts(handlers: Handlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      const editing = isEditable(e.target)
      const h = handlersRef.current

      if (meta && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        h.onSave?.()
        return
      }
      if (meta && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        h.onRedo?.()
        return
      }
      if (meta && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault()
        h.onUndo?.()
        return
      }
      if (meta && !e.shiftKey && (e.key === 'd' || e.key === 'D')) {
        if (editing) return
        e.preventDefault()
        h.onDuplicate?.()
        return
      }

      if (editing) return

      if (e.key === 'Delete') {
        e.preventDefault()
        h.onDelete?.()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        h.onDeselect?.()
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        h.onPrev?.()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        h.onNext?.()
        return
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
