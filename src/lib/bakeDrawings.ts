import type { CircuitDrawing } from '@/types/brochure'

/**
 * Append free-hand drawings as a `<g>` block immediately before the SVG's
 * closing tag. Path data is in viewBox coordinates so the drawings scale
 * exactly with the circuit content under preserveAspectRatio.
 *
 * Stroke colour is left as `currentColor`; the consumer wraps each drawing
 * in a `<g style="color: …">` so resolved hex / brand-token values cascade
 * through. Dash patterns are derived from the stored stroke width so the
 * dashes look consistent across drawings.
 */
export function bakeDrawingsIntoSvg(svg: string, drawings: CircuitDrawing[], resolveColor: (token: string) => string): string {
  if (!drawings.length) return svg
  const closeIdx = svg.lastIndexOf('</svg>')
  if (closeIdx < 0) return svg

  const groups = drawings
    .map((d) => {
      if (!d.d) return ''
      const sw = d.strokeWidth || 1
      const dashAttr = dashArrayFor(d.dash, sw)
      const colorHex = d.color ? resolveColor(d.color) : 'currentColor'
      const opacity = d.opacity != null && d.opacity < 1 ? ` opacity="${d.opacity}"` : ''
      return [
        `<g style="color: ${escapeAttr(colorHex)}">`,
        `<path d="${escapeAttr(d.d)}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"${dashAttr}${opacity} data-circuit-drawing="${escapeAttr(d._key)}"/>`,
        `</g>`,
      ].join('')
    })
    .join('')

  return svg.slice(0, closeIdx) + groups + svg.slice(closeIdx)
}

function dashArrayFor(style: CircuitDrawing['dash'], sw: number): string {
  if (!style || style === 'solid') return ''
  if (style === 'dotted') return ` stroke-dasharray="0 ${(sw * 2).toFixed(2)}"`
  return ` stroke-dasharray="${(sw * 3).toFixed(2)} ${(sw * 2).toFixed(2)}"`
}

function escapeAttr(v: string): string {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
