import type {
  Brochure,
  BrochureTheme,
  FontOverrides,
  SanityImage,
  TextScalePreset,
} from '@/types/brochure'

/**
 * Resolves brochure-level branding & typography values, falling back to the
 * assigned host company's defaults when the brochure-level field is empty.
 *
 * The brochure may carry a `companyBranding` snapshot decoded by GROQ from
 * `company->{...}`; when present and the brochure-level value is unset we
 * inherit from there. This is the "live fallback" model — admins only need
 * to set per-brochure values when they want to override the company default.
 *
 * Use `??` (not `||`) so a deliberately-set falsy value (boolean false,
 * empty string for transform 'none') beats the inherited default.
 */

const cb = (b: Brochure) => b.companyBranding

// ───────── Branding ─────────

export function resolvedTheme(b: Brochure): BrochureTheme | undefined {
  return b.theme ?? cb(b)?.theme
}

export function resolvedAccentColor(b: Brochure): string | undefined {
  return b.accentColor || cb(b)?.accentColor || undefined
}

export function resolvedBackgroundColor(b: Brochure): string | undefined {
  return b.backgroundColor || cb(b)?.backgroundColor || undefined
}

export function resolvedTextColor(b: Brochure): string | undefined {
  return b.textColor || cb(b)?.textColor || undefined
}

export function resolvedTitleColor(b: Brochure): string | undefined {
  return b.titleColor || cb(b)?.titleColor || undefined
}

export function resolvedBodyColor(b: Brochure): string | undefined {
  return b.bodyColor || cb(b)?.bodyColor || undefined
}

export function resolvedNavColor(b: Brochure): string | undefined {
  return b.navColor || cb(b)?.navColor || undefined
}

export function resolvedLogo(b: Brochure): SanityImage | undefined {
  return b.logo ?? cb(b)?.logo
}

export function resolvedTextureImage(b: Brochure): SanityImage | undefined {
  return b.textureImage ?? cb(b)?.textureImage
}

export function resolvedHideTexture(b: Brochure): boolean | undefined {
  return b.hideTexture ?? cb(b)?.hideTexture
}

// ───────── Typography ─────────

export function resolvedTitleItalic(b: Brochure): boolean | undefined {
  return b.titleItalic ?? cb(b)?.titleItalic
}

export function resolvedTitleTransform(b: Brochure): string | undefined {
  return b.titleTransform ?? cb(b)?.titleTransform
}

export function resolvedEyebrowItalic(b: Brochure): boolean | undefined {
  return b.eyebrowItalic ?? cb(b)?.eyebrowItalic
}

export function resolvedEyebrowTransform(b: Brochure): string | undefined {
  return b.eyebrowTransform ?? cb(b)?.eyebrowTransform
}

export function resolvedTitleScale(b: Brochure): TextScalePreset | undefined {
  return b.titleScale ?? cb(b)?.titleScale
}

export function resolvedEyebrowScale(b: Brochure): TextScalePreset | undefined {
  return b.eyebrowScale ?? cb(b)?.eyebrowScale
}

export function resolvedTaglineScale(b: Brochure): TextScalePreset | undefined {
  return b.taglineScale ?? cb(b)?.taglineScale
}

/**
 * Per-key merge: a brochure with a custom display font shouldn't lose the
 * company's body-font default. Returns undefined when neither side has any
 * key set, so renderers can short-circuit.
 */
export function resolvedFontOverrides(b: Brochure): FontOverrides | undefined {
  const company = cb(b)?.fontOverrides
  const own = b.fontOverrides
  if (!company && !own) return undefined
  return {
    display: own?.display ?? company?.display,
    displayWeight: own?.displayWeight ?? company?.displayWeight,
    script: own?.script ?? company?.script,
    scriptWeight: own?.scriptWeight ?? company?.scriptWeight,
    body: own?.body ?? company?.body,
    bodyWeight: own?.bodyWeight ?? company?.bodyWeight,
    mono: own?.mono ?? company?.mono,
    monoWeight: own?.monoWeight ?? company?.monoWeight,
  }
}

/**
 * Resolved values for the three text-scale CSS-variable inputs. Wrapper for
 * `textScaleVars(brochure)` callers that need company-fallback applied.
 */
export function resolvedTextScales(b: Brochure): {
  titleScale?: TextScalePreset
  eyebrowScale?: TextScalePreset
  taglineScale?: TextScalePreset
} {
  return {
    titleScale: resolvedTitleScale(b),
    eyebrowScale: resolvedEyebrowScale(b),
    taglineScale: resolvedTaglineScale(b),
  }
}

// ───────── Inheritance predicates (for "Inherited from {company}" UX) ─────────

export function accentInheritedFromCompany(b: Brochure): boolean {
  return !b.accentColor && Boolean(cb(b)?.accentColor)
}

export function logoInheritedFromCompany(b: Brochure): boolean {
  return !b.logo && Boolean(cb(b)?.logo)
}

export function themeInheritedFromCompany(b: Brochure): boolean {
  return b.theme === undefined && cb(b)?.theme !== undefined
}

export function backgroundColorInheritedFromCompany(b: Brochure): boolean {
  return !b.backgroundColor && Boolean(cb(b)?.backgroundColor)
}

export function textColorInheritedFromCompany(b: Brochure): boolean {
  return !b.textColor && Boolean(cb(b)?.textColor)
}

export function titleColorInheritedFromCompany(b: Brochure): boolean {
  return !b.titleColor && Boolean(cb(b)?.titleColor)
}

export function bodyColorInheritedFromCompany(b: Brochure): boolean {
  return !b.bodyColor && Boolean(cb(b)?.bodyColor)
}

export function navColorInheritedFromCompany(b: Brochure): boolean {
  return !b.navColor && Boolean(cb(b)?.navColor)
}

export function textureInheritedFromCompany(b: Brochure): boolean {
  return !b.textureImage && Boolean(cb(b)?.textureImage)
}

export function hideTextureInheritedFromCompany(b: Brochure): boolean {
  return b.hideTexture === undefined && cb(b)?.hideTexture !== undefined
}
