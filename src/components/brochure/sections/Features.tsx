import type { SectionFeatures } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'
import { SectionCTA } from '../SectionCTA'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionFeatures
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Three Features — ported from renderFeatures().
 * Header has an optional red accent suffix on the title, then three image/text cards below.
 * Each card uses the image as a full-bleed background with content overlaid.
 */
export function Features({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const cards = (data.cards ?? []).slice(0, 3)

  return (
    <section className="section page-features" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-features-inner">
        <div className="features-header">
          <h2 className="features-title">
            <InlineEditable sectionKey={data._key} field="title"><span>{data.title ?? ''}</span></InlineEditable>
            {(data.titleAccent || editorMode) ? <InlineEditable sectionKey={data._key} field="titleAccent"><span className="features-title-accent">{data.titleAccent || ''}</span></InlineEditable> : null}
          </h2>
          {(data.subtitle || editorMode) ? <InlineEditable sectionKey={data._key} field="subtitle" richBody><RichBody className="features-subtitle" text={data.subtitle} /></InlineEditable> : null}
          <SectionCTA text={data.ctaText} href={data.ctaHref} />
        </div>
        <div className="features-grid">
          {cards.map((card, i) => {
            const imageUrl = urlForSection(card.image, 900)
            return (
              <div key={card._key} className="feature-card">
                <InlineMedia sectionKey={data._key} field={`cards.${i}.image`} hasImage={Boolean(imageUrl)}>
                  <div
                    className="feature-card-bg"
                    style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
                  >
                    {!imageUrl ? <ImagePlaceholderSVG /> : null}
                  </div>
                </InlineMedia>
                <div className="feature-card-overlay" />
                <div className="feature-card-body">
                  <InlineEditable sectionKey={data._key} field={`cards.${i}.title`}><div className="feature-card-title">{card.title ?? ''}</div></InlineEditable>
                  <InlineEditable sectionKey={data._key} field={`cards.${i}.text`} richBody><RichBody className="feature-card-text" text={card.text} /></InlineEditable>
                </div>
              </div>
            )
          })}
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
