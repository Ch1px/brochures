import type { Brochure, SanityImage } from '@/types/brochure'

/**
 * Resolves brochure-level branding values, falling back to the assigned host
 * company's defaults when the brochure-level field is empty.
 *
 * The brochure may carry a `companyBranding` snapshot decoded by GROQ from
 * `company->{...}`; when present and the brochure-level value is unset we
 * inherit from there. This is the "live fallback" model — admins only need
 * to set per-brochure values when they want to override the company default.
 */

export function resolvedAccentColor(brochure: Brochure): string | undefined {
  return brochure.accentColor || brochure.companyBranding?.accentColor || undefined
}

export function resolvedLogo(brochure: Brochure): SanityImage | undefined {
  return brochure.logo ?? brochure.companyBranding?.logo
}

/** True when this field's effective value is coming from the company, not the brochure. */
export function accentInheritedFromCompany(brochure: Brochure): boolean {
  return !brochure.accentColor && Boolean(brochure.companyBranding?.accentColor)
}

export function logoInheritedFromCompany(brochure: Brochure): boolean {
  return !brochure.logo && Boolean(brochure.companyBranding?.logo)
}
