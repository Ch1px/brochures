import type { CSSProperties } from 'react'
import { hexToRgb, relativeLuminance, lighten, rgbToHex, type Rgb } from './accentColor'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Per-brochure background colour override. Derives `--page-bg` and
 * `--page-bg-alt` from a single hex. Returns `undefined` when no override
 * is set so the theme defaults from `:root` / `[data-theme]` keep applying.
 */
export function backgroundColorVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!HEX_RE.test(normalised)) return undefined

  const rgb = hexToRgb(normalised)
  const isLight = relativeLuminance(rgb) > 0.5
  // Dark backgrounds get a slightly lighter alt; light backgrounds get slightly darker.
  const alt = isLight
    ? rgbToHex({ r: rgb.r * 0.97, g: rgb.g * 0.97, b: rgb.b * 0.97 })
    : rgbToHex(lighten(rgb, 0.03))

  return {
    ['--page-bg' as string]: normalised,
    ['--page-bg-alt' as string]: alt,
  } as CSSProperties
}

/**
 * Per-brochure text colour override. Derives `--page-text`,
 * `--page-text-muted`, `--page-text-subtle`, and `--page-border` from a
 * single hex. Alpha ratios match the `:root` defaults in globals.css.
 */
export function textColorVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!HEX_RE.test(normalised)) return undefined

  const { r, g, b } = hexToRgb(normalised)

  return {
    ['--page-text' as string]: normalised,
    ['--page-text-muted' as string]: `rgba(${r}, ${g}, ${b}, 0.6)`,
    ['--page-text-subtle' as string]: `rgba(${r}, ${g}, ${b}, 0.35)`,
    ['--page-border' as string]: `rgba(${r}, ${g}, ${b}, 0.09)`,
  } as CSSProperties
}

/**
 * Per-brochure nav background override. Sets `--nav-bg` from a single hex.
 * Returns `undefined` when no override is set.
 */
export function navColorVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!HEX_RE.test(normalised)) return undefined

  return {
    ['--nav-bg' as string]: normalised,
  } as CSSProperties
}
