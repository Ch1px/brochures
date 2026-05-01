import type { SectionGalleryTrio } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { GalleryHeader } from './GalleryHeader'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionGalleryTrio
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Gallery · Trio — 3 equal tiles in a single row.
 *
 * Editor: always 3 slots (numbered placeholders for empty ones) so the
 * admin can see what's missing.
 * Public: only renders the images that exist.
 *
 * Reuses `.gallery-grid-6` styling with `data-rows="1"` so the existing
 * single-row 9:2 aspect-ratio layout applies without new CSS.
 */
export function GalleryTrio({ data, pageNum, total, showFolio }: Props) {
  const images = data.images ?? []
  const { editorMode } = useBrochureBranding()

  const tiles = editorMode
    ? Array.from({ length: 3 }, (_, i) => ({ url: urlForSection(images[i], 1000), index: i }))
    : images
        .map((img, i) => ({ url: urlForSection(img, 1000), index: i }))
        .filter((t) => t.url)

  return (
    <section className={`section page-gallery-grid section-media-overlay-${data.overlayStrength ?? 'none'}`} data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-gallery-grid-inner">
        <GalleryHeader eyebrow={data.eyebrow} title={data.title} sectionKey={data._key} />
        <div className="gallery-grid-6" data-rows={1}>
          {tiles.map(({ url, index }) =>
            url ? (
              <InlineMedia key={index} sectionKey={data._key} field={`images.${index}`} hasImage={Boolean(url)}>
                <div className="gallery-item">
                  <div
                    className="media-bg-layer"
                    style={{ backgroundImage: `url('${url}')` }}
                  />
                </div>
              </InlineMedia>
            ) : (
              <InlineMedia key={index} sectionKey={data._key} field={`images.${index}`} hasImage={false}>
              <div className="gallery-item gallery-placeholder">
                {String(index + 1).padStart(2, '0')}
              </div>
              </InlineMedia>
            ),
          )}
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
