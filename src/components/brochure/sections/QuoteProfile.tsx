import type { SectionQuoteProfile } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { RichBody } from '../RichBody'

type Props = {
  data: SectionQuoteProfile
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Quote + Profile — ported from renderQuoteProfile().
 * Left column: eyebrow + name (Northwell script) + circular photo with red ring.
 * Right column: italic quote with red-bar accent + body text.
 */
export function QuoteProfile({ data, pageNum, total, showFolio }: Props) {
  const photoUrl = urlForSection(data.photo, 600)

  return (
    <section className="section page-quote-profile" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-quote-profile-inner">
        <div className="quote-profile-left">
          {data.eyebrow ? <div className="quote-profile-eyebrow">{data.eyebrow}</div> : null}
          {data.name ? <div className="quote-profile-name">{data.name}</div> : null}
          <div
            className="quote-profile-photo"
            style={photoUrl ? { backgroundImage: `url('${photoUrl}')` } : undefined}
          />
        </div>
        <div className="quote-profile-right">
          {data.quote ? <p className="quote-profile-quote">{data.quote}</p> : null}
          {data.body ? <RichBody className="quote-profile-body" text={data.body} /> : null}
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
