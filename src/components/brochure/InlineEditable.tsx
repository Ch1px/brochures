'use client'

import { useRef, useCallback, useMemo, useState, cloneElement, type ReactElement } from 'react'
import { useBrochureBranding } from './BrochureContext'

type Props = {
  sectionKey: string
  field: string
  richBody?: boolean
  placeholder?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: ReactElement<any> | null | false
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Wraps a text element to make it inline-editable in the editor preview.
 *
 * In public mode (editorMode falsy): returns children unchanged.
 *
 * In editor mode there are two distinct edit pathways:
 *
 *  • Plain-text fields (title, eyebrow, caption …): cloneElement adds
 *    contentEditable + commit handlers directly on the rendered child.
 *
 *  • Rich-body fields: edits happen on a SEPARATE plain-text editor that
 *    swaps in only while the user is editing. The editor is pre-filled with
 *    the SOURCE STRING (not the rendered RichBody DOM), uses
 *    contentEditable="plaintext-only" + white-space:pre-wrap so Enter inserts
 *    a real newline, and on blur we save its `textContent` directly.
 *
 *    This avoids letting React reconcile against a contentEditable DOM that
 *    the browser has been mutating mid-typing — that pattern was throwing
 *    "removeChild: not a child of this node" mid-render and saving each Enter
 *    as a paragraph break (every line ended up as its own paragraph).
 *
 *    `dangerouslySetInnerHTML` on the editor is intentional: it prevents
 *    React from touching the editor's children after mount, so user typing
 *    can't desync from the virtual DOM.
 */
export function InlineEditable({ sectionKey, field, richBody, placeholder, children }: Props) {
  const { editorMode, onInlineEdit } = useBrochureBranding()
  const elRef = useRef<HTMLElement | null>(null)
  const editingRef = useRef(false)

  // For richBody: when not null, rich-body editor is mounted with this source.
  const [richEditSource, setRichEditSource] = useState<string | null>(null)

  // Forces a remount of the rendered children after each commit so React
  // doesn't try to reconcile against any browser-mutated DOM left behind.
  const [remountKey, setRemountKey] = useState(0)

  // Source text for richBody children: every richBody call site passes
  // <RichBody text={...} />, so we read it off the child element's props.
  const getRichSource = useCallback((): string => {
    if (!children || typeof children === 'boolean') return ''
    const text = (children.props as { text?: string | null })?.text
    return text ?? ''
  }, [children])

  // ── Plain-text edit handlers ────────────────────────────────────────
  const handlePlainDoubleClick = useCallback(
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
      const range = document.createRange()
      range.selectNodeContents(el)
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    },
    [onInlineEdit],
  )

  const handlePlainBlur = useCallback(() => {
    const el = elRef.current
    if (!el || !editingRef.current) return
    editingRef.current = false
    el.contentEditable = 'false'
    el.classList.remove('inline-editing')
    const text = el.innerText?.trim() || ''
    setRemountKey((k) => k + 1)
    onInlineEdit?.(sectionKey, field, text)
  }, [onInlineEdit, sectionKey, field])

  const handlePlainKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!editingRef.current) return
      e.stopPropagation()
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        elRef.current?.blur()
      }
    },
    [],
  )

  // ── Rich-body edit handlers ─────────────────────────────────────────
  const handleRichDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onInlineEdit) return
      e.stopPropagation()
      e.preventDefault()
      setRichEditSource(getRichSource())
    },
    [onInlineEdit, getRichSource],
  )

  // Focus + select-all on mount of the rich-body editor.
  const richEditorRef = useCallback((node: HTMLDivElement | null) => {
    elRef.current = node
    if (!node) return
    node.focus()
    const range = document.createRange()
    range.selectNodeContents(node)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }, [])

  const handleRichBlur = useCallback(() => {
    const el = elRef.current
    if (!el || richEditSource === null) return
    const text = (el.textContent ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n?/g, '\n')
    setRichEditSource(null)
    setRemountKey((k) => k + 1)
    onInlineEdit?.(sectionKey, field, text)
  }, [onInlineEdit, sectionKey, field, richEditSource])

  const handleRichKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      elRef.current?.blur()
    }
  }, [])

  // Stable HTML for the editor's initial content. Memoised so React doesn't
  // re-set innerHTML mid-edit (which would wipe the user's typing).
  const richEditHtml = useMemo(
    () => (richEditSource !== null ? escapeHtml(richEditSource) : ''),
    [richEditSource],
  )

  if (!editorMode || !onInlineEdit) return children

  // ── Rich body branch ────────────────────────────────────────────────
  if (richBody) {
    if (richEditSource !== null) {
      return (
        <div
          ref={richEditorRef}
          className="inline-editable inline-editable-richbody-edit inline-editing"
          contentEditable="plaintext-only"
          suppressContentEditableWarning
          onBlur={handleRichBlur}
          onKeyDown={handleRichKeyDown}
          style={{ whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: richEditHtml }}
        />
      )
    }
    const hasContent = getRichSource().trim().length > 0
    return (
      <div
        key={remountKey}
        className="inline-editable inline-editable-richbody"
        onDoubleClick={handleRichDoubleClick}
      >
        {hasContent ? (
          children
        ) : (
          <span className="inline-editable-richbody-placeholder">
            {placeholder || field}
          </span>
        )}
      </div>
    )
  }

  // ── Plain-text branch ───────────────────────────────────────────────
  if (children == null || children === false) {
    return (
      <div
        key={remountKey}
        ref={elRef as React.RefObject<HTMLDivElement | null>}
        className="inline-editable inline-editable-placeholder"
        onDoubleClick={handlePlainDoubleClick}
        onBlur={handlePlainBlur}
        onKeyDown={handlePlainKeyDown}
        suppressContentEditableWarning
      >
        {placeholder || field}
      </div>
    )
  }

  const existingClassName = children.props?.className || ''
  const editableClass = `${existingClassName} inline-editable`.trim()

  return cloneElement(children, {
    key: remountKey,
    ref: (node: HTMLElement | null) => {
      elRef.current = node
      const childRef = (children as any).ref
      if (typeof childRef === 'function') childRef(node)
      else if (childRef && typeof childRef === 'object') childRef.current = node
    },
    className: editableClass,
    onDoubleClick: handlePlainDoubleClick,
    onBlur: handlePlainBlur,
    onKeyDown: handlePlainKeyDown,
    suppressContentEditableWarning: true,
  })
}
