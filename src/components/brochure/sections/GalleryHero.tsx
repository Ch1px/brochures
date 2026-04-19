import type { SectionGalleryHero } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { GalleryHeader } from './GalleryHeader'

type Props = {
  data: SectionGalleryHero
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Gallery · Hero — ported from renderGalleryHero().
 * One lead image (index 0) with optional caption overlay, plus three thumbnails
 * below (indexes 1–3). Empty slots show numbered placeholders.
 */
export function GalleryHero({ data, pageNum, total, showFolio }: Props) {
  const images = data.images ?? []
  const leadImg = images[0]
  const leadUrl = urlForSection(leadImg, 2000)

  return (
    <section className="section page-gallery-hero" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-gallery-hero-inner">
        <GalleryHeader eyebrow={data.eyebrow} title={data.title} />
        <div
          className={`gallery-hero-lead ${!leadUrl ? 'gallery-placeholder' : ''}`.trim()}
          style={leadUrl ? { backgroundImage: `url('${leadUrl}')` } : undefined}
        >
          {!leadUrl ? (
            <span
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--chrome-text-subtle)',
                fontFamily: 'var(--font-display)',
              }}
            >
              01
            </span>
          ) : null}
          {data.caption ? <div className="gallery-hero-caption">{data.caption}</div> : null}
        </div>
        <div className="gallery-hero-strip">
          {Array.from({ length: 3 }).map((_, i) => {
            const img = images[i + 1]
            const url = urlForSection(img, 700)
            if (url) {
              return (
                <div
                  key={i}
                  className="gallery-hero-thumb"
                  style={{ backgroundImage: `url('${url}')` }}
                />
              )
            }
            return (
              <div key={i} className="gallery-hero-thumb gallery-placeholder">
                {String(i + 2).padStart(2, '0')}
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
