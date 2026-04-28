import type { SectionSpotlight } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'
import { RichBody } from '../RichBody'
import { SpotlightBackground } from './SpotlightBackground'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionSpotlight
  pageNum: number
  total: number
  showFolio: boolean
}

export function Spotlight({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const imageUrl = urlForSection(data.image, 1400)
  const videoUrl = urlForFile(data.video)
  const backgroundUrl = urlForSection(data.backgroundImage, 2000)
  const backgroundVideoUrl = urlForFile(data.backgroundVideo)

  return (
    <section
      className={`section page-spotlight overlay-${data.overlayStrength ?? 'medium'}${
        data.showForegroundImage === false ? ' no-foreground' : ''
      }`}
      data-section-id={data._key}
    >
      <SpotlightBackground
        imageUrl={backgroundUrl ?? undefined}
        videoUrl={backgroundVideoUrl ?? undefined}
        parallax={Boolean(data.backgroundParallax)}
      />
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-spotlight-overlay" aria-hidden="true" />

      <svg
        className="page-spotlight-svg-decor"
        style={{ color: 'var(--brand-red)' }}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id={`sp-g1-${data._key}`} cx="15%" cy="70%" r="55%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`sp-g2-${data._key}`} cx="85%" cy="20%" r="40%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {!backgroundUrl && (
          <>
            <rect width="1600" height="1000" fill="#0a0a0c" />
            <rect width="1600" height="1000" fill={`url(#sp-g1-${data._key})`} />
            <rect width="1600" height="1000" fill={`url(#sp-g2-${data._key})`} />
          </>
        )}
        <g opacity={backgroundUrl ? 0.55 : 1}>
          <line x1={-50} y1={180} x2={1700} y2={60} stroke="currentColor" strokeWidth={2} opacity={0.5} />
          <line x1={-50} y1={230} x2={1700} y2={140} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <line x1={-50} y1={770} x2={1700} y2={870} stroke="currentColor" strokeWidth={2} opacity={0.4} />
          <line x1={-50} y1={820} x2={1700} y2={900} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          <line x1={-50} y1={870} x2={1700} y2={950} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        </g>
      </svg>

      <div className="page-spotlight-frame" />

      <div className="page-spotlight-inner">
        {data.showForegroundImage !== false ? (
          <div
            className="page-spotlight-image"
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
            <div className="page-spotlight-image-frame" />
            {!imageUrl && !videoUrl ? <ImagePlaceholderSVG /> : null}
            {(data.caption || editorMode) ? <InlineEditable sectionKey={data._key} field="caption"><div className="page-spotlight-caption">{data.caption || ''}</div></InlineEditable> : null}
          </div>
        ) : null}
        <div className="page-spotlight-text">
          {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="intro-eyebrow">{data.eyebrow || ''}</div></InlineEditable> : null}
          <InlineEditable sectionKey={data._key} field="title"><h2 className="intro-title">{data.title ?? ''}</h2></InlineEditable>
          {(data.body || editorMode) ? <InlineEditable sectionKey={data._key} field="body" richBody><RichBody className="intro-body" text={data.body} /></InlineEditable> : null}
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
