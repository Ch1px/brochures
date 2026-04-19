import type { SectionImageHero } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'

type Props = {
  data: SectionImageHero
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * Image Hero — ported from the builder's renderImageHero().
 * Full-bleed image with overlay eyebrow + title + text.
 * When no image is set, renders the same fallback gradient + racing line SVG.
 */
export function ImageHero({ data, pageNum, total, showFolio }: Props) {
  const imageUrl = urlForSection(data.image, 2000)
  const gradId = `imhg1-${data._key}`

  return (
    <section className="section page-image-hero" data-section-id={data._key}>
      {!imageUrl ? (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <radialGradient id={gradId} cx="70%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#1a1a20" stopOpacity={1} />
              <stop offset="100%" stopColor="#0b0b0d" stopOpacity={1} />
            </radialGradient>
          </defs>
          <rect width="1600" height="1000" fill={`url(#${gradId})`} />
          <path
            d="M -50,800 Q 500,700 1000,750 T 1700,720"
            fill="none"
            stroke="#e10600"
            strokeWidth={3}
            opacity={0.3}
          />
          <path
            d="M -50,830 Q 500,730 1000,780 T 1700,750"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        </svg>
      ) : null}

      <div
        className="page-image-hero-bg"
        style={imageUrl ? { backgroundImage: `url('${imageUrl}')` } : undefined}
      />

      <div className="page-brand-mark">Grand Prix Grand Tours</div>

      <div className="page-image-hero-content">
        {data.eyebrow ? <div className="image-hero-eyebrow">{data.eyebrow}</div> : null}
        <h2 className="image-hero-title">{data.title ?? ''}</h2>
        {data.text ? <p className="image-hero-text">{data.text}</p> : null}
      </div>

      {showFolio ? (
        <div className="page-folio" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
