'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CircuitDrawing, SectionCircuitMap } from '@/types/brochure'
import { themeCircuitSvg } from '@/lib/themeCircuitSvg'
import { bakeOverridesIntoSvg, bakeRecolorIds } from '@/lib/svgRecolor'
import { useBrochureBranding } from '../BrochureContext'
import { InlineEditable } from '../InlineEditable'
import { RichBody } from '../RichBody'
import { AnnotationOverlay } from './CircuitMapAnnotations'
import { GoogleFontsLink } from '../GoogleFontsLink'
import { useAnnotationDrag } from '@/hooks/useAnnotationDrag'
import { nanokey } from '@/lib/nanokey'
import { FONT_PALETTE } from '@/lib/fontPalette'
import { resolveColor, type BrandContext } from '@/lib/brandColorTokens'
import { DrawingCanvas } from '../../admin/DrawingCanvas'
import { CircuitMapToolbar } from '../../admin/circuitMap/CircuitMapToolbar'

type Props = {
  data: SectionCircuitMap
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Circuit Map — themed SVG with eyebrow + title + caption header and a stats
 * strip below.
 *
 * Rendering pipeline (all string-based so it works in SSR + on the client):
 *   1. `themeCircuitSvg` remaps the F1 source palette to the brochure theme.
 *   2. `bakeRecolorIds` stamps `data-recolor-id="el-N"` on every recolourable
 *      element in document order.
 *   3. `bakeOverridesIntoSvg` injects per-element colour overrides as inline
 *      `style="fill: …; stroke: …"` (auto-detected per element).
 *
 * The result is dropped into the DOM via `dangerouslySetInnerHTML`. There is
 * NO post-mount DOM mutation for colours — every visible state is fully
 * baked into the SVG string before render, so React reconciliation alone
 * keeps the picture in sync with the document.
 *
 * Editor recolour mode: a single click listener at the wrap level uses event
 * delegation (`closest('[data-recolor-id]')`) so it survives any number of
 * SVG re-renders. The handler reports `(sectionKey, elementId, x, y, multi)`
 * up via the BrochureBranding context.
 */
export function CircuitMap({ data, pageNum, total, showFolio }: Props) {
  const { accentColor, backgroundColor, textColor, customColors, theme, editorMode, onRequestMapEdit, recolor, annotations: annotationCtx } = useBrochureBranding()

  const brandCtx: BrandContext = useMemo(
    () => ({ accentColor, backgroundColor, textColor, theme, customColors }),
    [accentColor, backgroundColor, textColor, theme, customColors],
  )

  // The fully-prepared SVG string: themed → ids stamped → overrides injected.
  // Free-hand drawings are NOT baked here; they render as a sibling SVG
  // overlay with the same viewBox so React reconciliation manages them
  // directly (simpler + always in sync with state).
  const themedSvg = useMemo(() => {
    const base =
      data.svgOriginal && data.svgOriginal.trim().length > 0
        ? themeCircuitSvg(data.svgOriginal, accentColor, theme)
        : data.svg ?? ''
    if (!base) return ''
    let svg = bakeRecolorIds(base)
    const overrideMap = new Map<string, string>()
    ;(data.colorOverrides ?? []).forEach((o) => {
      if (o.elementId && o.color) {
        overrideMap.set(o.elementId, resolveColor(o.color, brandCtx))
      }
    })
    if (overrideMap.size > 0) {
      svg = bakeOverridesIntoSvg(svg, overrideMap)
    }
    return svg
  }, [data.svgOriginal, data.svg, data.colorOverrides, accentColor, theme, brandCtx])

  const hasSvg = themedSvg.trim().length > 0
  const stats = (data.stats ?? []).slice(0, 4)
  const annotations = data.annotations ?? []

  // Build a Google Fonts URL for any non-builtin fonts used in text annotations
  const annotationFontsUrl = useMemo(() => {
    const families = new Map<string, string>()
    for (const a of annotations) {
      if (a.kind === 'text' && a.fontFamily) {
        const entry = FONT_PALETTE.find((f) => f.slug === a.fontFamily)
        if (entry && !entry.builtin && entry.googleFamily && !families.has(entry.googleFamily)) {
          families.set(entry.googleFamily, entry.weights ?? '400')
        }
      }
    }
    if (families.size === 0) return null
    const params = Array.from(families.entries())
      .map(([family, weights]) => `family=${family}:wght@${weights}`)
      .join('&')
    return `https://fonts.googleapis.com/css2?${params}&display=swap`
  }, [annotations])

  const sectionKey = data._key

  const overlayRef = useRef<HTMLDivElement | null>(null)

  const handleAnnotationMove = useCallback(
    (key: string, x: number, y: number) => {
      annotationCtx?.onMove(sectionKey, key, x, y)
    },
    [annotationCtx, sectionKey],
  )

  const { getHandleProps, dragInfo } = useAnnotationDrag(overlayRef, handleAnnotationMove)

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      // Draw mode is handled by the DrawingCanvas, not by overlay clicks
      if (annotationCtx?.pendingKind === 'draw') return
      if (!annotationCtx?.pendingKind) {
        annotationCtx?.onSelect(null)
        return
      }
      const overlay = overlayRef.current
      if (!overlay) return
      const rect = overlay.getBoundingClientRect()
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 10000) / 100
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 10000) / 100
      annotationCtx.onPlaceNew(sectionKey, x, y)
    },
    [annotationCtx, sectionKey],
  )

  const handleAnnotationTransform = useCallback(
    (key: string, update: { rotation?: number; scale?: number }) => {
      annotationCtx?.onTransform(sectionKey, key, update)
    },
    [annotationCtx, sectionKey],
  )

  const handleDrawingComplete = useCallback(
    ({ d, strokeWidth, dash }: { d: string; strokeWidth: number; dash: 'solid' | 'dashed' | 'dotted' }) => {
      if (!annotationCtx) return
      const drawing: CircuitDrawing = {
        _key: nanokey(),
        d,
        strokeWidth,
        dash,
        color: 'var:accent',
      }
      annotationCtx.onAddDrawing(sectionKey, drawing)
    },
    [annotationCtx, sectionKey],
  )

  const isRecolorTarget =
    Boolean(editorMode) &&
    Boolean(recolor?.active) &&
    recolor?.targetSectionKey === sectionKey

  const svgWrapRef = useRef<HTMLDivElement | null>(null)
  const svgElRef = useRef<SVGSVGElement | null>(null)
  const [svgViewBox, setSvgViewBox] = useState<string | null>(null)

  // The circuit SVG is inlined via dangerouslySetInnerHTML, so React doesn't
  // give us a ref to it. Query the inlined element to capture its viewBox
  // so overlays can mirror it (same viewBox + preserveAspectRatio = identical
  // letterboxing) and so we can compute the SVG's actual content rect.
  useEffect(() => {
    const el = svgWrapRef.current?.querySelector('svg') as SVGSVGElement | null
    svgElRef.current = el
    if (!el) {
      setSvgViewBox(null)
      return
    }
    const vb = el.getAttribute('viewBox')
    if (vb) {
      setSvgViewBox(vb)
    } else {
      const w = el.getAttribute('width') ?? '1000'
      const h = el.getAttribute('height') ?? '600'
      setSvgViewBox(`0 0 ${w} ${h}`)
    }
  }, [themedSvg])

  // ── Content rect: the SVG's actual rendered content area inside the wrap,
  // accounting for letterboxing under preserveAspectRatio="xMidYMid meet".
  // Used to size the content-frame div that holds all overlays (drawings,
  // annotations, draw canvas) so their coordinates track circuit features
  // exactly across screen sizes — not the wrap box.
  const [contentRect, setContentRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null)

  useEffect(() => {
    const wrap = svgWrapRef.current
    if (!wrap || !svgViewBox) {
      setContentRect(null)
      return
    }
    const parts = svgViewBox.trim().split(/[\s,]+/).map(Number)
    if (parts.length !== 4) return
    const [, , vbW, vbH] = parts
    if (!(vbW > 0 && vbH > 0)) return
    const ar = vbW / vbH

    const update = () => {
      const r = wrap.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) {
        setContentRect(null)
        return
      }
      const wrapAr = r.width / r.height
      let cw: number, ch: number
      if (wrapAr > ar) {
        // wrap wider than SVG aspect → letterbox left/right
        ch = r.height
        cw = ch * ar
      } else {
        // wrap taller than SVG aspect → letterbox top/bottom
        cw = r.width
        ch = cw / ar
      }
      const left = (r.width - cw) / 2
      const top = (r.height - ch) / 2
      setContentRect((prev) =>
        prev && prev.left === left && prev.top === top && prev.width === cw && prev.height === ch
          ? prev
          : { left, top, width: cw, height: ch },
      )
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [svgViewBox])

  // Latest-state ref consumed by the click delegate. Updated every render so
  // the handler always sees the freshest `recolor.onElementClick` without
  // needing to be re-attached.
  const recolorRef = useRef(recolor)
  recolorRef.current = recolor

  // ── Effect: highlight selected elements via a data attribute. Re-applied
  //            after every SVG re-render (which clears DOM-side attributes)
  //            and whenever the selection changes. ───────────────────────────
  useEffect(() => {
    const wrap = svgWrapRef.current
    if (!wrap) return
    const selected = new Set(
      isRecolorTarget && recolor?.selectedIds ? recolor.selectedIds : [],
    )
    const els = wrap.querySelectorAll<SVGElement>('[data-recolor-id]')
    els.forEach((el) => {
      const id = el.getAttribute('data-recolor-id')
      if (id && selected.has(id)) {
        el.setAttribute('data-recolor-selected', 'true')
      } else {
        el.removeAttribute('data-recolor-selected')
      }
    })
  }, [isRecolorTarget, recolor?.selectedIds, themedSvg])

  // ── Effect: single delegated click + mousedown listener at the wrap. ─────
  // Stays attached for the lifetime of the wrap div; SVG re-renders inside
  // it don't affect the listener. Uses `closest()` to walk up to the nearest
  // recolourable element, so clicks on text labels overlapping a path still
  // hit the path beneath when no recolourable ancestor is found, the click
  // is silently swallowed (we still stop propagation so the section-hitbox
  // doesn't fire its onClick).
  useEffect(() => {
    if (!isRecolorTarget) return
    const wrap = svgWrapRef.current
    if (!wrap) return

    const onClick = (e: MouseEvent) => {
      const el = e.target as Element | null
      // Don't intercept clicks targeted at annotations or drawings — those
      // are handled by their own React onClick handlers, and a native
      // stopPropagation here would beat them to the punch (native bubble
      // runs before React's root-delegated handlers).
      if (
        el?.closest('.circuit-map-annotation') ||
        el?.closest('.circuit-map-drawings-overlay')
      ) {
        return
      }
      const target = el?.closest('[data-recolor-id]')
      if (target) {
        e.stopPropagation()
        e.preventDefault()
        const id = target.getAttribute('data-recolor-id')
        if (!id) return
        const multi = e.metaKey || e.ctrlKey || e.shiftKey
        recolorRef.current?.onElementClick(sectionKey, id, e.clientX, e.clientY, multi)
        return
      }
      // Click landed on the wrap but not on a recolourable element — still
      // swallow so the preview-section hitbox doesn't switch sections.
      e.stopPropagation()
      e.preventDefault()
    }

    // Block mousedown bubbling too so any future outside-click logic on the
    // popover doesn't see this as a click outside. Same exception as above:
    // skip when targeting annotations/drawings so their drag/select work.
    const onMouseDown = (e: MouseEvent) => {
      const el = e.target as Element | null
      if (
        el?.closest('.circuit-map-annotation') ||
        el?.closest('.circuit-map-drawings-overlay')
      ) {
        return
      }
      e.stopPropagation()
    }

    wrap.addEventListener('click', onClick)
    wrap.addEventListener('mousedown', onMouseDown)
    return () => {
      wrap.removeEventListener('click', onClick)
      wrap.removeEventListener('mousedown', onMouseDown)
    }
  }, [isRecolorTarget, sectionKey])

  // Click on the SVG wrap triggers map edit mode when not already editing
  useEffect(() => {
    if (!editorMode || isRecolorTarget || !onRequestMapEdit) return
    const wrap = svgWrapRef.current
    if (!wrap) return
    const hasSvgContent = Boolean(data.svg || data.svgOriginal)
    if (!hasSvgContent) return

    const onClick = () => {
      if (!annotationCtx) onRequestMapEdit()
    }
    wrap.addEventListener('click', onClick)
    return () => wrap.removeEventListener('click', onClick)
  }, [editorMode, isRecolorTarget, annotationCtx, onRequestMapEdit, data.svg, data.svgOriginal])

  return (
    <section className="section page-circuit-map" data-section-id={sectionKey}>
      <GoogleFontsLink url={annotationFontsUrl} />
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-circuit-map-inner">
        <div className="circuit-map-header">
          {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="circuit-map-eyebrow">{data.eyebrow}</div></InlineEditable> : null}
          {(data.title || editorMode) ? <InlineEditable sectionKey={data._key} field="title"><h2 className="circuit-map-title">{data.title}</h2></InlineEditable> : null}
          {(data.caption || editorMode) ? <InlineEditable sectionKey={data._key} field="caption" richBody><RichBody className="circuit-map-caption" text={data.caption} /></InlineEditable> : null}
        </div>
        <div className="circuit-map-stage">
          {annotationCtx ? (
            <CircuitMapToolbar
              tool={annotationCtx.pendingKind ?? 'select'}
              onSelectTool={(t) => {
                annotationCtx.onSetPendingKind(t === 'select' ? null : t)
                if (t !== 'select') {
                  annotationCtx.onSelect(null)
                  annotationCtx.onSelectDrawing(null)
                }
              }}
              drawTool={annotationCtx.drawTool}
              onSelectDrawTool={annotationCtx.onSetDrawTool}
              drawStyle={annotationCtx.drawStyle}
              onSelectDrawStyle={annotationCtx.onSetDrawStyle}
            />
          ) : null}
          {hasSvg ? (
            <div
              ref={svgWrapRef}
              className={`circuit-map-svg-wrap${isRecolorTarget ? ' recolor-active' : ''}`}
            >
              <div
                className="circuit-map-svg-content"
                dangerouslySetInnerHTML={{ __html: themedSvg }}
              />
              {contentRect ? (
                <div
                  className="circuit-map-content-frame"
                  style={{
                    left: contentRect.left,
                    top: contentRect.top,
                    width: contentRect.width,
                    height: contentRect.height,
                  }}
                >
                  {svgViewBox && (data.drawings?.length ?? 0) > 0 ? (
                    <DrawingsOverlay
                      viewBox={svgViewBox}
                      drawings={data.drawings ?? []}
                      brandCtx={brandCtx}
                      selectedKey={annotationCtx?.selectedDrawingKey ?? null}
                      onSelect={
                        annotationCtx && annotationCtx.pendingKind === null
                          ? (key) => {
                              annotationCtx.onSelectDrawing(key)
                              if (key) annotationCtx.onSelect(null)
                            }
                          : undefined
                      }
                    />
                  ) : null}
                  {(annotations.length > 0 || annotationCtx) ? (
                    <AnnotationOverlay
                      annotations={annotations}
                      editorMode={Boolean(annotationCtx)}
                      selectedKey={annotationCtx?.selectedKey}
                      overlayRef={overlayRef}
                      onSelect={annotationCtx?.onSelect}
                      onOverlayClick={annotationCtx ? handleOverlayClick : undefined}
                      getHandleProps={annotationCtx ? getHandleProps : undefined}
                      onTransform={annotationCtx ? handleAnnotationTransform : undefined}
                      onUpdate={annotationCtx ? (key: string, update: Record<string, unknown>) => {
                        annotationCtx.onUpdate(sectionKey, key, update)
                      } : undefined}
                      dragInfo={dragInfo}
                      pendingKind={annotationCtx?.pendingKind}
                    />
                  ) : null}
                  {annotationCtx?.pendingKind === 'draw' ? (
                    <DrawingCanvas
                      overlayRef={overlayRef}
                      svgWrapRef={svgWrapRef}
                      viewBox={svgViewBox}
                      strokeWidth={3}
                      tool={annotationCtx.drawTool}
                      style={annotationCtx.drawStyle}
                      onComplete={handleDrawingComplete}
                      onCancel={() => {}}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="circuit-map-svg-wrap">
              <div className="circuit-map-placeholder">
                <svg
                  className="circuit-map-placeholder-icon"
                  viewBox="0 0 80 60"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M10 30 Q 20 12 40 16 T 68 22 Q 72 38 56 42 L 28 44 Q 12 42 10 30 Z" />
                  <circle cx="14" cy="31" r="2" fill="currentColor" />
                  <circle cx="40" cy="16" r="2" fill="currentColor" />
                </svg>
                <div className="circuit-map-placeholder-text">Upload circuit SVG</div>
              </div>
            </div>
          )}
        </div>
        {stats.length > 0 ? (
          <div
            className="circuit-map-stats"
            style={{ ['--stat-count' as string]: stats.length }}
          >
            {stats.map((s, i) => (
              <div key={s._key} className="circuit-map-stat">
                <div className="circuit-map-stat-value">
                  <InlineEditable sectionKey={data._key} field={`stats.${i}.value`}><span>{s.value}</span></InlineEditable>
                  {s.unit ? <span className="circuit-map-stat-unit">{s.unit}</span> : null}
                </div>
                <InlineEditable sectionKey={data._key} field={`stats.${i}.label`}><div className="circuit-map-stat-label">{s.label}</div></InlineEditable>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}

/**
 * Drawings overlay — a sibling SVG inside the same `.circuit-map-stage` flex
 * container as the inlined circuit SVG. Both fill the stage at 100% and
 * use the same viewBox + preserveAspectRatio, so the browser's letterboxing
 * is identical and viewBox-coord paths line up exactly with circuit features.
 *
 * No rect tracking needed — relies purely on CSS layout.
 */
function DrawingsOverlay({
  viewBox,
  drawings,
  brandCtx,
  selectedKey,
  onSelect,
}: {
  viewBox: string
  drawings: CircuitDrawing[]
  brandCtx: BrandContext
  selectedKey?: string | null
  onSelect?: (key: string | null) => void
}) {
  const editable = Boolean(onSelect)
  return (
    <svg
      className={`circuit-map-drawings-overlay${editable ? ' editable' : ''}`}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      onClick={
        editable
          ? (e) => {
              if (e.target === e.currentTarget) onSelect?.(null)
            }
          : undefined
      }
    >
      {drawings.map((dr) => {
        const stroke = dr.color ? resolveColor(dr.color, brandCtx) : '#e10600'
        const sw = dr.strokeWidth || 1
        let dasharray: string | undefined
        if (dr.dash === 'dotted') dasharray = `0 ${(sw * 2).toFixed(2)}`
        else if (dr.dash === 'dashed') dasharray = `${(sw * 3).toFixed(2)} ${(sw * 2).toFixed(2)}`
        const tx = dr.tx ?? 0
        const ty = dr.ty ?? 0
        const transform = tx !== 0 || ty !== 0 ? `translate(${tx} ${ty})` : undefined
        const isSelected = selectedKey === dr._key
        return (
          <g key={dr._key} transform={transform}>
            {/* Wide invisible hit-area so thin strokes are easy to click. */}
            {editable ? (
              <path
                d={dr.d}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(sw * 4, 6)}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.(dr._key)
                }}
              />
            ) : null}
            <path
              d={dr.d}
              fill="none"
              stroke={stroke}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dasharray}
              opacity={dr.opacity != null && dr.opacity < 1 ? dr.opacity : undefined}
              data-circuit-drawing={dr._key}
              data-selected={isSelected || undefined}
              style={{ pointerEvents: 'none' }}
            />
            {isSelected ? (
              <path
                d={dr.d}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={Math.max(sw * 0.5, 1)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${(sw * 2).toFixed(2)} ${(sw * 1.5).toFixed(2)}`}
                style={{ pointerEvents: 'none' }}
              />
            ) : null}
          </g>
        )
      })}
    </svg>
  )
}
