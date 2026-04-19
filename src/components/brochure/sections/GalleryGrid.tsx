import type { SectionGalleryGrid } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { GalleryHeader } from './GalleryHeader'

type Props = {
  data: SectionGalleryGrid
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Gallery · Grid — ported from renderGalleryGrid().
 * 6 equal tiles, 3 columns × 2 rows. Empty slots show numbered placeholders 01-06.
 */
export function GalleryGrid({ data, pageNum, total, showFolio }: Props) {
  const images = data.images ?? []

  return (
    <section className="section page-gallery-grid" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-gallery-grid-inner">
        <GalleryHeader eyebrow={data.eyebrow} title={data.title} />
        <div className="gallery-grid-6">
          {Array.from({ length: 6 }).map((_, i) => {
            const img = images[i]
            const url = urlForSection(img, 1000)
            if (url) {
              return (
                <div
                  key={i}
                  className="gallery-item"
                  style={{ backgroundImage: `url('${url}')` }}
                />
              )
            }
            return (
              <div key={i} className="gallery-item gallery-placeholder">
                {String(i + 1).padStart(2, '0')}
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
