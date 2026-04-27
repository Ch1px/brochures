'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { SectionCircuitMap } from '@/types/brochure'
import { themeCircuitSvg } from '@/lib/themeCircuitSvg'
import { bakeOverridesIntoSvg, bakeRecolorIds } from '@/lib/svgRecolor'
import { useBrochureBranding } from '../BrochureContext'
import { RichBody } from '../RichBody'

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
  const { accentColor, theme, editorMode, recolor } = useBrochureBranding()

  // The fully-prepared SVG string: themed → ids stamped → overrides injected.
  const themedSvg = useMemo(() => {
    const base =
      data.svgOriginal && data.svgOriginal.trim().length > 0
        ? themeCircuitSvg(data.svgOriginal, accentColor, theme)
        : data.svg ?? ''
    if (!base) return ''
    let svg = bakeRecolorIds(base)
    const overrideMap = new Map<string, string>()
    ;(data.colorOverrides ?? []).forEach((o) => {
      if (o.elementId && o.color) overrideMap.set(o.elementId, o.color)
    })
    if (overrideMap.size > 0) {
      svg = bakeOverridesIntoSvg(svg, overrideMap)
    }
    return svg
  }, [data.svgOriginal, data.svg, data.colorOverrides, accentColor, theme])

  const hasSvg = themedSvg.trim().length > 0
  const stats = (data.stats ?? []).slice(0, 4)

  const sectionKey = data._key
  const isRecolorTarget =
    Boolean(editorMode) &&
    Boolean(recolor?.active) &&
    recolor?.targetSectionKey === sectionKey

  const svgWrapRef = useRef<HTMLDivElement | null>(null)

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
      // Always stop propagation in recolour mode so the preview-section
      // hitbox doesn't pick up the click and switch sections.
      e.stopPropagation()
      e.preventDefault()
      const target = (e.target as Element | null)?.closest('[data-recolor-id]')
      if (!target) return
      const id = target.getAttribute('data-recolor-id')
      if (!id) return
      const multi = e.metaKey || e.ctrlKey || e.shiftKey
      recolorRef.current?.onElementClick(sectionKey, id, e.clientX, e.clientY, multi)
    }

    // Block mousedown bubbling too so any future outside-click logic on the
    // popover doesn't see this as a click outside.
    const onMouseDown = (e: MouseEvent) => {
      e.stopPropagation()
    }

    wrap.addEventListener('click', onClick)
    wrap.addEventListener('mousedown', onMouseDown)
    return () => {
      wrap.removeEventListener('click', onClick)
      wrap.removeEventListener('mousedown', onMouseDown)
    }
  }, [isRecolorTarget, sectionKey])

  return (
    <section className="section page-circuit-map" data-section-id={sectionKey}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-circuit-map-inner">
        <div className="circuit-map-header">
          {data.eyebrow ? <div className="circuit-map-eyebrow">{data.eyebrow}</div> : null}
          {data.title ? <h2 className="circuit-map-title">{data.title}</h2> : null}
          {data.caption ? <RichBody className="circuit-map-caption" text={data.caption} /> : null}
        </div>
        <div className="circuit-map-stage">
          {hasSvg ? (
            <div
              ref={svgWrapRef}
              className={`circuit-map-svg-wrap${isRecolorTarget ? ' recolor-active' : ''}`}
              dangerouslySetInnerHTML={{ __html: themedSvg }}
            />
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
            {stats.map((s) => (
              <div key={s._key} className="circuit-map-stat">
                <div className="circuit-map-stat-value">
                  {s.value}
                  {s.unit ? <span className="circuit-map-stat-unit">{s.unit}</span> : null}
                </div>
                <div className="circuit-map-stat-label">{s.label}</div>
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
