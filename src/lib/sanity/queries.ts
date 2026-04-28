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
export const BROCHURE_BY_SLUG = groq`
  *[_type == "brochure" && slug.current == $slug && status == "published"] | order(coalesce(publishedAt, _updatedAt) desc)[0]{
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
    fontOverrides,
    customColors,
    navColor,
    textureImage,
    hideTexture,
    logo,
    publishedAt,
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
  *[_type == "brochure" && slug.current == $slug] | order(coalesce(publishedAt, _updatedAt) desc)[0]{
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
    fontOverrides,
    customColors,
    navColor,
    textureImage,
    hideTexture,
    logo,
    publishedAt,
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
 * The featured brochure — drives the subdomain-root redirect.
 * Only returns if the brochure is also published.
 */
export const FEATURED_BROCHURE_SLUG = groq`
  *[_type == "brochure" && featured == true && status == "published"][0]{
    "slug": slug.current
  }
`

/**
 * All brochures for the admin library.
 */
export const ALL_BROCHURES = groq`
  *[_type == "brochure"] | order(coalesce(publishedAt, _createdAt) desc) {
    _id,
    title,
    "slug": slug.current,
    season,
    event,
    status,
    publishedAt,
    featured,
    "pageCount": count(pages),
    "ogImage": seo.ogImage
  }
`

/**
 * Published brochures for sitemap.xml.
 */
export const PUBLISHED_BROCHURES_SITEMAP = groq`
  *[_type == "brochure" && status == "published"]{
    "slug": slug.current,
    publishedAt,
    _updatedAt
  }
`
