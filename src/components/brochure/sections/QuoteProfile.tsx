import type { SectionQuoteProfile } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

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
  const { editorMode } = useBrochureBranding()
  const photoUrl = urlForSection(data.photo, 600)

  return (
    <section className="section page-quote-profile" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-quote-profile-inner">
        <div className="quote-profile-left">
          <div className="quote-profile-text">
            {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="quote-profile-eyebrow">{data.eyebrow || ''}</div></InlineEditable> : null}
            {(data.name || editorMode) ? <InlineEditable sectionKey={data._key} field="name"><div className="quote-profile-name">{data.name || ''}</div></InlineEditable> : null}
          </div>
          <InlineMedia sectionKey={data._key} field="photo" hasImage={Boolean(photoUrl)}>
          <div
            className="quote-profile-photo"
            style={photoUrl ? { backgroundImage: `url('${photoUrl}')` } : undefined}
          />
          </InlineMedia>
        </div>
        <div className="quote-profile-right">
          {(data.quote || editorMode) ? <InlineEditable sectionKey={data._key} field="quote"><p className="quote-profile-quote">{data.quote || ''}</p></InlineEditable> : null}
          {(data.body || editorMode) ? <InlineEditable sectionKey={data._key} field="body" richBody><RichBody className="quote-profile-body" text={data.body} /></InlineEditable> : null}
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
