import type { SectionPackages } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionPackages
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Packages — ported from renderPackages().
 * Up to 3 tiered hospitality cards, each with tier badge, name, price,
 * divider, and features list. The `featured` flag gets a red-accented card style.
 */
export function Packages({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const packages = (data.packages ?? []).slice(0, 3)

  return (
    <section className={`section page-packages section-media-overlay-${data.overlayStrength ?? 'none'}`} data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-packages-inner">
        <div className="packages-header">
          {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="packages-eyebrow">{data.eyebrow}</div></InlineEditable> : null}
          <InlineEditable sectionKey={data._key} field="title"><h2 className="packages-title">{data.title ?? ''}</h2></InlineEditable>
        </div>
        <div className="packages-grid">
          {packages.map((p, i) => {
            const imgUrl = urlForSection(p.image, 900)
            return (
            <div key={p._key} className={`package-card ${p.featured ? 'featured' : ''}`.trim()}>
              <InlineMedia sectionKey={data._key} field={`packages.${i}.image`} hasImage={Boolean(imgUrl)}>
                <div className="package-image-wrap">
                  {imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="package-image" src={imgUrl} alt={p.name ?? ''} />
                  ) : null}
                </div>
              </InlineMedia>
              {(p.tier || editorMode) ? <InlineEditable sectionKey={data._key} field={`packages.${i}.tier`}><div className="package-tier">{p.tier}</div></InlineEditable> : null}
              <InlineEditable sectionKey={data._key} field={`packages.${i}.name`}><h3 className="package-name">{p.name ?? ''}</h3></InlineEditable>
              <div className="package-price">
                <InlineEditable sectionKey={data._key} field={`packages.${i}.currency`}><span className="package-price-currency">{p.currency ?? '£'}</span></InlineEditable>
                <InlineEditable sectionKey={data._key} field={`packages.${i}.price`}><span className="package-price-value">{p.price ?? ''}</span></InlineEditable>
              </div>
              {p.from ? <div className="package-price-from">{p.from}</div> : null}
              <div className="package-divider" />
              <ul className="package-features">
                {(p.features ?? []).map((f, i) => (
                  <li key={`${p._key}-feat-${i}`} className="package-feature">
                    {f}
                  </li>
                ))}
              </ul>
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
