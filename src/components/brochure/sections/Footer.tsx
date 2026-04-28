import type { SectionFooter, SocialPlatform } from '@/types/brochure'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionFooter
  pageNum: number
  total: number
  showFolio: boolean
}

const SOCIAL_LABELS: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  x: 'X',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  tiktok: 'TikTok',
}

function SocialIcon({ platform }: { platform: SocialPlatform }) {
  switch (platform) {
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x={3} y={3} width={18} height={18} rx={5} />
          <circle cx={12} cy={12} r={4} />
          <circle cx={17.5} cy={6.5} r={1} fill="currentColor" stroke="none" />
        </svg>
      )
    case 'x':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 3H21l-6.52 7.45L22 21h-6.063l-4.74-6.18L5.8 21H3l6.97-7.96L2.5 3h6.21l4.29 5.67L18.244 3Zm-1.062 16.2h1.677L7.83 4.7H6.05l11.132 14.5Z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.86.27-1.45 1.5-1.45H16.5V4.4A21 21 0 0 0 14.4 4.3c-2.1 0-3.5 1.3-3.5 3.6V10.5H8.4v3h2.5V21h2.6Z" />
        </svg>
      )
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5.001 2.5 2.5 0 0 0 0-5ZM3 9.75h4V21H3V9.75ZM10 9.75h3.83v1.54h.05c.53-.96 1.83-1.97 3.77-1.97 4.03 0 4.78 2.55 4.78 5.86V21h-4v-5.05c0-1.2-.02-2.75-1.78-2.75-1.78 0-2.05 1.3-2.05 2.66V21h-4V9.75Z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29.07 29.07 0 0 0 1 12a29.07 29.07 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29.07 29.07 0 0 0 23 12a29.07 29.07 0 0 0-.46-5.58ZM10 15.5v-7l6 3.5-6 3.5Z" />
        </svg>
      )
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M16.5 3a5.5 5.5 0 0 0 5 4v3a8.5 8.5 0 0 1-5-1.6V15a6 6 0 1 1-6-6c.34 0 .67.03 1 .1v3.2a3 3 0 1 0 2 2.83V3h3Z" />
        </svg>
      )
  }
}

/**
 * Footer — bottom band of the page slide. Sits as a flex sibling of
 * .brochure-page inside .brochure-page-slide; takes its own content height,
 * main sections share the column above. Not an overlay.
 */
export function Footer({ data }: Props) {
  const { editorMode } = useBrochureBranding()
  const socials = (data.socials ?? []).filter((s) => s.href)
  return (
    <section className="section page-footer" data-section-id={data._key}>
      <div className="page-footer-inner">
        {(data.legal || editorMode) ? <InlineEditable sectionKey={data._key} field="legal"><div className="page-footer-legal">{data.legal}</div></InlineEditable> : null}
        {data.email || data.phone || editorMode ? (
          <div className="page-footer-contact">
            {(data.email || editorMode) ? (
              <a className="page-footer-contact-link" href={`mailto:${data.email}`}>
                <InlineEditable sectionKey={data._key} field="email"><span>{data.email}</span></InlineEditable>
              </a>
            ) : null}
            {data.email && data.phone ? <span className="page-footer-sep" aria-hidden>·</span> : null}
            {(data.phone || editorMode) ? (
              <a className="page-footer-contact-link" href={`tel:${data.phone?.replace(/\s+/g, '') ?? ''}`}>
                <InlineEditable sectionKey={data._key} field="phone"><span>{data.phone}</span></InlineEditable>
              </a>
            ) : null}
          </div>
        ) : null}
        {socials.length > 0 ? (
          <div className="page-footer-socials">
            {socials.map((s) => (
              <a
                key={s._key}
                className="page-footer-social"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={SOCIAL_LABELS[s.platform]}
              >
                <SocialIcon platform={s.platform} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
