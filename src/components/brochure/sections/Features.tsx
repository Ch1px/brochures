import type { SectionFeatures } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'

type Props = {
  data: SectionFeatures
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Three Features — ported from renderFeatures().
 * Header has an optional red accent suffix on the title, then three image/text cards below.
 */
export function Features({ data, pageNum, total, showFolio }: Props) {
  const cards = (data.cards ?? []).slice(0, 3)

  return (
    <section className="section page-features" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-features-inner">
        <div className="features-header">
          <h2 className="features-title">
            {data.title ?? ''}
            {data.titleAccent ? (
              <>
                {' '}
                <span className="features-title-accent">{data.titleAccent}</span>
              </>
            ) : null}
          </h2>
          {data.subtitle ? <p className="features-subtitle">{data.subtitle}</p> : null}
        </div>
        <div className="features-grid">
          {cards.map((card) => {
            const imageUrl = urlForSection(card.image, 900)
            return (
              <div key={card._key} className="feature-card">
                <div
                  className="feature-card-media"
                  style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
                >
                  {!imageUrl ? <ImagePlaceholderSVG /> : null}
                </div>
                <div className="feature-card-body">
                  <div className="feature-card-title">{card.title ?? ''}</div>
                  <p className="feature-card-text">{card.text ?? ''}</p>
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
