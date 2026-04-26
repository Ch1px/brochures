/**
 * Transform a raw circuit-map SVG's palette to fit the dark brochure theme.
 * Ported 1:1 from the builder's themeCircuitSvg() function.
 *
 * Strategy: replace known F1-style colours with theme equivalents.
 * Unknown colours pass through unchanged.
 *
 * Typically called at UPLOAD time in the admin builder — the themed output is
 * stored in the Sanity brochure document. The public reader just inlines the
 * already-themed SVG, so it doesn't need to run this function.
 *
 * Usage (admin upload flow):
 *   const text = await file.text()
 *   if (!text.includes('<svg')) throw new Error('Not an SVG')
 *   const themed = themeCircuitSvg(text)
 *   // save `themed` to Sanity's circuitMap.svg text field
 */

export const DEFAULT_BRAND_RED = '#e10600'

function buildPaletteMap(accent: string): Record<string, string> {
  return {
    '#EF4444': accent,                     // red → brand accent
    '#F59E0B': '#ffb340',                  // orange → warm amber
    '#FDE68A': '#ffffff',                  // highlight yellow → white
    '#96A3B5': 'rgba(255,255,255,0.7)',    // primary outline → bright white
    '#64748B': 'rgba(255,255,255,0.35)',   // secondary outline → muted
    '#3C8C67': 'rgba(255,255,255,0.06)',   // land/green → near-bg
    '#0F1115': '#ffffff',                  // near-black labels → white for dark bg
  }
}

export function themeCircuitSvg(svgText: string, accent: string = DEFAULT_BRAND_RED): string {
  if (!svgText) return ''
  let out = svgText
  for (const [from, to] of Object.entries(buildPaletteMap(accent))) {
    // Case-insensitive replace of fill="#HEX" and stroke="#HEX"
    const reFill = new RegExp(`fill="${from}"`, 'gi')
    const reStroke = new RegExp(`stroke="${from}"`, 'gi')
    out = out.replace(reFill, `fill="${to}"`).replace(reStroke, `stroke="${to}"`)
  }
  return out
}
