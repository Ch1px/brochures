'use client'

import { useRef, type CSSProperties } from 'react'
import type { Annotation } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { FONT_PALETTE } from '@/lib/fontPalette'
import { resolveColor, type BrandContext } from '@/lib/brandColorTokens'
import { useBrochureBranding } from '../BrochureContext'
import type { DragInfo } from '@/hooks/useAnnotationDrag'

type OverlayProps = {
  annotations: Annotation[]
  editorMode?: boolean
  selectedKey?: string | null
  overlayRef?: React.RefObject<HTMLDivElement | null>
  onSelect?: (key: string | null) => void
  onOverlayClick?: (e: React.MouseEvent) => void
  getHandleProps?: (key: string) => { onMouseDown: (e: React.MouseEvent) => void }
  onTransform?: (key: string, update: { rotation?: number; scale?: number }) => void
  onUpdate?: (key: string, update: Record<string, unknown>) => void
  dragInfo?: DragInfo
  pendingKind?: string | null
}

export function AnnotationOverlay({
  annotations,
  editorMode,
  selectedKey,
  overlayRef,
  onSelect,
  onOverlayClick,
  getHandleProps,
  onTransform,
  onUpdate,
  dragInfo,
  pendingKind,
}: OverlayProps) {
  return (
    <div
      ref={overlayRef}
      className={`circuit-map-annotation-overlay${pendingKind && pendingKind !== 'draw' ? ' placing' : ''}`}
      onClick={(e) => {
        if (!editorMode) return
        // If click was directly on the overlay (not on an annotation), deselect or place
        if (e.target === e.currentTarget) {
          if (onOverlayClick) {
            onOverlayClick(e)
          } else {
            onSelect?.(null)
          }
        }
      }}
    >
      {annotations.map((a) => (
        <AnnotationElement
          key={a._key}
          annotation={a}
          editorMode={editorMode}
          isSelected={selectedKey === a._key}
          onSelect={onSelect}
          handleProps={getHandleProps?.(a._key)}
          onTransform={onTransform}
          onUpdate={onUpdate}
        />
      ))}
      {dragInfo ? (
        <div
          className="annotation-drag-tooltip"
          style={{ left: `${dragInfo.x}%`, top: `${dragInfo.y}%` }}
        >
          {dragInfo.x.toFixed(1)}%, {dragInfo.y.toFixed(1)}%
        </div>
      ) : null}
    </div>
  )
}

type ElementProps = {
  annotation: Annotation
  editorMode?: boolean
  isSelected?: boolean
  onSelect?: (key: string | null) => void
  handleProps?: { onMouseDown: (e: React.MouseEvent) => void }
  onTransform?: (key: string, update: { rotation?: number; scale?: number }) => void
  onUpdate?: (key: string, update: Record<string, unknown>) => void
}

function AnnotationElement({ annotation, editorMode, isSelected, onSelect, handleProps, onTransform, onUpdate }: ElementProps) {
  const a = annotation
  const { accentColor, backgroundColor, textColor, theme } = useBrochureBranding()
  const brandCtx: BrandContext = { accentColor, backgroundColor, textColor, theme }
  const resolvedColor = a.color ? resolveColor(a.color, brandCtx) : undefined
  const elRef = useRef<HTMLDivElement | null>(null)
  const style: CSSProperties = {
    left: `${a.x}%`,
    top: `${a.y}%`,
    transform: `translate(-50%, -50%) scale(${a.scale ?? 1}) rotate(${a.rotation ?? 0}deg)`,
    color: resolvedColor,
    opacity: a.opacity != null ? a.opacity : undefined,
  }

  return (
    <div
      ref={elRef}
      className={`circuit-map-annotation circuit-map-annotation-${a.kind}`}
      style={style}
      data-selected={isSelected || undefined}
      onClick={editorMode ? (e) => { e.stopPropagation(); onSelect?.(a._key) } : undefined}
      {...(editorMode ? handleProps : {})}
    >
      {a.kind === 'text' ? (
        <AnnotationTextContent annotation={a} editorMode={editorMode} isSelected={isSelected} onUpdate={onUpdate} />
      ) : a.kind === 'image' ? (
        <AnnotationImageContent annotation={a} />
      ) : a.kind === 'pin' ? (
        <AnnotationPinContent annotation={a} />
      ) : a.kind === 'svg' ? (
        <AnnotationSvgContent annotation={a} />
      ) : null}
      {editorMode && isSelected && onTransform ? (
        <TransformHandles
          annotationKey={a._key}
          annotationKind={a.kind}
          elRef={elRef}
          overlayEl={typeof document !== 'undefined' ? elRef.current?.closest('.circuit-map-annotation-overlay') as HTMLElement | null : null}
          currentRotation={a.rotation ?? 0}
          currentScale={a.scale ?? 1}
          currentWidth={a.kind === 'text' ? (a as any).width : undefined}
          onTransform={onTransform}
          onUpdate={onUpdate}
        />
      ) : null}
    </div>
  )
}

/**
 * Rotation + resize + width handles shown on the selected annotation in editor mode.
 * - Rotate handle: circular dot above the annotation
 * - Resize handle: square at bottom-right corner (scale)
 * - Width handle: vertical bar on the right edge (text annotations only)
 */
function TransformHandles({
  annotationKey,
  annotationKind,
  elRef,
  overlayEl,
  currentRotation,
  currentScale,
  currentWidth,
  onTransform,
  onUpdate,
}: {
  annotationKey: string
  annotationKind: string
  elRef: React.RefObject<HTMLDivElement | null>
  overlayEl: HTMLElement | null
  currentRotation: number
  currentScale: number
  currentWidth?: number
  onTransform: (key: string, update: { rotation?: number; scale?: number }) => void
  onUpdate?: (key: string, update: Record<string, unknown>) => void
}) {
  const stateRef = useRef({ rotation: currentRotation, scale: currentScale, width: currentWidth })
  stateRef.current = { rotation: currentRotation, scale: currentScale, width: currentWidth }

  function startRotate(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const el = elRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI)
    const startRotation = stateRef.current.rotation

    const onMove = (ev: MouseEvent) => {
      const angle = Math.atan2(ev.clientY - cy, ev.clientX - cx) * (180 / Math.PI)
      const delta = angle - startAngle
      let newRotation = Math.round(startRotation + delta)
      newRotation = ((newRotation % 360) + 360) % 360
      onTransform(annotationKey, { rotation: newRotation })
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor = 'grabbing'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const el = elRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const startDist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2)
    const startScale = stateRef.current.scale
    if (startDist < 1) return

    const onMove = (ev: MouseEvent) => {
      const dist = Math.sqrt((ev.clientX - cx) ** 2 + (ev.clientY - cy) ** 2)
      const ratio = dist / startDist
      const newScale = Math.round(Math.min(4, Math.max(0.25, startScale * ratio)) * 100) / 100
      onTransform(annotationKey, { scale: newScale })
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor = 'nwse-resize'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function startWidthResize(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!overlayEl || !onUpdate) return
    const overlayRect = overlayEl.getBoundingClientRect()
    const overlayWidth = overlayRect.width
    const startX = e.clientX
    const el = elRef.current
    if (!el) return
    const elRect = el.getBoundingClientRect()
    const startWidthPx = elRect.width

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const newWidthPx = Math.max(20, startWidthPx + dx * 2) // *2 because element is centered
      // Convert px to cqi (percentage of container inline size)
      const newWidthCqi = Math.round((newWidthPx / overlayWidth) * 100 * 100) / 100
      onUpdate(annotationKey, { width: Math.max(2, newWidthCqi) })
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor = 'ew-resize'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <>
      <div className="annotation-handle-rotate" onMouseDown={startRotate} title="Drag to rotate">
        <div className="annotation-handle-rotate-line" />
        <div className="annotation-handle-rotate-dot" />
      </div>
      <div className="annotation-handle-resize" onMouseDown={startResize} title="Drag to resize" />
      {annotationKind === 'text' ? (
        <div className="annotation-handle-width" onMouseDown={startWidthResize} title="Drag to set width" />
      ) : null}
    </>
  )
}

function resolveFontFamily(slug?: string): string | undefined {
  if (!slug) return undefined
  const entry = FONT_PALETTE.find((f) => f.slug === slug)
  return entry?.family
}

function AnnotationTextContent({
  annotation: a,
  editorMode,
  isSelected,
  onUpdate,
}: {
  annotation: Annotation & { kind: 'text' }
  editorMode?: boolean
  isSelected?: boolean
  onUpdate?: (key: string, update: Record<string, unknown>) => void
}) {
  const spanRef = useRef<HTMLSpanElement>(null)

  function handleDoubleClick(e: React.MouseEvent) {
    if (!editorMode || !spanRef.current) return
    e.stopPropagation()
    const el = spanRef.current
    el.contentEditable = 'true'
    el.focus()
    // Select all text
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
  }

  function handleBlur() {
    const el = spanRef.current
    if (!el) return
    el.contentEditable = 'false'
    const text = el.innerText?.trim() || 'Text'
    onUpdate?.(a._key, { label: text })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // Enter inserts a newline; stop propagation so it doesn't bubble
    if (e.key === 'Enter') {
      e.stopPropagation()
      // Let the default contentEditable behavior insert the newline
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      // Commit on Escape (blur triggers save)
      spanRef.current?.blur()
    }
  }

  return (
    <span
      ref={spanRef}
      className="circuit-map-annotation-text-label"
      style={{
        fontSize: a.fontSize ? `${a.fontSize}cqi` : undefined,
        fontFamily: resolveFontFamily(a.fontFamily),
        fontWeight: a.fontWeight || 400,
        width: a.width ? `${a.width}cqi` : undefined,
      }}
      onDoubleClick={editorMode ? handleDoubleClick : undefined}
      onBlur={editorMode ? handleBlur : undefined}
      onKeyDown={editorMode ? handleKeyDown : undefined}
      suppressContentEditableWarning
    >
      {a.label || 'Text'}
    </span>
  )
}

function AnnotationImageContent({ annotation: a }: { annotation: Annotation & { kind: 'image' } }) {
  const url = a.image ? urlForSection(a.image, 800) : null
  if (!url) {
    return <div className="circuit-map-annotation-image-placeholder">Image</div>
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="circuit-map-annotation-image-img"
      style={{ width: a.width ? `${a.width}cqi` : '10cqi' }}
      draggable={false}
    />
  )
}

function AnnotationPinContent({ annotation: a }: { annotation: Annotation & { kind: 'pin' } }) {
  const icon = a.icon ?? 'pin'
  return (
    <div className="circuit-map-annotation-pin-wrap">
      {icon === 'pin' ? (
        <svg viewBox="0 0 24 36" fill="currentColor" className="circuit-map-annotation-pin-icon">
          <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0zm0 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" />
        </svg>
      ) : icon === 'flag' ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="circuit-map-annotation-pin-icon">
          <path d="M5 2v20h2v-8h4l1 2h7V4h-7l-1-2H5z" />
        </svg>
      ) : icon === 'dot' ? (
        <svg viewBox="0 0 24 24" fill="currentColor" className="circuit-map-annotation-pin-icon">
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" fill="rgba(0,0,0,0.3)" />
        </svg>
      ) : icon === 'number' ? (
        <div className="circuit-map-annotation-pin-number">{a.number ?? 1}</div>
      ) : null}
      {a.label ? <span className="circuit-map-annotation-pin-label">{a.label}</span> : null}
    </div>
  )
}

function AnnotationSvgContent({ annotation: a }: { annotation: Annotation & { kind: 'svg' } }) {
  if (!a.svgText) {
    return <div className="circuit-map-annotation-image-placeholder">SVG</div>
  }
  return (
    <div
      className={`circuit-map-annotation-svg-wrap${a.strokeMode ? ' stroke-mode' : ''}`}
      style={{ width: a.width ? `${a.width}cqi` : '6cqi' }}
      dangerouslySetInnerHTML={{ __html: a.svgText }}
    />
  )
}
