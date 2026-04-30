import type { SectionIntro } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'
import { SectionCTA } from '../SectionCTA'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { LazyVideo } from '../LazyVideo'
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
  const letterImageUrl = urlForSection(data.letterImage, 600)
  const { editorMode } = useBrochureBranding()

  return (
    <section className={`section page-intro section-media-overlay-${data.overlayStrength ?? 'none'}`} data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-intro-inner">
        <div className="page-intro-left" data-align={data.contentAlign || undefined}>
          {letterImageUrl ? (
            <div
              className="intro-mark-letter intro-mark-letter-image"
              style={typeof data.letterImageScale === 'number'
                ? { ['--letter-image-scale' as never]: String(data.letterImageScale) }
                : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={letterImageUrl} alt="" draggable={false} />
            </div>
          ) : (data.letter || editorMode) ? (
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
          <SectionCTA text={data.ctaText} href={data.ctaHref} />
        </div>
        <div className="page-intro-right-wrap">
          <div className="image-offset-frame" aria-hidden="true" />
          <InlineMedia sectionKey={data._key} field="image" hasImage={Boolean(imageUrl)}>
            <div className="page-intro-right">
              {imageUrl ? (
                <div
                  className="media-bg-layer"
                  style={{ backgroundImage: `url('${imageUrl}')` }}
                />
              ) : null}
              {videoUrl ? (
                <LazyVideo className="media-video" src={videoUrl} poster={imageUrl} />
              ) : null}
              <div className="page-intro-right-frame" />
              {!imageUrl && !videoUrl ? <ImagePlaceholderSVG /> : null}
              {(data.caption || editorMode) ? (
                <InlineEditable sectionKey={data._key} field="caption">
                  <div className="page-intro-right-caption">{data.caption || ''}</div>
                </InlineEditable>
              ) : null}
            </div>
          </InlineMedia>
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
