import type { SectionIntro } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionIntro
  pageNum: number
  total: number
  showFolio: boolean
}

export function Intro({ data, pageNum, total, showFolio }: Props) {
  const imageUrl = urlForSection(data.image, 1400)
  const videoUrl = urlForFile(data.video)
  const { editorMode } = useBrochureBranding()

  return (
    <section className="section page-intro" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-intro-inner">
        <div className="page-intro-left">
          {(data.letter || editorMode) ? (
            <InlineEditable sectionKey={data._key} field="letter">
              <div className="intro-mark-letter">{data.letter || ''}</div>
            </InlineEditable>
          ) : null}
          {(data.eyebrow || editorMode) ? (
            <InlineEditable sectionKey={data._key} field="eyebrow">
              <div className="intro-eyebrow">{data.eyebrow || ''}</div>
            </InlineEditable>
          ) : null}
          <InlineEditable sectionKey={data._key} field="title">
            <h2 className="intro-title">{data.title ?? ''}</h2>
          </InlineEditable>
          <InlineEditable sectionKey={data._key} field="body" richBody>
            <RichBody className="intro-body" text={data.body} />
          </InlineEditable>
        </div>
        <div className="page-intro-right-wrap">
          <div className="image-offset-frame" aria-hidden="true" />
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
            {(data.caption || editorMode) ? (
              <InlineEditable sectionKey={data._key} field="caption">
                <div className="page-intro-right-caption">{data.caption || ''}</div>
              </InlineEditable>
            ) : null}
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
