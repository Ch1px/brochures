import type { SectionCover } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionCover
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Cover section — ported from the builder's renderCover().
 * Handles both 'cover' and 'coverCentered' via a _type check, which adds
 * a CSS class that the globals stylesheet uses to centre the layout.
 */
export function Cover({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const variantClass = data._type === 'coverCentered' ? 'page-cover-centered' : ''
  const imageUrl = urlForSection(data.image, 2000)
  const videoUrl = urlForFile(data.video)

  return (
    <section className={`section page-cover ${variantClass} cover-overlay-${data.overlayStrength ?? 'medium'}`} data-section-id={data._key}>
      <InlineMedia sectionKey={data._key} field="image" hasImage={Boolean(imageUrl)}>
        <div className="page-cover-bg">
          {imageUrl ? (
            <div
              className="media-bg-layer"
              style={{ backgroundImage: `url('${imageUrl}')` }}
            />
          ) : null}
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
        </div>
      </InlineMedia>

      {/* Decorative SVG — gradient wash + racing lines. Same as builder.
          Uses currentColor so a parent override of --brand-red retints. */}
      <svg
        className="page-cover-svg-decor"
        style={{ color: 'var(--brand-red)' }}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id={`cov-g1-${data._key}`} cx="15%" cy="70%" r="55%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`cov-g2-${data._key}`} cx="85%" cy="20%" r="40%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {!imageUrl && (
          <>
            <rect width="1600" height="1000" fill="#0a0a0c" />
            <rect width="1600" height="1000" fill={`url(#cov-g1-${data._key})`} />
            <rect width="1600" height="1000" fill={`url(#cov-g2-${data._key})`} />
          </>
        )}
        <g opacity={imageUrl ? 0.55 : 1}>
          <line x1={-50} y1={180} x2={1700} y2={60} stroke="currentColor" strokeWidth={2} opacity={0.5} />
          <line x1={-50} y1={230} x2={1700} y2={140} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <line x1={-50} y1={770} x2={1700} y2={870} stroke="currentColor" strokeWidth={2} opacity={0.4} />
          <line x1={-50} y1={820} x2={1700} y2={900} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          <line x1={-50} y1={870} x2={1700} y2={950} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
        </g>
      </svg>

      <div className="page-cover-frame" />

      <div className="page-cover-inner">
        <div className="page-cover-top">
          <div className="cover-brand-lockup">
            {(data.brandMark || editorMode) ? <InlineEditable sectionKey={data._key} field="brandMark"><div className="lockup-mark">{data.brandMark}</div></InlineEditable> : null}
          </div>
          {(data.edition || editorMode) ? <InlineEditable sectionKey={data._key} field="edition"><div className="cover-edition">{data.edition}</div></InlineEditable> : null}
        </div>

        <div className="page-cover-center">
          {(data.sup || editorMode) ? <InlineEditable sectionKey={data._key} field="sup"><div className="cover-sup">{data.sup}</div></InlineEditable> : null}
          <h1 className="cover-title">
            <InlineEditable sectionKey={data._key} field="title"><span>{data.title}</span></InlineEditable>
            {(data.titleAccent || editorMode) ? (
              <>
                <br />
                <InlineEditable sectionKey={data._key} field="titleAccent"><span className="cover-title-accent">{data.titleAccent || ''}</span></InlineEditable>
              </>
            ) : null}
          </h1>
          {(data.tag || editorMode) ? <InlineEditable sectionKey={data._key} field="tag"><p className="cover-tag">{data.tag}</p></InlineEditable> : null}
        </div>

        <div className="page-cover-bottom">
          {(data.cta || editorMode) ? (
            <a
              className="cover-cta"
              href={data.ctaHref || '#enquire'}
              {...((data.ctaHref?.startsWith('http')) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <InlineEditable sectionKey={data._key} field="cta"><span>{data.cta}</span></InlineEditable> <span className="arrow">→</span>
            </a>
          ) : (
            <div />
          )}
          {(data.ref || editorMode) ? <InlineEditable sectionKey={data._key} field="ref"><div className="cover-ref">{data.ref}</div></InlineEditable> : null}
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
