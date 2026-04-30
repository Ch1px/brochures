import { groq } from 'next-sanity'

/**
 * Public brochure by slug, only if published.
 * Returns null if not found, not published, or unpublished/archived.
 *
 * Ordered by newest first so that if multiple brochures ever share a slug
 * (e.g. an old published doc wasn't re-statused before a new one was created),
 * the most-recently-published one always wins. `coalesce(publishedAt,
 * _updatedAt)` falls back to _updatedAt for docs that were published before
 * publishedAt started being stamped.
 */
/**
 * Tenant-aware variants of BROCHURE_BY_SLUG.
 *
 * `$companyId` is either a Sanity document id (child-host request, scoped to
 * that company) or an empty string (canonical host). The empty-string path
 * matches only brochures with no `company` ref, so canonical never serves a
 * brochure that belongs to a child company and vice versa.
 */
export const BROCHURE_BY_SLUG = groq`
  *[_type == "brochure" && slug.current == $slug && status == "published"
    && (($companyId == "" && !defined(company)) || company._ref == $companyId)
  ] | order(coalesce(publishedAt, _updatedAt) desc)[0]{
    _id,
    title,
    slug,
    season,
    event,
    status,
    theme,
    accentColor,
    backgroundColor,
    textColor,
    titleColor,
    bodyColor,
    eyebrowItalic,
    eyebrowTransform,
    titleItalic,
    titleTransform,
    fontOverrides,
    customFonts,
    titleScale,
    eyebrowScale,
    taglineScale,
    customColors,
    navColor,
    textureImage,
    hideTexture,
    logo,
    publishedAt,
    "companyBranding": company->{_id, name, accentColor, logo, favicon},
    "ogImage": seo.ogImage,
    "seo": {
      "metaTitle": coalesce(seo.metaTitle, title),
      "metaDescription": seo.metaDescription,
      "ogImage": seo.ogImage,
      "noIndex": seo.noIndex
    },
    "leadCapture": leadCapture,
    pages[]{
      _key,
      name,
      sections[]{
        ...
      }
    }
  }
`

/**
 * Preview: same as above but without the status filter, for signed preview links.
 * Also ordered newest-first so duplicate-slug cases resolve deterministically.
 */
export const BROCHURE_BY_SLUG_PREVIEW = groq`
  *[_type == "brochure" && slug.current == $slug
    && (($companyId == "" && !defined(company)) || company._ref == $companyId)
  ] | order(coalesce(publishedAt, _updatedAt) desc)[0]{
    _id,
    title,
    slug,
    season,
    event,
    status,
    theme,
    accentColor,
    backgroundColor,
    textColor,
    titleColor,
    bodyColor,
    eyebrowItalic,
    eyebrowTransform,
    titleItalic,
    titleTransform,
    fontOverrides,
    customFonts,
    titleScale,
    eyebrowScale,
    taglineScale,
    customColors,
    navColor,
    textureImage,
    hideTexture,
    logo,
    publishedAt,
    "companyBranding": company->{_id, name, accentColor, logo, favicon},
    "ogImage": seo.ogImage,
    "seo": {
      "metaTitle": coalesce(seo.metaTitle, title),
      "metaDescription": seo.metaDescription,
      "ogImage": seo.ogImage,
      "noIndex": true
    },
    "leadCapture": leadCapture,
    pages[]{
      _key,
      name,
      sections[]{
        ...
      }
    }
  }
`

/**
 * Variant of BROCHURE_BY_SLUG that ignores the company filter. Used by
 * server-only callers that don't have a host context (e.g. /api/export PDF
 * pipeline) and where slugs are globally unique. Don't expose this through
 * a public route — it bypasses tenant scoping by design.
 */
export const BROCHURE_BY_SLUG_ANY_COMPANY = groq`
  *[_type == "brochure" && slug.current == $slug && status == "published"
  ] | order(coalesce(publishedAt, _updatedAt) desc)[0]{
    _id,
    title,
    slug,
    season,
    event,
    status,
    theme,
    accentColor,
    backgroundColor,
    textColor,
    titleColor,
    bodyColor,
    eyebrowItalic,
    eyebrowTransform,
    titleItalic,
    titleTransform,
    fontOverrides,
    customFonts,
    titleScale,
    eyebrowScale,
    taglineScale,
    customColors,
    navColor,
    textureImage,
    hideTexture,
    logo,
    publishedAt,
    company,
    "companyBranding": company->{_id, name, accentColor, logo, favicon},
    "ogImage": seo.ogImage,
    "seo": {
      "metaTitle": coalesce(seo.metaTitle, title),
      "metaDescription": seo.metaDescription,
      "ogImage": seo.ogImage,
      "noIndex": seo.noIndex
    },
    "leadCapture": leadCapture,
    pages[]{
      _key,
      name,
      sections[]{
        ...
      }
    }
  }
`

export const BROCHURE_BY_SLUG_ANY_COMPANY_PREVIEW = groq`
  *[_type == "brochure" && slug.current == $slug
  ] | order(coalesce(publishedAt, _updatedAt) desc)[0]{
    _id,
    title,
    slug,
    season,
    event,
    status,
    theme,
    accentColor,
    backgroundColor,
    textColor,
    titleColor,
    bodyColor,
    eyebrowItalic,
    eyebrowTransform,
    titleItalic,
    titleTransform,
    fontOverrides,
    customFonts,
    titleScale,
    eyebrowScale,
    taglineScale,
    customColors,
    navColor,
    textureImage,
    hideTexture,
    logo,
    publishedAt,
    company,
    "companyBranding": company->{_id, name, accentColor, logo, favicon},
    "ogImage": seo.ogImage,
    "seo": {
      "metaTitle": coalesce(seo.metaTitle, title),
      "metaDescription": seo.metaDescription,
      "ogImage": seo.ogImage,
      "noIndex": true
    },
    "leadCapture": leadCapture,
    pages[]{
      _key,
      name,
      sections[]{
        ...
      }
    }
  }
`

/**
 * The featured brochure on the canonical host. Only returns brochures with no
 * `company` ref (canonical-only) and published status.
 */
export const FEATURED_BROCHURE_SLUG = groq`
  *[_type == "brochure" && featured == true && status == "published" && !defined(company)][0]{
    "slug": slug.current
  }
`

/**
 * The featured brochure for a specific company host. Returns only published
 * brochures referencing the given company. Falls back to the company's
 * `featuredBrochure` reference if no brochure self-flags as featured.
 */
export const COMPANY_FEATURED_BROCHURE_SLUG = groq`
  *[_type == "brochure" && featured == true && status == "published"
    && company._ref == $companyId][0]{
    "slug": slug.current
  }
`

/**
 * Every company, projected for the admin list view.
 */
export const ALL_COMPANIES_FOR_ADMIN = groq`
  *[_type == "company"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    domain,
    displayName,
    website,
    accentColor,
    logo,
    favicon,
    "featuredBrochure": featuredBrochure->{_id, title, "slug": slug.current},
    "brochureCount": count(*[_type == "brochure" && references(^._id)])
  }
`

/**
 * Companies, projected for the brochure-editor picker dropdown. Includes
 * the company's branding defaults (accentColor + logo) so the editor's
 * Settings → Branding tab can preview inherited fallbacks live when the
 * admin reassigns a brochure's host company.
 */
export const COMPANIES_FOR_PICKER = groq`
  *[_type == "company"] | order(name asc) {
    _id,
    name,
    domain,
    accentColor,
    logo
  }
`

/**
 * Lightweight projection of every company that has a domain set. Consumed by
 * the host->company map in middleware.
 */
export const ALL_COMPANIES_FOR_HOSTMAP = groq`
  *[_type == "company" && defined(domain)]{
    _id,
    domain,
    displayName,
    accentColor
  }
`

/**
 * Single company by id, including branding the holding page needs.
 */
export const COMPANY_BY_ID = groq`
  *[_type == "company" && _id == $companyId][0]{
    _id,
    name,
    "slug": slug,
    domain,
    displayName,
    website,
    logo,
    favicon,
    accentColor,
    featuredBrochure->{
      "slug": slug.current,
      status
    }
  }
`

/**
 * Combined index for the admin shell's ⌘K command palette. Pulls just
 * the fields needed to surface a result (title/name + the bit of meta
 * shown beside it) — kept cheap so it can ship to the client on every
 * admin page. Filtering is done client-side in the palette.
 */
export const SEARCH_INDEX_FOR_SHELL = groq`{
  "brochures": *[_type == "brochure"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    "slug": slug.current,
    season,
    event,
    status
  },
  "companies": *[_type == "company"] | order(name asc) {
    _id,
    name,
    domain
  },
  "media": *[_type == "sanity.imageAsset"] | order(_createdAt desc) [0...100] {
    _id,
    "filename": originalFilename
  }
}`

/**
 * Top 5 brochures by last edit, minimal fields, for the admin shell's
 * "Recent" sidebar section. Excludes archived so old brochures don't
 * crowd it out.
 */
export const RECENT_BROCHURES_FOR_SHELL = groq`
  *[_type == "brochure" && status != "archived"] | order(_updatedAt desc) [0...5] {
    _id,
    title,
    "slug": slug.current,
    status,
    _updatedAt
  }
`

/**
 * All brochures for the admin library.
 */
export const ALL_BROCHURES = groq`
  *[_type == "brochure"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    _updatedAt,
    title,
    "slug": slug.current,
    season,
    event,
    status,
    publishedAt,
    featured,
    lastEditedBy,
    // Brochure-level branding — pulled so the admin library card can render
    // the actual cover section through SectionRenderer (mini live preview).
    theme,
    accentColor,
    backgroundColor,
    textColor,
    titleColor,
    bodyColor,
    eyebrowItalic,
    eyebrowTransform,
    titleItalic,
    titleTransform,
    fontOverrides,
    customFonts,
    titleScale,
    eyebrowScale,
    taglineScale,
    navColor,
    textureImage,
    hideTexture,
    customColors,
    logo,
    "pageCount": count(pages),
    // First cover/coverCentered section on page 1 — full payload (not just
    // the image) so we can hand it to <SectionRenderer/> as a live thumbnail.
    "coverSection": pages[0].sections[_type == "cover" || _type == "coverCentered"][0],
    "company": company->{_id, name, accentColor, domain, logo}
  }
`

/**
 * Published brochures for sitemap.xml.
 */
/**
 * All image assets for the media library.
 */
export const ALL_IMAGE_ASSETS = groq`
  *[_type == "sanity.imageAsset"] | order(_createdAt desc) {
    _id,
    originalFilename,
    url,
    metadata {
      dimensions {
        width,
        height
      }
    },
    size,
    _createdAt
  }
`

export const PUBLISHED_BROCHURES_SITEMAP = groq`
  *[_type == "brochure" && status == "published"]{
    "slug": slug.current,
    publishedAt,
    _updatedAt
  }
`
