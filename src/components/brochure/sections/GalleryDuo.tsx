import type { SectionGalleryDuo } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { GalleryHeader } from './GalleryHeader'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionGalleryDuo
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Gallery · Duo — ported from renderGalleryDuo().
 * Two large side-by-side images with optional caption overlays.
 * Each slot without an image shows a centred numbered placeholder.
 */
export function GalleryDuo({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const images = data.images ?? []
  const captions = data.captions ?? []

  return (
    <section className={`section page-gallery-duo section-media-overlay-${data.overlayStrength ?? 'none'}`} data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-gallery-duo-inner">
        <GalleryHeader eyebrow={data.eyebrow} title={data.title} sectionKey={data._key} />
        <div className="gallery-duo-grid">
          {Array.from({ length: 2 }).map((_, i) => {
            const img = images[i]
            const url = urlForSection(img, 1600)
            const caption = captions[i] ?? ''
            return (
              <InlineMedia key={i} sectionKey={data._key} field={`images.${i}`} hasImage={Boolean(url)}>
              <div
                className={`gallery-duo-item ${!url ? 'gallery-placeholder' : ''}`.trim()}
              >
                {url ? (
                  <div
                    className="media-bg-layer"
                    style={{ backgroundImage: `url('${url}')` }}
                  />
                ) : null}
                {!url ? (
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--chrome-text-subtle)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                ) : null}
                {(caption || editorMode) ? <InlineEditable sectionKey={data._key} field={`captions.${i}`}><div className="gallery-duo-caption">{caption}</div></InlineEditable> : null}
              </div>
              </InlineMedia>
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
