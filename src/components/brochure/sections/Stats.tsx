import type { SectionStats } from '@/types/brochure'

type Props = {
  data: SectionStats
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Numbers — ported from renderStats().
 * Column class adjusts based on stat count:
 *   1–2 stats → .cols-2
 *   3 stats   → .cols-3
 *   4+ stats  → default 4-column layout
 */
export function Stats({ data, pageNum, total, showFolio }: Props) {
  const stats = data.stats ?? []
  const colClass = stats.length <= 2 ? 'cols-2' : stats.length === 3 ? 'cols-3' : ''

  return (
    <section className="section page-stats" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-stats-inner">
        <div className="stats-header">
          {data.eyebrow ? <div className="stats-eyebrow">{data.eyebrow}</div> : null}
          <h2 className="stats-title">{data.title ?? ''}</h2>
        </div>
        <div className={`stats-grid ${colClass}`.trim()}>
          {stats.map((s) => (
            <div key={s._key} className="stats-cell">
              <div className="stat-value">
                {s.value}
                {s.unit ? <span className="stat-unit">{s.unit}</span> : null}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
