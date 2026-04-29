import type { CSSProperties } from 'react'
import type { CustomFont, FontOverrides } from '@/types/brochure'

/** Prefix for custom font slugs stored in fontOverrides. */
const CUSTOM_PREFIX = 'custom:'

export type FontEntry = {
  slug: string
  label: string
  family: string
  googleFamily?: string
  weights?: string
  builtin?: boolean
}

// ── Curated font palette ────────────────────────────────────────────────

export const FONT_PALETTE: FontEntry[] = [
  // Built-in (already embedded in globals.css)
  { slug: 'formula1', label: 'Formula1', family: "'Formula1', 'Titillium Web', sans-serif", builtin: true },
  { slug: 'northwell', label: 'Northwell', family: "'Northwell', 'Brush Script MT', cursive", builtin: true },
  { slug: 'titillium-web', label: 'Titillium Web', family: "'Titillium Web', sans-serif", builtin: true },
  { slug: 'barlow-condensed', label: 'Barlow Condensed', family: "'Barlow Condensed', sans-serif", builtin: true },
  { slug: 'jetbrains-mono', label: 'JetBrains Mono', family: "'JetBrains Mono', monospace", builtin: true },

  // Display / Title fonts
  { slug: 'playfair-display', label: 'Playfair Display', family: "'Playfair Display', serif", googleFamily: 'Playfair+Display', weights: '400;700;900' },
  { slug: 'oswald', label: 'Oswald', family: "'Oswald', sans-serif", googleFamily: 'Oswald', weights: '400;500;700' },
  { slug: 'bebas-neue', label: 'Bebas Neue', family: "'Bebas Neue', sans-serif", googleFamily: 'Bebas+Neue', weights: '400' },
  { slug: 'dm-serif-display', label: 'DM Serif Display', family: "'DM Serif Display', serif", googleFamily: 'DM+Serif+Display', weights: '400' },
  { slug: 'cormorant-garamond', label: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", googleFamily: 'Cormorant+Garamond', weights: '400;600;700' },
  { slug: 'montserrat', label: 'Montserrat', family: "'Montserrat', sans-serif", googleFamily: 'Montserrat', weights: '400;600;700;900' },
  { slug: 'poppins', label: 'Poppins', family: "'Poppins', sans-serif", googleFamily: 'Poppins', weights: '400;600;700;900' },
  { slug: 'raleway', label: 'Raleway', family: "'Raleway', sans-serif", googleFamily: 'Raleway', weights: '400;600;700;900' },

  // Script / Eyebrow fonts
  { slug: 'dancing-script', label: 'Dancing Script', family: "'Dancing Script', cursive", googleFamily: 'Dancing+Script', weights: '400;700' },
  { slug: 'great-vibes', label: 'Great Vibes', family: "'Great Vibes', cursive", googleFamily: 'Great+Vibes', weights: '400' },
  { slug: 'sacramento', label: 'Sacramento', family: "'Sacramento', cursive", googleFamily: 'Sacramento', weights: '400' },
  { slug: 'pacifico', label: 'Pacifico', family: "'Pacifico', cursive", googleFamily: 'Pacifico', weights: '400' },
  { slug: 'caveat', label: 'Caveat', family: "'Caveat', cursive", googleFamily: 'Caveat', weights: '400;700' },

  // Body fonts
  { slug: 'inter', label: 'Inter', family: "'Inter', sans-serif", googleFamily: 'Inter', weights: '400;500;600;700' },
  { slug: 'lora', label: 'Lora', family: "'Lora', serif", googleFamily: 'Lora', weights: '400;500;600;700' },
  { slug: 'source-sans-3', label: 'Source Sans 3', family: "'Source Sans 3', sans-serif", googleFamily: 'Source+Sans+3', weights: '400;600;700' },
  { slug: 'open-sans', label: 'Open Sans', family: "'Open Sans', sans-serif", googleFamily: 'Open+Sans', weights: '400;600;700' },
  { slug: 'nunito', label: 'Nunito', family: "'Nunito', sans-serif", googleFamily: 'Nunito', weights: '400;600;700' },
  { slug: 'work-sans', label: 'Work Sans', family: "'Work Sans', sans-serif", googleFamily: 'Work+Sans', weights: '400;500;600;700' },
  { slug: 'libre-baskerville', label: 'Libre Baskerville', family: "'Libre Baskerville', serif", googleFamily: 'Libre+Baskerville', weights: '400;700' },

  // Mono / Label fonts
  { slug: 'ibm-plex-mono', label: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace", googleFamily: 'IBM+Plex+Mono', weights: '400;500;700' },
  { slug: 'fira-code', label: 'Fira Code', family: "'Fira Code', monospace", googleFamily: 'Fira+Code', weights: '400;500;700' },
  { slug: 'source-code-pro', label: 'Source Code Pro', family: "'Source Code Pro', monospace", googleFamily: 'Source+Code+Pro', weights: '400;500;700' },
  { slug: 'space-mono', label: 'Space Mono', family: "'Space Mono', monospace", googleFamily: 'Space+Mono', weights: '400;700' },
  { slug: 'roboto-mono', label: 'Roboto Mono', family: "'Roboto Mono', monospace", googleFamily: 'Roboto+Mono', weights: '400;500;700' },
]

const PALETTE_MAP = new Map(FONT_PALETTE.map((f) => [f.slug, f]))

// Default slugs for each role
const ROLE_DEFAULTS: Record<string, string> = {
  display: 'formula1',
  script: 'northwell',
  body: 'titillium-web',
  mono: 'jetbrains-mono',
}

const ROLE_DEFAULT_LABELS: Record<string, string> = {
  display: 'Formula1',
  script: 'Northwell',
  body: 'Titillium Web',
  mono: 'JetBrains Mono',
}

const CSS_VAR_FOR_ROLE: Record<string, string> = {
  display: '--font-display',
  script: '--font-script',
  body: '--font-body',
  mono: '--font-mono',
}

const CSS_WEIGHT_VAR_FOR_ROLE: Record<string, string> = {
  display: '--font-display-weight',
  script: '--font-script-weight',
  body: '--font-body-weight',
  mono: '--font-mono-weight',
}

const ROLE_DEFAULT_WEIGHTS: Record<string, string> = {
  display: '900',
  script: '400',
  body: '400',
  mono: '400',
}

const WEIGHT_LABELS: Record<string, string> = {
  '100': '100 · Thin',
  '200': '200 · Extra Light',
  '300': '300 · Light',
  '400': '400 · Regular',
  '500': '500 · Medium',
  '600': '600 · Semi Bold',
  '700': '700 · Bold',
  '800': '800 · Extra Bold',
  '900': '900 · Black',
}

// ── Custom font helpers ─────────────────────────────────────────────────

/** Returns true if a font slug references a custom uploaded font. */
export function isCustomFontSlug(slug: string): boolean {
  return slug.startsWith(CUSTOM_PREFIX)
}

/** Extract the _key from a custom font slug. */
function customFontKey(slug: string): string {
  return slug.slice(CUSTOM_PREFIX.length)
}

/** Build a slug for a custom font from its _key. */
export function customFontSlug(key: string): string {
  return `${CUSTOM_PREFIX}${key}`
}

/** Find a custom font by its _key in the array. */
function findCustomFont(key: string, customFonts?: CustomFont[] | null): CustomFont | undefined {
  return customFonts?.find((f) => f._key === key)
}

/** Deterministic font-family name for a custom uploaded font. */
export function customFontFamilyName(key: string): string {
  return `CustomFont-${key}`
}

/**
 * Resolve a Sanity file asset _ref to a CDN URL.
 * Ref format: `file-{hash}-{ext}` → `https://cdn.sanity.io/files/{project}/{dataset}/{hash}.{ext}`
 */
/**
 * Returns a URL for a Sanity file asset that works with @font-face.
 * Uses our own /api/font proxy to avoid CORS issues (Sanity CDN doesn't
 * send CORS headers for font files requested from non-whitelisted origins).
 */
export function sanityFileUrl(ref: string): string | null {
  const match = ref.match(/^file-([a-zA-Z0-9]+)-([a-z0-9]+)$/)
  if (!match) return null
  return `/api/font?ref=${encodeURIComponent(ref)}`
}

/** Map file extension to CSS @font-face format string. */
const FORMAT_MAP: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
}

/**
 * Generates `@font-face` CSS rules for ALL custom uploaded fonts.
 * One rule per weight per font. Returns null when no custom fonts exist.
 */
export function customFontFaceCss(customFonts?: CustomFont[] | null): string | null {
  if (!customFonts?.length) return null
  const rules: string[] = []
  for (const font of customFonts) {
    if (!font.weights?.length) continue
    const familyName = customFontFamilyName(font._key)
    for (const w of font.weights) {
      if (!w.dataUri) continue
      rules.push(
        `@font-face{font-family:'${familyName}';font-weight:${w.weight || '400'};src:url(${w.dataUri});font-display:swap;}`
      )
    }
  }
  return rules.length > 0 ? rules.join('\n') : null
}

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Returns CSS variable overrides for the given font selections.
 * Supports both palette fonts and custom uploaded fonts (slug: `custom:<_key>`).
 */
export function fontOverrideVars(
  overrides?: FontOverrides | null,
  customFonts?: CustomFont[] | null,
): CSSProperties | undefined {
  if (!overrides) return undefined

  const vars: Record<string, string> = {}

  const familyRoles = ['display', 'script', 'body', 'mono'] as const
  for (const role of familyRoles) {
    const slug = overrides[role]
    if (!slug) continue
    if (slug === ROLE_DEFAULTS[role]) continue

    // Custom uploaded font
    if (isCustomFontSlug(slug)) {
      const font = findCustomFont(customFontKey(slug), customFonts)
      if (font?.weights?.length) {
        const cssVar = CSS_VAR_FOR_ROLE[role]
        if (cssVar) vars[cssVar] = `'${customFontFamilyName(font._key)}', sans-serif`
      }
      continue
    }

    const entry = PALETTE_MAP.get(slug)
    if (!entry) continue
    const cssVar = CSS_VAR_FOR_ROLE[role]
    if (cssVar) vars[cssVar] = entry.family
  }

  // Font weight overrides
  const weightKeys = { displayWeight: 'display', scriptWeight: 'script', bodyWeight: 'body', monoWeight: 'mono' } as const
  for (const [key, role] of Object.entries(weightKeys)) {
    const weight = overrides?.[key as keyof FontOverrides]
    if (!weight) continue
    if (weight === ROLE_DEFAULT_WEIGHTS[role]) continue
    const cssVar = CSS_WEIGHT_VAR_FOR_ROLE[role]
    if (cssVar) vars[cssVar] = weight
  }

  return Object.keys(vars).length > 0 ? (vars as unknown as CSSProperties) : undefined
}

/**
 * Builds a Google Fonts CSS v2 URL for all non-builtin palette fonts selected.
 * Returns null when no external fonts need loading.
 */
export function googleFontsUrl(overrides?: FontOverrides | null): string | null {
  if (!overrides) return null

  const families = new Map<string, string>()
  for (const slug of Object.values(overrides)) {
    if (!slug) continue
    if (isCustomFontSlug(slug)) continue // custom fonts loaded via @font-face
    const entry = PALETTE_MAP.get(slug)
    if (!entry || entry.builtin || !entry.googleFamily) continue
    if (!families.has(entry.googleFamily)) {
      families.set(entry.googleFamily, entry.weights ?? '400')
    }
  }

  if (families.size === 0) return null

  const params = Array.from(families.entries())
    .map(([family, weights]) => `family=${family}:wght@${weights}`)
    .join('&')

  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

/**
 * Returns the CSS font-family string for a font slug.
 * Supports palette fonts and custom uploaded fonts.
 */
export function fontFamilyForSlug(
  slug: string | undefined,
  role: string,
  customFonts?: CustomFont[] | null,
): string {
  if (slug && isCustomFontSlug(slug)) {
    const font = findCustomFont(customFontKey(slug), customFonts)
    if (font?.weights?.length) return `'${customFontFamilyName(font._key)}', sans-serif`
  }
  if (slug) {
    const entry = PALETTE_MAP.get(slug)
    if (entry) return entry.family
  }
  const defaultSlug = ROLE_DEFAULTS[role]
  if (defaultSlug) {
    const entry = PALETTE_MAP.get(defaultSlug)
    if (entry) return entry.family
  }
  return 'sans-serif'
}

/**
 * Returns a single Google Fonts CSS URL for a specific font slug.
 * Returns null for built-in, custom, or unknown fonts.
 */
export function googleFontsUrlForSlug(slug: string | undefined): string | null {
  if (!slug || isCustomFontSlug(slug)) return null
  const entry = PALETTE_MAP.get(slug)
  if (!entry || entry.builtin || !entry.googleFamily) return null
  return `https://fonts.googleapis.com/css2?family=${entry.googleFamily}:wght@${entry.weights ?? '400'}&display=swap`
}

/**
 * Returns FieldSelect options for a given font role.
 * Includes palette fonts + any custom uploaded fonts from the brochure.
 */
export function fontOptionsForRole(
  role: string,
  customFonts?: CustomFont[] | null,
): { value: string; label: string }[] {
  const defaultLabel = ROLE_DEFAULT_LABELS[role] ?? 'Default'
  const defaultSlug = ROLE_DEFAULTS[role] ?? ''

  const options: { value: string; label: string }[] = [
    { value: '', label: `Default (${defaultLabel})` },
  ]

  // Custom uploaded fonts first
  if (customFonts?.length) {
    for (const font of customFonts) {
      if (!font.weights?.length) continue
      options.push({
        value: customFontSlug(font._key),
        label: font.name || 'Untitled font',
      })
    }
  }

  for (const entry of FONT_PALETTE) {
    if (entry.slug === defaultSlug) continue
    options.push({ value: entry.slug, label: entry.label })
  }

  return options
}

/**
 * Returns FieldSelect weight options for a given font slug.
 * Supports both palette fonts and custom uploaded fonts.
 */
export function weightOptionsForRole(
  role: string,
  fontSlug?: string,
  customFonts?: CustomFont[] | null,
): { value: string; label: string }[] {
  const defaultWeight = ROLE_DEFAULT_WEIGHTS[role] ?? '400'
  const options: { value: string; label: string }[] = [
    { value: '', label: `Default (${defaultWeight})` },
  ]

  // Custom uploaded font — derive weights from uploaded files
  if (fontSlug && isCustomFontSlug(fontSlug)) {
    const font = findCustomFont(customFontKey(fontSlug), customFonts)
    if (font?.weights?.length) {
      for (const w of font.weights) {
        if (!w.weight || w.weight === defaultWeight) continue
        options.push({ value: w.weight, label: WEIGHT_LABELS[w.weight] ?? w.weight })
      }
    }
    return options
  }

  // Palette font — derive weights from the font entry
  const entry = fontSlug ? PALETTE_MAP.get(fontSlug) : null
  const weightStr = entry?.weights ?? '400;700;900'
  const available = weightStr.split(';').filter(Boolean)

  for (const w of available) {
    if (w === defaultWeight) continue
    options.push({ value: w, label: WEIGHT_LABELS[w] ?? w })
  }

  return options
}

// ── Text scale (re-exported for SectionRenderer) ────────────────────────

import type { TextScalePreset } from '@/types/brochure'

export const SCALE_MAP: Record<TextScalePreset, number> = {
  xs: 0.7,
  s: 0.85,
  m: 1,
  l: 1.15,
  xl: 1.3,
}
