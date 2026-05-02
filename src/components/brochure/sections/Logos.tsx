import type { SectionLogos } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { useBrochureBranding, useEyebrowNormaliser, useTitleNormaliser } from '../BrochureContext'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'

type Props = {
  data: SectionLogos
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Logos — partner / sponsor logo section. Two layout variants share this
 * component:
 *   • logoWall  → multi-row responsive grid (best for 6–12 logos)
 *   • logoStrip → single horizontal row that wraps when narrow (best for 4–8)
 *
 * Each logo can carry an optional href; when present it renders as an anchor
 * that opens in a new tab. Logos float directly on the page background (no
 * card surround) and are desaturated by default, regaining colour on hover.
 *
 * In editor mode every slot is shown — even logos without an uploaded image
 * render as a labelled placeholder so the admin can see what's missing. In
 * the public reader, image-less entries are skipped silently.
 */
export function Logos({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const titleN = useTitleNormaliser()
  const eyebrowN = useEyebrowNormaliser()
  const isStrip = data._type === 'logoStrip'
  const variantClass = isStrip ? 'page-logos-strip' : 'page-logos-wall'
  const allLogos = data.logos ?? []
  const logos = editorMode ? allLogos : allLogos.filter((l) => Boolean(l.image))
  const hasHeader = Boolean(data.eyebrow || data.title || data.subtitle || editorMode)

  return (
    <section
      className={`section page-logos ${variantClass}`}
      data-section-id={data._key}
    >
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-logos-inner">
        {hasHeader ? (
          <div className="logos-header">
            {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="logos-eyebrow">{eyebrowN(data.eyebrow)}</div></InlineEditable> : null}
            {(data.title || editorMode) ? <InlineEditable sectionKey={data._key} field="title"><h2 className="logos-title">{titleN(data.title)}</h2></InlineEditable> : null}
            {(data.subtitle || editorMode) ? <InlineEditable sectionKey={data._key} field="subtitle" richBody><RichBody className="logos-subtitle" text={data.subtitle} /></InlineEditable> : null}
          </div>
        ) : null}

        {logos.length > 0 ? (
          <div className="logos-grid" data-count={logos.length}>
            {logos.map((logo) => {
              const url = urlForSection(logo.image, 600)
              const inner = url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={logo.name} />
              ) : (
                <div className="logos-placeholder" aria-hidden>
                  {logo.name || 'Logo'}
                </div>
              )
              const className = `logos-item${url ? '' : ' logos-item-empty'}`
              if (logo.href) {
                return (
                  <a
                    key={logo._key}
                    href={logo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                    aria-label={logo.name}
                  >
                    {inner}
                  </a>
                )
              }
              return (
                <div key={logo._key} className={className}>
                  {inner}
                </div>
              )
            })}
          </div>
        ) : null}
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
