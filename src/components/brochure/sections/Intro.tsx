import type { SectionIntro } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'

type Props = {
  data: SectionIntro
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Introduction — ported from the builder's renderIntro().
 * Accent letter in the left column, eyebrow + title + body text,
 * right column is an image with optional caption overlay.
 */
export function Intro({ data, pageNum, total, showFolio }: Props) {
  const imageUrl = urlForSection(data.image, 1400)

  return (
    <section className="section page-intro" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-intro-inner">
        <div className="page-intro-left">
          {data.letter ? <div className="intro-mark-letter">{data.letter}</div> : null}
          {data.eyebrow ? <div className="intro-eyebrow">{data.eyebrow}</div> : null}
          <h2 className="intro-title">{data.title ?? ''}</h2>
          <RichBody className="intro-body" text={data.body} />
        </div>
        <div className="page-intro-right-wrap">
          <div className="image-offset-frame" aria-hidden="true" />
          <div
            className="page-intro-right"
            style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
          >
            <div className="page-intro-right-frame" />
            {!imageUrl ? <ImagePlaceholderSVG /> : null}
            {data.caption ? <div className="page-intro-right-caption">{data.caption}</div> : null}
          </div>
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
