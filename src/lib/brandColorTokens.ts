import { accentColorVars } from './accentColor'

/**
 * Brand colour tokens that can be stored in colorOverrides instead of
 * literal hex values. At render time these are resolved to the current
 * brochure branding values, so changing the accent colour (or any other
 * brand token) automatically updates the circuit SVG.
 *
 * Token format: `var:<name>` — e.g. `var:accent`, `var:bg`.
 */

export type BrandToken = {
  token: string
  label: string
  resolve: (ctx: BrandContext) => string
}

export type BrandContext = {
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  theme?: 'dark' | 'light'
}

const DEFAULT_ACCENT = '#e10600'
const DEFAULT_BG_DARK = '#0b0b0d'
const DEFAULT_BG_LIGHT = '#f6f5f1'
const DEFAULT_TEXT_DARK = '#ffffff'
const DEFAULT_TEXT_LIGHT = '#0b0b0d'

export const BRAND_TOKENS: BrandToken[] = [
  {
    token: 'var:accent',
    label: 'Accent',
    resolve: (ctx) => ctx.accentColor || DEFAULT_ACCENT,
  },
  {
    token: 'var:accent-hover',
    label: 'Accent hover',
    resolve: (ctx) => {
      const vars = accentColorVars(ctx.accentColor || DEFAULT_ACCENT)
      return (vars as Record<string, string>)?.['--brand-red-hover'] ?? '#ff1a14'
    },
  },
  {
    token: 'var:bg',
    label: 'Background',
    resolve: (ctx) => {
      if (ctx.backgroundColor) return ctx.backgroundColor
      return ctx.theme === 'light' ? DEFAULT_BG_LIGHT : DEFAULT_BG_DARK
    },
  },
  {
    token: 'var:text',
    label: 'Text',
    resolve: (ctx) => {
      if (ctx.textColor) return ctx.textColor
      return ctx.theme === 'light' ? DEFAULT_TEXT_LIGHT : DEFAULT_TEXT_DARK
    },
  },
  {
    token: 'var:white',
    label: 'White',
    resolve: () => '#ffffff',
  },
  {
    token: 'var:black',
    label: 'Black',
    resolve: () => '#000000',
  },
]

const TOKEN_MAP = new Map(BRAND_TOKENS.map((t) => [t.token, t]))

/** Returns true if the colour string is a brand variable token. */
export function isBrandToken(color: string): boolean {
  return color.startsWith('var:')
}

/** Resolves a colour — if it's a brand token, resolves to the current hex;
 *  otherwise returns it as-is. */
export function resolveColor(color: string, ctx: BrandContext): string {
  const entry = TOKEN_MAP.get(color)
  if (entry) return entry.resolve(ctx)
  return color
}

/** Returns the label for a brand token, or null if it's not a token. */
export function tokenLabel(color: string): string | null {
  return TOKEN_MAP.get(color)?.label ?? null
}
