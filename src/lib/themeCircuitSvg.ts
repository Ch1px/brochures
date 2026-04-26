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

type CircuitTheme = 'dark' | 'light'

function buildPaletteMap(accent: string, theme: CircuitTheme): Record<string, string> {
  const fg = theme === 'light' ? '0,0,0' : '255,255,255'
  const labelColor = theme === 'light' ? '#0F1115' : '#ffffff'
  return {
    '#EF4444': accent,                     // red → brand accent
    '#F59E0B': '#ffb340',                  // orange → warm amber (theme-agnostic)
    '#FDE68A': labelColor,                 // highlight yellow → theme foreground
    '#96A3B5': `rgba(${fg},0.7)`,          // primary outline → theme foreground
    '#64748B': `rgba(${fg},0.35)`,         // secondary outline → muted foreground
    '#3C8C67': `rgba(${fg},0.06)`,         // land/green → near-bg
    '#0F1115': labelColor,                 // near-black labels → theme foreground
  }
}

export function themeCircuitSvg(
  svgText: string,
  accent: string = DEFAULT_BRAND_RED,
  theme: CircuitTheme = 'dark',
): string {
  if (!svgText) return ''
  let out = svgText
  for (const [from, to] of Object.entries(buildPaletteMap(accent, theme))) {
    // Case-insensitive replace of fill="#HEX" and stroke="#HEX"
    const reFill = new RegExp(`fill="${from}"`, 'gi')
    const reStroke = new RegExp(`stroke="${from}"`, 'gi')
    out = out.replace(reFill, `fill="${to}"`).replace(reStroke, `stroke="${to}"`)
  }
  return out
}
