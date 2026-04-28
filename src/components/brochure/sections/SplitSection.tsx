import type { SectionContentImage } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionContentImage
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Content · Image and Image · Content — both variants handled here.
 * Ported 1:1 from the builder's renderSplitSection() helper.
 *
 * The data shape is identical to Intro minus the `letter` field. The layout
 * reuses the intro CSS (.page-intro, .page-intro-inner, .page-intro-left,
 * .page-intro-right) plus a .page-intro-reversed modifier class for the flipped variant.
 */
export function SplitSection({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const reversed = data._type === 'imageContent'
  const imageUrl = urlForSection(data.image, 1400)
  const videoUrl = urlForFile(data.video)

  const contentDiv = (
    <div className="page-intro-left">
      {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="intro-eyebrow">{data.eyebrow || ''}</div></InlineEditable> : null}
      <InlineEditable sectionKey={data._key} field="title"><h2 className="intro-title">{data.title ?? ''}</h2></InlineEditable>
      <InlineEditable sectionKey={data._key} field="body" richBody><RichBody className="intro-body" text={data.body} /></InlineEditable>
    </div>
  )

  const imageDiv = (
    <div className={`page-intro-right-wrap${reversed ? ' reversed' : ''}`}>
      <div className="image-offset-frame" aria-hidden="true" />
      <InlineMedia sectionKey={data._key} field="image" hasImage={Boolean(imageUrl)}>
        <div
          className="page-intro-right"
          style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
        >
          {videoUrl ? (
            <video
              className="media-video"
              src={videoUrl}
              poster={imageUrl}
              autoPlay
              muted
              loop
              playsInline
            />
          ) : null}
          <div className="page-intro-right-frame" />
          {!imageUrl && !videoUrl ? <ImagePlaceholderSVG /> : null}
          {(data.caption || editorMode) ? <InlineEditable sectionKey={data._key} field="caption"><div className="page-intro-right-caption">{data.caption || ''}</div></InlineEditable> : null}
        </div>
      </InlineMedia>
    </div>
  )

  return (
    <section
      className={`section page-intro ${reversed ? 'page-intro-reversed' : ''}`.trim()}
      data-section-id={data._key}
    >
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-intro-inner">
        {reversed ? (
          <>
            {imageDiv}
            {contentDiv}
          </>
        ) : (
          <>
            {contentDiv}
            {imageDiv}
          </>
        )}
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
