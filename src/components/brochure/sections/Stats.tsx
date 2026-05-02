import type { SectionStats } from '@/types/brochure'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding, useEyebrowNormaliser, useTitleNormaliser } from '../BrochureContext'

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
  const { editorMode } = useBrochureBranding()
  const titleN = useTitleNormaliser()
  const eyebrowN = useEyebrowNormaliser()
  const stats = data.stats ?? []
  const colClass = stats.length <= 2 ? 'cols-2' : stats.length === 3 ? 'cols-3' : ''

  return (
    <section className="section page-stats" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-stats-inner">
        <div className="stats-header">
          {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="stats-eyebrow">{eyebrowN(data.eyebrow)}</div></InlineEditable> : null}
          <InlineEditable sectionKey={data._key} field="title"><h2 className="stats-title">{titleN(data.title)}</h2></InlineEditable>
        </div>
        <div className={`stats-grid ${colClass}`.trim()}>
          {stats.map((s, i) => (
            <div key={s._key} className="stats-cell">
              <div className="stat-value">
                <InlineEditable sectionKey={data._key} field={`stats.${i}.value`}><span>{s.value}</span></InlineEditable>
                {s.unit ? <span className="stat-unit">{s.unit}</span> : null}
              </div>
              <InlineEditable sectionKey={data._key} field={`stats.${i}.label`}><div className="stat-label">{s.label}</div></InlineEditable>
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
