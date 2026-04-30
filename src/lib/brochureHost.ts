/**
 * Public-host resolution for brochures. A brochure is served either on its
 * assigned host-company domain or on the canonical GPGT host. Used wherever
 * the admin UI needs to build a public/preview URL that mirrors how the
 * end visitor sees the brochure.
 */

export const CANONICAL_HOST =
  process.env.NEXT_PUBLIC_CANONICAL_HOST || 'brochures.grandprixgrandtours.com'

export function brochureHost(companyDomain: string | null | undefined): string {
  return companyDomain || CANONICAL_HOST
}

export function brochurePublicUrl(slug: string, companyDomain: string | null | undefined): string {
  return `https://${brochureHost(companyDomain)}/${slug}`
}
