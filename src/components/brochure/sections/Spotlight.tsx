import type { SectionSpotlight } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'
import { SectionCTA } from '../SectionCTA'
import { SpotlightBackground } from './SpotlightBackground'
import { InlineEditable } from '../InlineEditable'
import { LazyVideo } from '../LazyVideo'
import { useBrochureBranding, useEyebrowNormaliser, useTitleNormaliser } from '../BrochureContext'

type Props = {
  data: SectionSpotlight
  pageNum: number
  total: number
  showFolio: boolean
}

export function Spotlight({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const titleN = useTitleNormaliser()
  const eyebrowN = useEyebrowNormaliser()
  const imageUrl = urlForSection(data.image, 1400)
  const videoUrl = urlForFile(data.video)
  const backgroundUrl = urlForSection(data.backgroundImage, 2000)
  const backgroundVideoUrl = urlForFile(data.backgroundVideo)

  return (
    <section
      className={`section page-spotlight overlay-${data.overlayStrength ?? 'medium'} fg-overlay-${
        data.foregroundOverlayStrength ?? 'none'
      }${data.showForegroundImage === false ? ' no-foreground' : ''}`}
      data-section-id={data._key}
    >
      <SpotlightBackground
        imageUrl={backgroundUrl ?? undefined}
        videoUrl={backgroundVideoUrl ?? undefined}
        parallax={Boolean(data.backgroundParallax)}
      />
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-spotlight-overlay" aria-hidden="true" />

      <div className="page-spotlight-inner">
        {data.showForegroundImage !== false ? (
          <div className="page-spotlight-image">
            {imageUrl ? (
              <div
                className="media-bg-layer"
                style={{ backgroundImage: `url('${imageUrl}')` }}
              />
            ) : null}
            {videoUrl ? (
              <LazyVideo className="media-video" src={videoUrl} poster={imageUrl} />
            ) : null}
            <div className="page-spotlight-image-frame" />
            {!imageUrl && !videoUrl ? <ImagePlaceholderSVG /> : null}
            {(data.caption || editorMode) ? <InlineEditable sectionKey={data._key} field="caption"><div className="page-spotlight-caption">{data.caption || ''}</div></InlineEditable> : null}
          </div>
        ) : null}
        <div className="page-spotlight-text">
          {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="intro-eyebrow">{eyebrowN(data.eyebrow)}</div></InlineEditable> : null}
          <InlineEditable sectionKey={data._key} field="title"><h2 className="intro-title">{titleN(data.title)}</h2></InlineEditable>
          {(data.body || editorMode) ? <InlineEditable sectionKey={data._key} field="body" richBody><RichBody className="intro-body" text={data.body} /></InlineEditable> : null}
          <SectionCTA text={data.ctaText} href={data.ctaHref} />
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
