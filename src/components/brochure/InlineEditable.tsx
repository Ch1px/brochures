'use client'

import { useRef, useCallback, cloneElement, type ReactElement, type Ref } from 'react'
import { useBrochureBranding } from './BrochureContext'
import { htmlToRichBody } from '@/lib/htmlToRichBody'

type Props = {
  sectionKey: string
  field: string
  richBody?: boolean
  placeholder?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: ReactElement<any> | null | false
}

/**
 * Wraps a text element to make it inline-editable in the editor preview.
 *
 * In public mode (editorMode falsy): returns children unchanged.
 * In editor mode: injects double-click → contentEditable → blur commit handlers
 * via React.cloneElement (no wrapper div to break layout).
 */
export function InlineEditable({ sectionKey, field, richBody, placeholder, children }: Props) {
  const { editorMode, onInlineEdit } = useBrochureBranding()
  const elRef = useRef<HTMLElement | null>(null)
  const editingRef = useRef(false)

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onInlineEdit) return
      e.stopPropagation()
      e.preventDefault()
      const el = elRef.current
      if (!el) return
      editingRef.current = true
      el.contentEditable = 'true'
      el.classList.add('inline-editing')
      el.focus()
      // Select all text
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    },
    [onInlineEdit],
  )

  const handleBlur = useCallback(() => {
    const el = elRef.current
    if (!el || !editingRef.current) return
    editingRef.current = false
    el.contentEditable = 'false'
    el.classList.remove('inline-editing')
    const text = richBody
      ? htmlToRichBody(el.innerHTML)
      : el.innerText?.trim() || ''
    onInlineEdit?.(sectionKey, field, text)
  }, [onInlineEdit, sectionKey, field, richBody])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editingRef.current) return
      // Stop all key events from bubbling to editor shortcuts
      e.stopPropagation()
      if (e.key === 'Escape') {
        e.preventDefault()
        elRef.current?.blur()
      }
      // Enter: commit on plain text, allow newline on richBody
      if (e.key === 'Enter' && !richBody) {
        e.preventDefault()
        elRef.current?.blur()
      }
    },
    [richBody],
  )

  // Public mode — pass through unchanged
  if (!editorMode || !onInlineEdit) return children

  // Handle null children (e.g. RichBody with empty text) — render a placeholder
  if (children == null || children === false) {
    return (
      <div
        ref={elRef as React.RefObject<HTMLDivElement | null>}
        className="inline-editable inline-editable-placeholder"
        onDoubleClick={handleDoubleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
      >
        {placeholder || field}
      </div>
    )
  }

  // RichBody fields: use a display:contents wrapper for event capture, but
  // set contentEditable on the actual rendered child element (the <p> or
  // <div class="rich-body">) to avoid layout disruption.
  if (richBody) {
    const richRef = useRef<HTMLElement | null>(null)

    const handleRichDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        if (!onInlineEdit) return
        e.stopPropagation()
        e.preventDefault()
        // Find the first real child element (the <p> or <div.rich-body>)
        const wrapper = richRef.current
        if (!wrapper) return
        const target = wrapper.firstElementChild as HTMLElement | null
        if (!target) return
        elRef.current = target
        editingRef.current = true
        target.contentEditable = 'true'
        target.classList.add('inline-editing')
        target.focus()
        const range = document.createRange()
        range.selectNodeContents(target)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      },
      [onInlineEdit],
    )

    const handleRichBlur = useCallback(() => {
      const el = elRef.current
      if (!el || !editingRef.current) return
      editingRef.current = false
      el.contentEditable = 'false'
      el.classList.remove('inline-editing')
      const text = htmlToRichBody(el.innerHTML)
      onInlineEdit?.(sectionKey, field, text)
    }, [onInlineEdit, sectionKey, field])

    const handleRichKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!editingRef.current) return
        e.stopPropagation()
        if (e.key === 'Escape') {
          e.preventDefault()
          elRef.current?.blur()
        }
        // Enter allows newlines in richBody
      },
      [],
    )

    return (
      <div
        ref={richRef as React.RefObject<HTMLDivElement | null>}
        className="inline-editable inline-editable-richbody"
        onDoubleClick={handleRichDoubleClick}
        onBlur={handleRichBlur}
        onKeyDown={handleRichKeyDown}
      >
        {children}
      </div>
    )
  }

  // Plain text fields: clone element with editing handlers (no wrapper div)
  const existingClassName = children.props?.className || ''
  const editableClass = `${existingClassName} inline-editable`.trim()

  return cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      elRef.current = node
      const childRef = (children as any).ref
      if (typeof childRef === 'function') childRef(node)
      else if (childRef && typeof childRef === 'object') childRef.current = node
    },
    className: editableClass,
    onDoubleClick: handleDoubleClick,
    onBlur: handleBlur,
    onKeyDown: handleKeyDown,
    suppressContentEditableWarning: true,
  })
}
