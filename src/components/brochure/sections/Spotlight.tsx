import type { SectionSpotlight } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { ImagePlaceholderSVG } from './ImagePlaceholderSVG'

type Props = {
  data: SectionSpotlight
  pageNum: number
  total: number
  showFolio: boolean
}

export function Spotlight({ data, pageNum, total, showFolio }: Props) {
  const imageUrl = urlForSection(data.image, 1400)
  const backgroundUrl = urlForSection(data.backgroundImage, 2000)

  return (
    <section
      className="section page-spotlight"
      data-section-id={data._key}
      style={backgroundUrl ? { backgroundImage: `url('${backgroundUrl}')` } : undefined}
    >
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
        <div
          className="page-spotlight-image"
          style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
        >
          <div className="page-spotlight-image-frame" />
          {!imageUrl ? <ImagePlaceholderSVG /> : null}
          {data.caption ? <div className="page-spotlight-caption">{data.caption}</div> : null}
        </div>
        <div className="page-spotlight-text">
          {data.eyebrow ? <div className="intro-eyebrow">{data.eyebrow}</div> : null}
          <h2 className="intro-title">{data.title ?? ''}</h2>
          {data.body ? <p className="intro-body">{data.body}</p> : null}
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
