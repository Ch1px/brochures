type Props = {
  type: string
}

/**
 * Placeholder shown for section types that haven't been ported from the builder yet.
 * Appears in the public reader so it's obvious which section is missing.
 * Port the renderX() function from the builder for each type and register it in SectionRenderer.
 */
export function UnsupportedSection({ type }: Props) {
  return (
    <section
      className="section"
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8% 10%',
        background: 'var(--page-bg)',
        textAlign: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            color: 'var(--brand-red)',
            marginBottom: 12,
          }}
        >
          Section not yet ported
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(24px, 5cqi, 48px)',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
            color: 'var(--page-text-muted)',
          }}
        >
          {type}
        </div>
      </div>
    </section>
  )
}
