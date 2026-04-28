import type { SectionGalleryEditorial } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionGalleryEditorial
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Gallery · Editorial — ported from renderGallery().
 * Asymmetric 4-image grid: slot 1 spans two rows (left), slots 2 and 3
 * sit top-right, slot 4 spans two columns along the bottom. Empty slots
 * show numbered placeholders.
 */
export function GalleryEditorial({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const images = (data.images ?? []).slice(0, 4)

  return (
    <section className="section page-gallery" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-gallery-inner">
        <div className="gallery-header">
          <InlineEditable sectionKey={data._key} field="title"><h2 className="gallery-title">{data.title ?? ''}</h2></InlineEditable>
        </div>
        <div className="gallery-grid">
          {Array.from({ length: 4 }).map((_, i) => {
            const img = images[i]
            const url = urlForSection(img, 1400)
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
