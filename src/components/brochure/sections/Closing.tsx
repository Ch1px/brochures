import type { SectionClosing } from '@/types/brochure'
import { urlForSection, urlForFile } from '@/lib/sanity/image'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { InlineMedia } from '../InlineMedia'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionClosing
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Closing — ported from renderClosing().
 * Black background with dual red radial-gradient wash + racing lines.
 * Optionally a full-bleed background image/video behind the SVG decoration.
 * Eyebrow, title, subtitle, CTA button, and contact (email + phone) beneath.
 */
export function Closing({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const ctaHref = data.ctaHref || '#'
  const gradId1 = `clg1-${data._key}`
  const gradId2 = `clg2-${data._key}`
  const imageUrl = urlForSection(data.image, 2000)
  const videoUrl = urlForFile(data.video)

  return (
    <section
      className={`section page-closing closing-overlay-${data.overlayStrength ?? 'medium'}`}
      data-section-id={data._key}
    >
      {imageUrl ? (
        <InlineMedia sectionKey={data._key} field="image" hasImage={Boolean(imageUrl)}>
          <div
            className="page-closing-bg"
            style={{ backgroundImage: `url('${imageUrl}')` }}
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
          </div>
        </InlineMedia>
      ) : null}
      <svg
        className="page-closing-svg"
        style={{ color: 'var(--brand-red)' }}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id={gradId1} cx="20%" cy="50%" r="60%">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </radialGradient>
          <radialGradient id={gradId2} cx="85%" cy="80%" r="45%">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.1} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </radialGradient>
        </defs>
        {!imageUrl && (
          <rect width="1600" height="1000" fill="#000" />
        )}
        <rect width="1600" height="1000" fill={`url(#${gradId1})`} />
        <rect width="1600" height="1000" fill={`url(#${gradId2})`} />
        <g opacity={imageUrl ? 0.4 : 0.6}>
          <line x1={-50} y1={250} x2={1700} y2={80} stroke="currentColor" strokeWidth={2} opacity={0.5} />
          <line x1={-50} y1={310} x2={1700} y2={160} stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
          <line x1={-50} y1={820} x2={1700} y2={940} stroke="currentColor" strokeWidth={2} opacity={0.4} />
          <line x1={-50} y1={880} x2={1700} y2={1000} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
        </g>
      </svg>
      <div className="page-brand-mark" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Grand Prix Grand Tours
      </div>
      <div className="page-closing-inner">
        {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="closing-eyebrow">{data.eyebrow}</div></InlineEditable> : null}
        <InlineEditable sectionKey={data._key} field="title"><h2 className="closing-title">{data.title ?? ''}</h2></InlineEditable>
        {(data.subtitle || editorMode) ? <InlineEditable sectionKey={data._key} field="subtitle" richBody><RichBody className="closing-subtitle" text={data.subtitle} /></InlineEditable> : null}
        <div className="closing-actions">
          {(data.ctaText || editorMode) ? (
            <a
              className="closing-cta"
              href={ctaHref}
              {...(ctaHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              <InlineEditable sectionKey={data._key} field="ctaText"><span>{data.ctaText}</span></InlineEditable> →
            </a>
          ) : null}
          <div className="closing-contact">
            {(data.email || editorMode) ? (
              <div className="closing-contact-item">
                <svg className="closing-contact-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <rect x="2" y="4" width="16" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M2 5.5L10 11L18 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                </svg>
                <InlineEditable sectionKey={data._key} field="email"><span>{data.email}</span></InlineEditable>
              </div>
            ) : null}
            {(data.phone || editorMode) ? (
              <div className="closing-contact-item">
                <svg className="closing-contact-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M6.6 3H4.5A1.5 1.5 0 003 4.5c0 7.18 5.82 13 13 13a1.5 1.5 0 001.5-1.5v-2.1a1 1 0 00-.7-.95l-2.8-.8a1 1 0 00-1 .27l-1.1 1.1a10.5 10.5 0 01-4.4-4.4l1.1-1.1a1 1 0 00.27-1l-.8-2.8A1 1 0 006.6 3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <InlineEditable sectionKey={data._key} field="phone"><span>{data.phone}</span></InlineEditable>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {showFolio ? (
        <div className="page-folio" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
