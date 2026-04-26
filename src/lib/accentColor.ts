import type { CSSProperties } from 'react'

/**
 * Per-brochure accent override. Given a single hex (e.g. `#1a8cd8`), derives
 * the four CSS custom-property values used across the brochure styles
 * (`--brand-red`, `--brand-red-hover`, `--brand-red-glow`, `--brand-red-dim`)
 * and returns them as a React `style` object suitable for spreading onto the
 * brochure root element.
 *
 * Returns `undefined` when no override is set so the platform defaults from
 * `:root` in `globals.css` keep applying.
 *
 * The four derivations mirror the original hand-tuned palette:
 *   hover  → lighten by ~10% (toward white)
 *   glow   → rgba(accent, 0.35)
 *   dim    → rgba(accent, 0.12)
 */
export function accentColorVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!/^#[0-9a-fA-F]{6}$/.test(normalised)) return undefined

  const { r, g, b } = hexToRgb(normalised)
  const hover = lighten({ r, g, b }, 0.1)

  return {
    ['--brand-red' as string]: normalised,
    ['--brand-red-hover' as string]: rgbToHex(hover),
    ['--brand-red-glow' as string]: `rgba(${r}, ${g}, ${b}, 0.35)`,
    ['--brand-red-dim' as string]: `rgba(${r}, ${g}, ${b}, 0.12)`,
  } as CSSProperties
}

type Rgb = { r: number; g: number; b: number }

function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
}

function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function lighten({ r, g, b }: Rgb, amount: number): Rgb {
  return {
    r: r + (255 - r) * amount,
    g: g + (255 - g) * amount,
    b: b + (255 - b) * amount,
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n
}
