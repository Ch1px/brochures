'use client'

import type { AnnotationKind } from '@/types/brochure'

type Tool = 'select' | AnnotationKind

type Props = {
  tool: Tool
  onSelectTool: (tool: Tool) => void
  drawTool: 'freehand' | 'line'
  onSelectDrawTool: (tool: 'freehand' | 'line') => void
  drawStyle: 'solid' | 'dashed' | 'dotted'
  onSelectDrawStyle: (style: 'solid' | 'dashed' | 'dotted') => void
}

/**
 * Floating toolbar pinned to the top-centre of the circuit-map preview stage.
 *
 * Replaces the right-panel toolbar so admins switch tools with a single click
 * directly on the canvas. The Select tool is the default and is what enables
 * the click-to-recolour flow; switching to an Add or Draw tool routes clicks
 * to the placement / draw handlers instead.
 *
 * Tool shortcuts (handled in BrochureEditor): V Select · T Text · P Pin
 * I Image · S SVG · D Draw · Esc back to Select.
 */
export function CircuitMapToolbar({
  tool,
  onSelectTool,
  drawTool,
  onSelectDrawTool,
  drawStyle,
  onSelectDrawStyle,
}: Props) {
  const showDrawSubrow = tool === 'draw'

  return (
    <div className="cm-toolbar" role="toolbar" aria-label="Circuit map tools">
      <div className="cm-toolbar-row">
        <ToolBtn
          active={tool === 'select'}
          onClick={() => onSelectTool('select')}
          title="Select (V) — click a segment to recolour, click an annotation or drawing to edit"
        >
          <CursorIcon />
          <span>Select</span>
        </ToolBtn>
        <span className="cm-toolbar-divider" />
        <ToolBtn
          active={tool === 'text'}
          onClick={() => onSelectTool('text')}
          title="Place text (T)"
        >
          <TextIcon />
          <span>Text</span>
        </ToolBtn>
        <ToolBtn
          active={tool === 'pin'}
          onClick={() => onSelectTool('pin')}
          title="Place pin (P)"
        >
          <PinIcon />
          <span>Pin</span>
        </ToolBtn>
        <ToolBtn
          active={tool === 'image'}
          onClick={() => onSelectTool('image')}
          title="Place image (I)"
        >
          <ImageIcon />
          <span>Image</span>
        </ToolBtn>
        <ToolBtn
          active={tool === 'svg'}
          onClick={() => onSelectTool('svg')}
          title="Place SVG (S)"
        >
          <SvgIcon />
          <span>SVG</span>
        </ToolBtn>
        <span className="cm-toolbar-divider" />
        <ToolBtn
          active={tool === 'draw'}
          onClick={() => onSelectTool('draw')}
          title="Draw (D)"
        >
          <DrawIcon />
          <span>Draw</span>
        </ToolBtn>
      </div>
      {showDrawSubrow ? (
        <div className="cm-toolbar-row cm-toolbar-subrow">
          <ToolBtn small active={drawTool === 'freehand'} onClick={() => onSelectDrawTool('freehand')}>
            Freehand
          </ToolBtn>
          <ToolBtn small active={drawTool === 'line'} onClick={() => onSelectDrawTool('line')}>
            Line
          </ToolBtn>
          <span className="cm-toolbar-divider" />
          <ToolBtn small active={drawStyle === 'solid'} onClick={() => onSelectDrawStyle('solid')}>
            Solid
          </ToolBtn>
          <ToolBtn small active={drawStyle === 'dashed'} onClick={() => onSelectDrawStyle('dashed')}>
            Dashed
          </ToolBtn>
          <ToolBtn small active={drawStyle === 'dotted'} onClick={() => onSelectDrawStyle('dotted')}>
            Dotted
          </ToolBtn>
        </div>
      ) : null}
    </div>
  )
}

function ToolBtn({
  active,
  onClick,
  title,
  small,
  children,
}: {
  active?: boolean
  onClick: () => void
  title?: string
  small?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={`cm-toolbar-btn${active ? ' active' : ''}${small ? ' small' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onMouseDown={(e) => e.stopPropagation()}
      title={title}
    >
      {children}
    </button>
  )
}

function CursorIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M2 1l11 5-4.6 1.7L7 13z" />
    </svg>
  )
}

function TextIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M3 3h10v2H9v8H7V5H3V3z" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
      <path d="M8 1c-2.8 0-5 2.2-5 5 0 3.8 5 9 5 9s5-5.2 5-9c0-2.8-2.2-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <circle cx="6" cy="7" r="1" fill="currentColor" />
      <path d="M3 12l3-3 2 2 3-4 3 4" />
    </svg>
  )
}

function SvgIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 13c2-1 2-7 5-7s3 6 5 7" />
    </svg>
  )
}

function DrawIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
      <path d="M3 13l8-8 2 2-8 8H3v-2z" />
    </svg>
  )
}
