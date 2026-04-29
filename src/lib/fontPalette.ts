import type { CSSProperties } from 'react'
import type { CustomFonts, FontOverrides } from '@/types/brochure'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

/** Special slug used when a custom uploaded font is selected. */
export const CUSTOM_FONT_SLUG = '__custom'

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

// ── Public API ──────────────────────────────────────────────────────────

/**
 * Returns CSS variable overrides for the given font selections.
 * Includes both font-family and font-weight variables.
 * Supports custom uploaded fonts via the `__custom` slug.
 */
export function fontOverrideVars(
  overrides?: FontOverrides | null,
  customFonts?: CustomFonts | null,
): CSSProperties | undefined {
  if (!overrides && !customFonts) return undefined

  const vars: Record<string, string> = {}

  // Font family overrides
  const familyRoles = ['display', 'script', 'body', 'mono'] as const
  for (const role of familyRoles) {
    const slug = overrides?.[role]
    if (!slug) continue
    if (slug === ROLE_DEFAULTS[role]) continue

    // Custom uploaded font
    if (slug === CUSTOM_FONT_SLUG) {
      const custom = customFonts?.[role]
      if (custom?.weights?.length) {
        const familyName = customFontFamilyName(role)
        const cssVar = CSS_VAR_FOR_ROLE[role]
        if (cssVar) vars[cssVar] = `'${familyName}', sans-serif`
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
 * Builds a Google Fonts CSS v2 URL for all non-builtin fonts selected.
 * Returns null when no external fonts need loading.
 */
export function googleFontsUrl(overrides?: FontOverrides | null): string | null {
  if (!overrides) return null

  const families = new Map<string, string>()
  for (const slug of Object.values(overrides)) {
    if (!slug) continue
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
 * Returns the CSS font-family string for a font slug, or the role default
 * if the slug is empty/missing. Used for live previews.
 * Supports `__custom` slug for uploaded fonts.
 */
export function fontFamilyForSlug(
  slug: string | undefined,
  role: string,
  customFonts?: CustomFonts | null,
): string {
  if (slug === CUSTOM_FONT_SLUG && customFonts) {
    const custom = customFonts[role as keyof CustomFonts]
    if (custom?.weights?.length) return `'${customFontFamilyName(role)}', sans-serif`
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
 * Used by the settings modal to load a preview font on demand.
 * Returns null for built-in fonts or unknown slugs.
 */
export function googleFontsUrlForSlug(slug: string | undefined): string | null {
  if (!slug) return null
  const entry = PALETTE_MAP.get(slug)
  if (!entry || entry.builtin || !entry.googleFamily) return null
  return `https://fonts.googleapis.com/css2?family=${entry.googleFamily}:wght@${entry.weights ?? '400'}&display=swap`
}

/**
 * Returns FieldSelect options for a given font role.
 * First option is always the default for that role.
 */
export function fontOptionsForRole(role: string): { value: string; label: string }[] {
  const defaultLabel = ROLE_DEFAULT_LABELS[role] ?? 'Default'
  const defaultSlug = ROLE_DEFAULTS[role] ?? ''

  const options: { value: string; label: string }[] = [
    { value: '', label: `Default (${defaultLabel})` },
  ]

  for (const entry of FONT_PALETTE) {
    if (entry.slug === defaultSlug) continue
    options.push({ value: entry.slug, label: entry.label })
  }

  return options
}

/**
 * Returns FieldSelect weight options for a given role and currently selected font.
 * Shows available weights for the selected font, or a standard set for builtins.
 */
export function weightOptionsForRole(
  role: string,
  fontSlug?: string,
  customFonts?: CustomFonts | null,
): { value: string; label: string }[] {
  const defaultWeight = ROLE_DEFAULT_WEIGHTS[role] ?? '400'
  const options: { value: string; label: string }[] = [
    { value: '', label: `Default (${defaultWeight})` },
  ]

  // Custom uploaded font — derive weights from uploaded files
  if (fontSlug === CUSTOM_FONT_SLUG && customFonts) {
    const custom = customFonts[role as keyof CustomFonts]
    if (custom?.weights?.length) {
      for (const w of custom.weights) {
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

// ── Custom font helpers ─────────────────────────────────────────────────

/** Deterministic font-family name for a custom uploaded font role. */
export function customFontFamilyName(role: string): string {
  return `CustomFont-${role}`
}

/**
 * Resolve a Sanity file asset _ref to a CDN URL.
 * Ref format: `file-{hash}-{ext}` → `https://cdn.sanity.io/files/{project}/{dataset}/{hash}.{ext}`
 */
export function sanityFileUrl(ref: string): string | null {
  const match = ref.match(/^file-([a-zA-Z0-9]+)-([a-z0-9]+)$/)
  if (!match) return null
  const [, hash, ext] = match
  return `https://cdn.sanity.io/files/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${hash}.${ext}`
}

/**
 * Generates `@font-face` CSS rules for any custom uploaded fonts.
 * One rule per weight per role. Returns null when no custom fonts are configured.
 */
export function customFontFaceCss(customFonts?: CustomFonts | null): string | null {
  if (!customFonts) return null
  const rules: string[] = []
  const roles = ['display', 'script', 'body', 'mono'] as const
  for (const role of roles) {
    const custom = customFonts[role]
    if (!custom?.weights?.length) continue
    const familyName = customFontFamilyName(role)
    for (const w of custom.weights) {
      if (!w.file?.asset?._ref) continue
      const url = sanityFileUrl(w.file.asset._ref)
      if (!url) continue
      rules.push(
        `@font-face{font-family:'${familyName}';font-weight:${w.weight || '400'};src:url('${url}') format('woff2');font-display:swap;}`
      )
    }
  }
  return rules.length > 0 ? rules.join('\n') : null
}
