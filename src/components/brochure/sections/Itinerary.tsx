import type { SectionItinerary } from '@/types/brochure'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding } from '../BrochureContext'

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
  const { editorMode } = useBrochureBranding()
  const days = data.days ?? []

  return (
    <section className="section page-itinerary" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-itinerary-inner">
        <div className="itinerary-header">
          <InlineEditable sectionKey={data._key} field="title"><h2 className="itinerary-title">{data.title ?? ''}</h2></InlineEditable>
        </div>
        <div className="itinerary-list">
          {days.map((d, i) => (
            <div key={d._key} className="itinerary-day">
              <InlineEditable sectionKey={data._key} field={`days.${i}.day`}><div className="day-num">{d.day}</div></InlineEditable>
              <InlineEditable sectionKey={data._key} field={`days.${i}.label`}><div className="day-label">{d.label ?? ''}</div></InlineEditable>
              <div className="day-content">
                <InlineEditable sectionKey={data._key} field={`days.${i}.title`}><h4>{d.title}</h4></InlineEditable>
                <InlineEditable sectionKey={data._key} field={`days.${i}.description`} richBody><RichBody text={d.description} /></InlineEditable>
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
