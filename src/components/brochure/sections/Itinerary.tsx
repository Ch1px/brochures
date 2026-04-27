import type { SectionItinerary } from '@/types/brochure'
import { RichBody } from '../RichBody'

type Props = {
  data: SectionItinerary
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Itinerary — ported from renderItinerary().
 * Each day is a row with a big number, weekday label, title, and description.
 */
export function Itinerary({ data, pageNum, total, showFolio }: Props) {
  const days = data.days ?? []

  return (
    <section className="section page-itinerary" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-itinerary-inner">
        <div className="itinerary-header">
          <h2 className="itinerary-title">{data.title ?? ''}</h2>
        </div>
        <div className="itinerary-list">
          {days.map((d) => (
            <div key={d._key} className="itinerary-day">
              <div className="day-num">{d.day}</div>
              <div className="day-label">{d.label ?? ''}</div>
              <div className="day-content">
                <h4>{d.title}</h4>
                <RichBody text={d.description} />
              </div>
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
