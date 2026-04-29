'use client'

import { useRef, useState } from 'react'

type Point = { x: number; y: number }

export type DrawTool = 'freehand' | 'line'
export type DrawStyle = 'solid' | 'dashed' | 'dotted'

type Props = {
  /** Hit-area covers this element (the annotation overlay). */
  overlayRef: React.RefObject<HTMLDivElement | null>
  /** The container element holding the inlined circuit SVG. Its bounding rect
   *  defines where the SVG renders on screen. */
  svgWrapRef: React.RefObject<HTMLDivElement | null>
  /** ViewBox string of the inlined SVG ("x y w h"). Used together with the
   *  wrap rect to convert pointer coords to viewBox coords (with letterboxing
   *  under preserveAspectRatio="xMidYMid meet"). */
  viewBox: string | null
  /** Stroke width in CSS pixels at draw time (converted to viewBox units on save). */
  strokeWidth: number
  tool: DrawTool
  style: DrawStyle
  /**
   * Called once on stroke release with the path data and metadata in
   * **viewBox coordinates** of the parent SVG.
   */
  onComplete: (drawing: { d: string; strokeWidth: number; dash: DrawStyle }) => void
  onCancel: () => void
}

/**
 * Drawing tool for the circuit map.
 *
 * Captures pointer events, converts each point from viewport pixels into the
 * parent SVG's viewBox coordinate space, and emits a path-data string in
 * those coordinates. The result is baked into the circuit SVG itself so the
 * drawing scales identically with the map across screen sizes — no
 * letterbox drift.
 *
 * Two layers:
 *   1. Hit area — absolute-positioned over the annotation overlay, accepts
 *      pointer events with capture so touch / pen / mouse all work.
 *   2. Live preview — fixed full-viewport SVG with pointer-events:none,
 *      shows the in-progress stroke without being clipped.
 */
export function DrawingCanvas({ overlayRef, svgWrapRef, viewBox, strokeWidth, tool, style, onComplete }: Props) {
  const [points, setPoints] = useState<Point[]>([])
  const drawingRef = useRef(false)
  const pointsRef = useRef<Point[]>([])
  const overlayBoundsRef = useRef<DOMRect | null>(null)

  function clampToOverlay(x: number, y: number): Point {
    const r = overlayBoundsRef.current
    if (!r) return { x, y }
    return {
      x: Math.max(r.left, Math.min(r.right, x)),
      y: Math.max(r.top, Math.min(r.bottom, y)),
    }
  }

  function buildPath(pts: Point[]): string {
    if (tool === 'line') return buildLinePath(pts)
    return buildSmoothPath(pts)
  }

  /**
   * Convert viewport-pixel points to the SVG's viewBox coordinate space and
   * emit the drawing. We use the SVG's bounding rect (which accounts for
   * `preserveAspectRatio` letterboxing) so points map exactly to the visible
   * SVG content.
   */
  function finalize(viewportPts: Point[]) {
    const wrap = svgWrapRef.current
    if (!wrap || !viewBox || viewportPts.length < 2) return
    const svgRect = wrap.getBoundingClientRect()
    if (svgRect.width < 1 || svgRect.height < 1) return

    // Parse "x y w h" viewBox string
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)
    const [vbX, vbY, vbW, vbH] = parts.length === 4 ? parts : [0, 0, svgRect.width, svgRect.height]
    if (!(vbW > 0 && vbH > 0)) return

    // preserveAspectRatio defaults to "xMidYMid meet" — the SVG content fits
    // within its rendered rect, centred, with letterbox padding on the longer
    // axis. Compute the actual rendered content rect so points outside (in
    // the letterbox zone) still map sensibly.
    const scale = Math.min(svgRect.width / vbW, svgRect.height / vbH)
    const renderedW = vbW * scale
    const renderedH = vbH * scale
    const offsetX = svgRect.left + (svgRect.width - renderedW) / 2
    const offsetY = svgRect.top + (svgRect.height - renderedH) / 2

    const pts = viewportPts.map((p) => ({
      x: vbX + (p.x - offsetX) / scale,
      y: vbY + (p.y - offsetY) / scale,
    }))

    const d = buildPath(pts)
    // Stroke width is captured in CSS pixels (the user's intent at this
    // screen size), translated into viewBox units so it scales like content.
    const swViewBox = strokeWidth / scale

    onComplete({
      d,
      strokeWidth: Math.round(swViewBox * 100) / 100,
      dash: style,
    })
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (!e.isPrimary) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    overlayBoundsRef.current = overlayRef.current?.getBoundingClientRect() ?? null
    const pt = clampToOverlay(e.clientX, e.clientY)
    drawingRef.current = true
    pointsRef.current = [pt]
    setPoints([pt])
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawingRef.current) return
    const pt = clampToOverlay(e.clientX, e.clientY)
    if (tool === 'line') {
      const start = pointsRef.current[0]
      pointsRef.current = start ? [start, pt] : [pt]
    } else {
      pointsRef.current.push(pt)
    }
    setPoints([...pointsRef.current])
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!drawingRef.current) return
    drawingRef.current = false
    const pts = pointsRef.current
    if (pts.length >= 2) finalize(pts)
    pointsRef.current = []
    overlayBoundsRef.current = null
    setPoints([])
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLDivElement>) {
    drawingRef.current = false
    pointsRef.current = []
    overlayBoundsRef.current = null
    setPoints([])
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const livePath = points.length >= 2 ? buildPath(points) : ''
  const liveDash = dashArrayCss(style, strokeWidth)

  return (
    <>
      <div
        className="drawing-canvas-hitarea"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />
      {livePath ? (
        <svg
          className="drawing-canvas-render"
          viewBox={`0 0 ${typeof window !== 'undefined' ? window.innerWidth : 1920} ${typeof window !== 'undefined' ? window.innerHeight : 1080}`}
        >
          <path
            d={livePath}
            fill="none"
            stroke="var(--brand-red)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={liveDash}
            opacity={0.7}
          />
        </svg>
      ) : null}
    </>
  )
}

function buildSmoothPath(pts: Point[]): string {
  if (pts.length < 2) return ''
  const parts: string[] = [`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`]

  if (pts.length === 2) {
    parts.push(`L ${pts[1].x.toFixed(2)} ${pts[1].y.toFixed(2)}`)
    return parts.join(' ')
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2
    const midY = (pts[i].y + pts[i + 1].y) / 2
    parts.push(`Q ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`)
  }
  const last = pts[pts.length - 1]
  parts.push(`L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`)

  return parts.join(' ')
}

function buildLinePath(pts: Point[]): string {
  if (pts.length < 2) return ''
  const a = pts[0]
  const b = pts[pts.length - 1]
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

function dashArrayCss(style: DrawStyle, sw: number): string | undefined {
  if (style === 'solid') return undefined
  if (style === 'dotted') return `0 ${(sw * 2).toFixed(1)}`
  return `${(sw * 3).toFixed(1)} ${(sw * 2).toFixed(1)}`
}
