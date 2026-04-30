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
    // Body text is the Text colour at 75% alpha. Computed here so it follows
    // the user's Text override without relying on relative-color CSS syntax.
    ['--body-text-muted' as string]: `rgba(${r}, ${g}, ${b}, 0.75)`,
  } as CSSProperties
}

/**
 * Per-brochure title colour override. Sets `--title-text` used by section
 * headings. Returns `undefined` when no override is set.
 */
export function titleColorVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!HEX_RE.test(normalised)) return undefined
  return { ['--title-text' as string]: normalised } as CSSProperties
}

/**
 * Per-brochure body colour override. Sets `--body-text` and `--body-text-muted`
 * used by paragraphs, subtitles, and captions. Returns `undefined` when no
 * override is set.
 */
export function bodyColorVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!HEX_RE.test(normalised)) return undefined
  const { r, g, b } = hexToRgb(normalised)
  return {
    ['--body-text' as string]: normalised,
    ['--body-text-muted' as string]: `rgba(${r}, ${g}, ${b}, 0.6)`,
  } as CSSProperties
}

/**
 * Per-brochure eyebrow style overrides. Controls italic and text-transform
 * on script-font eyebrow elements.
 */
export function eyebrowStyleVars(
  italic?: boolean,
  transform?: string | null,
): CSSProperties | undefined {
  const vars: Record<string, string> = {}
  if (italic === false) vars['--eyebrow-font-style'] = 'normal'
  if (italic === true) vars['--eyebrow-font-style'] = 'italic'
  if (transform) vars['--eyebrow-text-transform'] = transform
  if (Object.keys(vars).length === 0) return undefined
  return vars as unknown as CSSProperties
}

/**
 * Per-brochure title style overrides. Controls italic and text-transform
 * on display-font title elements (section headings, cover headlines, etc.).
 */
export function titleStyleVars(
  italic?: boolean,
  transform?: string | null,
): CSSProperties | undefined {
  const vars: Record<string, string> = {}
  if (italic === true) vars['--title-font-style'] = 'italic'
  if (italic === false) vars['--title-font-style'] = 'normal'
  if (transform) vars['--title-text-transform'] = transform
  if (Object.keys(vars).length === 0) return undefined
  return vars as unknown as CSSProperties
}

/**
 * Brochure-level overlay base colour, derived from the brochure background.
 * Image-overlay sections (cover, section heading, spotlight, closing) tint
 * their dark gradient with this value so the overlay integrates with the
 * brand palette. When the background is light (luminance > 0.5) we fall
 * back to near-black, since a light overlay can't keep text legible against
 * a busy photograph.
 *
 * Emits `--overlay-base-rgb` as a comma-separated triple so it can be
 * composed inside `rgba(var(--overlay-base-rgb), <alpha>)`.
 */
export function overlayBaseVars(hex?: string | null): CSSProperties | undefined {
  if (!hex) return undefined
  const normalised = hex.trim()
  if (!HEX_RE.test(normalised)) return undefined
  const rgb = hexToRgb(normalised)
  const isLight = relativeLuminance(rgb) > 0.5
  const r = isLight ? 0 : rgb.r
  const g = isLight ? 0 : rgb.g
  const b = isLight ? 0 : rgb.b
  return { ['--overlay-base-rgb' as string]: `${r}, ${g}, ${b}` } as CSSProperties
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
