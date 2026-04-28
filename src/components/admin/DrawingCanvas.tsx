'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Point = { x: number; y: number }

type Props = {
  overlayRef: React.RefObject<HTMLDivElement | null>
  strokeWidth: number
  onComplete: (svgText: string, x: number, y: number, width: number) => void
  onCancel: () => void
}

/**
 * Freehand drawing tool for the circuit map.
 *
 * Two layers:
 *   1. Hit area — absolute-positioned inside .circuit-map-stage, constrains
 *      where drawing can start to the map area only.
 *   2. Render layer — fixed full-viewport SVG with pointer-events:none,
 *      shows the live stroke preview without being clipped by parent overflow.
 *
 * Points are tracked in viewport coordinates. On finalize they're converted
 * to overlay-relative coordinates for the annotation.
 */
export function DrawingCanvas({ overlayRef, strokeWidth, onComplete }: Props) {
  const [points, setPoints] = useState<Point[]>([])
  const drawingRef = useRef(false)
  const pointsRef = useRef<Point[]>([])

  const finalize = useCallback((viewportPts: Point[]) => {
    const overlay = overlayRef.current
    if (!overlay || viewportPts.length < 2) return
    const overlayRect = overlay.getBoundingClientRect()

    const pts = viewportPts.map((p) => ({
      x: p.x - overlayRect.left,
      y: p.y - overlayRect.top,
    }))

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const p of pts) {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    }

    const pad = strokeWidth * 2
    minX -= pad; minY -= pad; maxX += pad; maxY += pad
    const w = maxX - minX
    const h = maxY - minY
    if (w < 1 || h < 1) return

    const d = buildSmoothPath(pts.map((p) => ({ x: p.x - minX, y: p.y - minY })))

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w.toFixed(1)} ${h.toFixed(1)}">`,
      `<path d="${d}" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`,
      `</svg>`,
    ].join('')

    const cx = ((minX + w / 2) / overlayRect.width) * 100
    const cy = ((minY + h / 2) / overlayRect.height) * 100
    const widthCqi = (w / overlayRect.width) * 100

    onComplete(svg, Math.round(cx * 100) / 100, Math.round(cy * 100) / 100, Math.round(widthCqi * 100) / 100)
  }, [overlayRef, strokeWidth, onComplete])

  function handleMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const pt = { x: e.clientX, y: e.clientY }
    drawingRef.current = true
    pointsRef.current = [pt]
    setPoints([pt])
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!drawingRef.current) return
      const pt = { x: e.clientX, y: e.clientY }
      pointsRef.current.push(pt)
      setPoints([...pointsRef.current])
    }

    const onUp = () => {
      if (!drawingRef.current) return
      drawingRef.current = false
      const pts = pointsRef.current
      if (pts.length >= 2) {
        finalize(pts)
      }
      pointsRef.current = []
      setPoints([])
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [finalize])

  const livePath = points.length >= 2 ? buildSmoothPath(points) : ''

  return (
    <>
      {/* Hit area — constrained to the map, captures mousedown */}
      <div className="drawing-canvas-hitarea" onMouseDown={handleMouseDown} />
      {/* Render layer — full viewport, never clipped, pointer-events: none */}
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
            opacity={0.7}
          />
        </svg>
      ) : null}
    </>
  )
}

function buildSmoothPath(pts: Point[]): string {
  if (pts.length < 2) return ''
  const parts: string[] = [`M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`]

  if (pts.length === 2) {
    parts.push(`L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`)
    return parts.join(' ')
  }

  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i + 1].x) / 2
    const midY = (pts[i].y + pts[i + 1].y) / 2
    parts.push(`Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${midX.toFixed(1)} ${midY.toFixed(1)}`)
  }
  const last = pts[pts.length - 1]
  parts.push(`L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`)

  return parts.join(' ')
}
