'use client'

import { useCallback } from 'react'

type ResizeHandleProps = {
  /** Current width of the panel being resized, in px. */
  width: number
  /** Receives the new width as the user drags. */
  onChange: (next: number) => void
  /** Which panel this handle resizes — determines drag direction. */
  side: 'left' | 'right'
}

/**
 * Thin draggable divider that sits between the centre stage and a side
 * panel. Drags update width via mouse position deltas; on release we drop
 * the global cursor / select-disable styles.
 */
export function ResizeHandle({ width, onChange, side }: ResizeHandleProps) {
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = width

      const onMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX
        const next = side === 'left' ? startWidth + delta : startWidth - delta
        onChange(next)
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    },
    [width, onChange, side]
  )

  return (
    <div
      className="editor-resize-handle"
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${side} panel`}
      onMouseDown={onMouseDown}
    />
  )
}

type CollapsedRailProps = {
  label: string
  side: 'left' | 'right'
  onExpand: () => void
}

/**
 * Replaces a collapsed side panel with a thin vertical rail showing the
 * panel name and a chevron to re-expand. Click anywhere on the rail to
 * expand.
 */
export function CollapsedRail({ label, side, onExpand }: CollapsedRailProps) {
  return (
    <button
      type="button"
      className={`editor-panel-rail ${side}`}
      onClick={onExpand}
      title={`Expand ${label}`}
    >
      <span className="editor-panel-rail-chevron" aria-hidden>
        {side === 'left' ? '›' : '‹'}
      </span>
      <span className="editor-panel-rail-label">{label}</span>
    </button>
  )
}

type CollapseButtonProps = {
  side: 'left' | 'right'
  onClick: () => void
}

/**
 * Small chevron button that sits inside a panel header and collapses that
 * panel down to a rail.
 */
export function CollapseButton({ side, onClick }: CollapseButtonProps) {
  return (
    <button
      type="button"
      className="editor-panel-collapse"
      onClick={onClick}
      title={`Collapse ${side} panel`}
      aria-label={`Collapse ${side} panel`}
    >
      {side === 'left' ? '‹' : '›'}
    </button>
  )
}
