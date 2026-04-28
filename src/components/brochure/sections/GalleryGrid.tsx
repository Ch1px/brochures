import type { SectionGalleryGrid } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { GalleryHeader } from './GalleryHeader'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionGalleryGrid
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Gallery · Grid — 3-column equal grid.
 *
 * Editor: always 6 slots (numbered placeholders for empty ones) so the
 * admin can see what's missing.
 * Public: only renders the images that exist. 1–3 images = single row,
 * 4–6 images = two rows. The grid keeps 3 columns either way so the last
 * row simply has fewer tiles when the count isn't a multiple of 3.
 */
export function GalleryGrid({ data, pageNum, total, showFolio }: Props) {
  const images = data.images ?? []
  const { editorMode } = useBrochureBranding()

  const tiles = editorMode
    ? Array.from({ length: 6 }, (_, i) => ({ url: urlForSection(images[i], 1000), index: i }))
    : images
        .map((img, i) => ({ url: urlForSection(img, 1000), index: i }))
        .filter((t) => t.url)

  const rows = tiles.length <= 3 ? 1 : 2

  return (
    <section className="section page-gallery-grid" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-gallery-grid-inner">
        <GalleryHeader eyebrow={data.eyebrow} title={data.title} sectionKey={data._key} />
        <div className="gallery-grid-6" data-rows={rows}>
          {tiles.map(({ url, index }) =>
            url ? (
              <InlineMedia key={index} sectionKey={data._key} field={`images.${index}`} hasImage={Boolean(url)}>
              <div
                className="gallery-item"
                style={{ backgroundImage: `url('${url}')` }}
              />
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
