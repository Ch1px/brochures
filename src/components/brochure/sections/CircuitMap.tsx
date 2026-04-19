import type { SectionCircuitMap } from '@/types/brochure'

type Props = {
  data: SectionCircuitMap
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Circuit Map — ported from renderCircuitMap().
 * Themed SVG circuit diagram with eyebrow + title + caption header and a
 * stats strip below (up to 3 stats with red-tick accent).
 *
 * The SVG is already themed at upload time via themeCircuitSvg() and stored
 * as XML text on the Sanity circuitMap.svg field. We inline it here via
 * dangerouslySetInnerHTML — safe because the content is authored by admins.
 */
export function CircuitMap({ data, pageNum, total, showFolio }: Props) {
  const hasSvg = Boolean(data.svg && data.svg.trim().length > 0)
  const stats = (data.stats ?? []).slice(0, 3)

  return (
    <section className="section page-circuit-map" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-circuit-map-inner">
        <div className="circuit-map-header">
          {data.eyebrow ? <div className="circuit-map-eyebrow">{data.eyebrow}</div> : null}
          {data.title ? <h2 className="circuit-map-title">{data.title}</h2> : null}
          {data.caption ? <p className="circuit-map-caption">{data.caption}</p> : null}
        </div>
        <div className="circuit-map-stage">
          {hasSvg ? (
            <div
              className="circuit-map-svg-wrap"
              dangerouslySetInnerHTML={{ __html: data.svg! }}
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
          <div className="circuit-map-stats">
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
