import type { SectionSectionHeading } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'

type Props = {
  data: SectionSectionHeading
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Section Heading — chapter opener with script eyebrow + bold title + optional body.
 * Handles both 'sectionHeading' and 'sectionHeadingCentered' via a CSS modifier class.
 * The decorative SVG (gradient wash + racing lines) matches the Cover section.
 */
export function SectionHeading({ data, pageNum, total, showFolio }: Props) {
  const imageUrl = urlForSection(data.image, 2000)
  const variantClass = data._type === 'sectionHeadingCentered' ? 'page-section-heading-centered' : ''

  return (
    <section
      className={`section page-section-heading ${variantClass}`.trim()}
      data-section-id={data._key}
      style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
    >
      <div className="page-brand-mark">Grand Prix Grand Tours</div>

      <svg
        className="page-section-heading-svg-decor"
        style={{ color: 'var(--brand-red)' }}
        viewBox="0 0 1600 1000"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <radialGradient id={`sh-g1-${data._key}`} cx="15%" cy="70%" r="55%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`sh-g2-${data._key}`} cx="85%" cy="20%" r="40%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.15" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
        {!imageUrl && (
          <>
            <rect width="1600" height="1000" fill="#0a0a0c" />
            <rect width="1600" height="1000" fill={`url(#sh-g1-${data._key})`} />
            <rect width="1600" height="1000" fill={`url(#sh-g2-${data._key})`} />
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

      <div className="page-section-heading-frame" />

      <div className="page-section-heading-inner">
        {data.eyebrow ? <div className="section-heading-eyebrow">{data.eyebrow}</div> : null}
        {data.title ? <div className="section-heading-title">{data.title}</div> : null}
        {data.text ? <p className="section-heading-text">{data.text}</p> : null}
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
