type Props = {
  text?: string
  href?: string
  className?: string
}

export function SectionCTA({ text, href, className = 'section-cta' }: Props) {
  if (!text) return null
  const target = href || '#'
  const isExternal = target.startsWith('http')
  return (
    <a
      className={className}
      href={target}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {text} <span className="arrow">→</span>
    </a>
  )
}
