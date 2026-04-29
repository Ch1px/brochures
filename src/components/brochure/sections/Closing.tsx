import type { SectionClosing } from '@/types/brochure'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
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
 * Eyebrow, title, subtitle, CTA button, and contact (email + phone) beneath.
 *
 * The CTA href defaults to '#' matching the builder. If it's '#enquire', the
 * public brochure page should intercept the click and open the HubSpot lead modal
 * (wire this up in BrochureReader or a global handler when the modal ships).
 */
export function Closing({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const ctaHref = data.ctaHref || '#'
  const gradId1 = `clg1-${data._key}`
  const gradId2 = `clg2-${data._key}`

  return (
    <section className="section page-closing" data-section-id={data._key}>
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
        <rect width="1600" height="1000" fill="#000" />
        <rect width="1600" height="1000" fill={`url(#${gradId1})`} />
        <rect width="1600" height="1000" fill={`url(#${gradId2})`} />
        <g opacity={0.6}>
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
            {(data.email || editorMode) ? <div>✉ <InlineEditable sectionKey={data._key} field="email"><span>{data.email}</span></InlineEditable></div> : null}
            {(data.phone || editorMode) ? <div>☏ <InlineEditable sectionKey={data._key} field="phone"><span>{data.phone}</span></InlineEditable></div> : null}
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
