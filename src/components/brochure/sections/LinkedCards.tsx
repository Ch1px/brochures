import type { SectionLinkedCards } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionLinkedCards
  pageNum: number
  total: number
  showFolio: boolean
}

export function LinkedCards({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const cards = (data.cards ?? []).slice(0, 4)

  return (
    <section className={`section page-linked-cards lc-overlay-${data.overlayStrength ?? 'medium'}`} data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-linked-cards-inner" data-align={data.contentAlign || undefined}>
        {(data.eyebrow || data.title || editorMode) ? (
          <div className="linked-cards-header">
            {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="linked-cards-eyebrow">{data.eyebrow || ''}</div></InlineEditable> : null}
            {(data.title || editorMode) ? <InlineEditable sectionKey={data._key} field="title"><h2 className="linked-cards-title">{data.title || ''}</h2></InlineEditable> : null}
          </div>
        ) : null}
        <div className={`linked-cards-grid linked-cards-grid-${Math.min(cards.length, 4)}`}>
          {cards.map((card, i) => {
            const imageUrl = urlForSection(card.image, 900)
            const isExternal = card.linkHref?.startsWith('http')
            return (
              <div key={card._key} className="linked-card">
                <InlineMedia sectionKey={data._key} field={`cards.${i}.image`} hasImage={Boolean(imageUrl)}>
                  <div className="linked-card-bg">
                    {imageUrl ? (
                      <div
                        className="media-bg-layer"
                        style={{ backgroundImage: `url('${imageUrl}')` }}
                      />
                    ) : (
                      <ImagePlaceholderSVG />
                    )}
                  </div>
                </InlineMedia>
                <div className="linked-card-body">
                  <InlineEditable sectionKey={data._key} field={`cards.${i}.title`}><div className="linked-card-title">{card.title ?? ''}</div></InlineEditable>
                  {(card.text || editorMode) ? <InlineEditable sectionKey={data._key} field={`cards.${i}.text`}><p className="linked-card-text">{card.text || ''}</p></InlineEditable> : null}
                  {card.linkText ? (
                    <a
                      className="linked-card-link"
                      href={card.linkHref || '#'}
                      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {card.linkText}
                      <svg className="arrow" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                        <path d="M3 1h8v8M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ) : null}
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
