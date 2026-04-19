import { useId } from 'react'

/**
 * Placeholder shown when an image slot has no image set.
 * Ported 1:1 from the builder's renderImagePlaceholderSVG helper —
 * diagonal line pattern + red tick + "IMAGE" label in the corner.
 *
 * Uses React's useId() to generate unique pattern IDs per instance,
 * avoiding collisions when multiple placeholders render on one page.
 */
export function ImagePlaceholderSVG() {
  const rawId = useId()
  // useId outputs values with colons; sanitise for SVG/CSS attribute safety.
  const id = `imgpl-${rawId.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id={id} width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="30" height="30" fill="#131316" />
          <line x1="0" y1="0" x2="0" y2="30" stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        </pattern>
      </defs>
      <rect width="400" height="300" fill={`url(#${id})`} />
      <g opacity={0.5}>
        <line x1="10" y1="10" x2="40" y2="10" stroke="#e10600" strokeWidth={3} />
        <text
          x="380"
          y="285"
          fontFamily="Titillium Web, sans-serif"
          fontSize={10}
          fill="rgba(255,255,255,0.3)"
          textAnchor="end"
          letterSpacing={2}
        >
          IMAGE
        </text>
      </g>
    </svg>
  )
}
