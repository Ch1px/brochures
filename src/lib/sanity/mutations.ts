import 'server-only'
import { sanityWriteClient } from './client'
import type { Brochure, CustomFont, FontOverrides, SanityImage } from '@/types/brochure'

/**
 * Sanity mutations for brochure documents — all server-side only.
 * Import from server components or server actions. Never import in client components.
 *
 * Pattern: for a single-admin editor, a whole-doc `set()` patch on the pages array
 * is simplest and robust. Sanity treats it atomically. If we ever need multi-admin
 * editing we'd switch to more granular array operations (insert/unset by _key).
 */

/** Fetch a brochure for editing (includes drafts via previewDrafts perspective). */
export async function fetchBrochureForEdit(id: string): Promise<Brochure | null> {
  return sanityWriteClient.fetch<Brochure | null>(`*[_id == $id][0]`, { id })
}

/**
 * Upload an image file to Sanity Storage.
 * Returns the asset doc; callers should build a { _type: 'image', asset: { _ref } } ref.
 */
export async function uploadImageAsset(
  body: Buffer,
  options: { filename: string; contentType: string }
) {
  return sanityWriteClient.assets.upload('image', body, {
    filename: options.filename,
    contentType: options.contentType,
  })
}

/**
 * Upload a generic file (e.g. video) to Sanity Storage.
 * Returns the asset doc; callers should build a { _type: 'file', asset: { _ref } } ref.
 */
export async function uploadFileAsset(
  body: Buffer,
  options: { filename: string; contentType: string }
) {
  return sanityWriteClient.assets.upload('file', body, {
    filename: options.filename,
    contentType: options.contentType,
  })
}

/** Save the editable fields of a brochure. Does not touch status/publishedAt/featured. */
export async function saveBrochure(
  id: string,
  updates: Partial<
    Pick<
      Brochure,
      | 'title'
      | 'pages'
      | 'seo'
      | 'leadCapture'
      | 'season'
      | 'event'
      | 'theme'
      | 'accentColor'
      | 'backgroundColor'
      | 'textColor'
      | 'titleColor'
      | 'bodyColor'
      | 'eyebrowItalic'
      | 'eyebrowTransform'
      | 'fontOverrides'
      | 'customColors'
      | 'navColor'
      | 'textureImage'
      | 'hideTexture'
      | 'logo'
    >
  >
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sanityWriteClient.patch(id).set(updates).commit({ autoGenerateArrayKeys: true })
    return { ok: true }
  } catch (err) {
    console.error('saveBrochure failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/**
 * Update brochure settings (slug, season, event, SEO, lead capture).
 * Separate from saveBrochure() because slug needs a uniqueness check and
 * these fields aren't part of the autosave write path.
 *
 * Slug rule: no other brochure document may already hold the new slug.
 * Allowed to match our own document's current slug (noop change).
 */
export type BrochureSettingsUpdate = {
  slug?: string
  season?: string
  event?: string
  accentColor?: string | null
  backgroundColor?: string | null
  textColor?: string | null
  titleColor?: string | null
  bodyColor?: string | null
  eyebrowItalic?: boolean | null
  eyebrowTransform?: string | null
  fontOverrides?: FontOverrides | null
  customFonts?: CustomFont[] | null
  titleScale?: string | null
  eyebrowScale?: string | null
  taglineScale?: string | null
  customColors?: { _key: string; name: string; hex: string }[] | null
  navColor?: string | null
  textureImage?: SanityImage | null
  hideTexture?: boolean | null
  logo?: SanityImage | null
  /**
   * Sanity document id of the owning company, or `null`/`""` to clear the
   * reference (returns the brochure to the canonical host).
   */
  companyId?: string | null
  seo?: {
    metaTitle?: string
    metaDescription?: string
    noIndex?: boolean
  }
  leadCapture?: {
    hubspotPortalId?: string
    hubspotFormId?: string
    destinationEmail?: string
  }
}

export async function updateBrochureSettings(
  id: string,
  updates: BrochureSettingsUpdate
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (updates.slug !== undefined) {
      const slug = updates.slug.trim()
      if (!slug) return { ok: false, error: 'Slug cannot be empty' }
      if (!/^[a-z0-9-]+$/.test(slug)) {
        return { ok: false, error: 'Slug can only contain lowercase letters, numbers, and hyphens' }
      }
      const conflict = await sanityWriteClient.fetch<number>(
        `count(*[_type == "brochure" && slug.current == $slug && _id != $id && _id != $draftId])`,
        { slug, id, draftId: `drafts.${id}` }
      )
      if (conflict > 0) {
        return { ok: false, error: `Slug "${slug}" is already used by another brochure` }
      }
    }

    const patch: Record<string, unknown> = {}
    const unset: string[] = []
    if (updates.slug !== undefined) {
      patch.slug = { _type: 'slug', current: updates.slug.trim() }
    }
    if (updates.season !== undefined) patch.season = updates.season.trim()
    if (updates.event !== undefined) patch.event = updates.event.trim()
    if (updates.seo !== undefined) patch.seo = updates.seo
    if (updates.leadCapture !== undefined) patch.leadCapture = updates.leadCapture
    if (updates.accentColor !== undefined) {
      const trimmed = updates.accentColor?.trim() ?? ''
      if (trimmed === '' || updates.accentColor === null) unset.push('accentColor')
      else patch.accentColor = trimmed
    }
    if (updates.backgroundColor !== undefined) {
      const trimmed = updates.backgroundColor?.trim() ?? ''
      if (trimmed === '' || updates.backgroundColor === null) unset.push('backgroundColor')
      else patch.backgroundColor = trimmed
    }
    if (updates.textColor !== undefined) {
      const trimmed = updates.textColor?.trim() ?? ''
      if (trimmed === '' || updates.textColor === null) unset.push('textColor')
      else patch.textColor = trimmed
    }
    if (updates.titleColor !== undefined) {
      const trimmed = updates.titleColor?.trim() ?? ''
      if (trimmed === '' || updates.titleColor === null) unset.push('titleColor')
      else patch.titleColor = trimmed
    }
    if (updates.bodyColor !== undefined) {
      const trimmed = updates.bodyColor?.trim() ?? ''
      if (trimmed === '' || updates.bodyColor === null) unset.push('bodyColor')
      else patch.bodyColor = trimmed
    }
    if (updates.eyebrowItalic !== undefined) {
      if (updates.eyebrowItalic === null) unset.push('eyebrowItalic')
      else patch.eyebrowItalic = updates.eyebrowItalic
    }
    if (updates.eyebrowTransform !== undefined) {
      if (!updates.eyebrowTransform || updates.eyebrowTransform === null) unset.push('eyebrowTransform')
      else patch.eyebrowTransform = updates.eyebrowTransform
    }
    if (updates.fontOverrides !== undefined) {
      if (updates.fontOverrides === null) unset.push('fontOverrides')
      else patch.fontOverrides = updates.fontOverrides
    }
    if (updates.customFonts !== undefined) {
      if (updates.customFonts === null || (Array.isArray(updates.customFonts) && updates.customFonts.length === 0)) unset.push('customFonts')
      else patch.customFonts = updates.customFonts
    }
    if (updates.titleScale !== undefined) {
      if (updates.titleScale === null || updates.titleScale === 'm') unset.push('titleScale')
      else patch.titleScale = updates.titleScale
    }
    if (updates.eyebrowScale !== undefined) {
      if (updates.eyebrowScale === null || updates.eyebrowScale === 'm') unset.push('eyebrowScale')
      else patch.eyebrowScale = updates.eyebrowScale
    }
    if (updates.taglineScale !== undefined) {
      if (updates.taglineScale === null || updates.taglineScale === 'm') unset.push('taglineScale')
      else patch.taglineScale = updates.taglineScale
    }
    if (updates.customColors !== undefined) {
      if (updates.customColors === null || updates.customColors.length === 0) unset.push('customColors')
      else patch.customColors = updates.customColors
    }
    if (updates.navColor !== undefined) {
      const trimmed = updates.navColor?.trim() ?? ''
      if (trimmed === '' || updates.navColor === null) unset.push('navColor')
      else patch.navColor = trimmed
    }
    if (updates.textureImage !== undefined) {
      if (updates.textureImage === null) unset.push('textureImage')
      else patch.textureImage = updates.textureImage
    }
    if (updates.hideTexture !== undefined) {
      if (updates.hideTexture === null || updates.hideTexture === false) unset.push('hideTexture')
      else patch.hideTexture = updates.hideTexture
    }
    if (updates.logo !== undefined) {
      if (updates.logo === null) unset.push('logo')
      else patch.logo = updates.logo
    }
    if (updates.companyId !== undefined) {
      if (!updates.companyId) unset.push('company')
      else patch.company = { _type: 'reference', _ref: updates.companyId }
    }

    let tx = sanityWriteClient.patch(id)
    if (Object.keys(patch).length > 0) tx = tx.set(patch)
    if (unset.length > 0) tx = tx.unset(unset)
    await tx.commit()
    return { ok: true }
  } catch (err) {
    console.error('updateBrochureSettings failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Transition a brochure's status. Sets publishedAt when going to published. */
export async function setBrochureStatus(
  id: string,
  status: 'draft' | 'published' | 'unpublished' | 'archived'
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const patch = sanityWriteClient.patch(id).set({ status })
    if (status === 'published') {
      patch.setIfMissing({ publishedAt: new Date().toISOString() })
    }
    await patch.commit()
    return { ok: true }
  } catch (err) {
    console.error('setBrochureStatus failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Set the featured flag. Unset it on any other brochure first so only one is featured. */
export async function setFeaturedBrochure(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Unset featured on all other brochures
    const others = await sanityWriteClient.fetch<{ _id: string }[]>(
      `*[_type == "brochure" && featured == true && _id != $id]{ _id }`,
      { id }
    )
    const tx = sanityWriteClient.transaction()
    for (const o of others) tx.patch(o._id, { set: { featured: false } })
    tx.patch(id, { set: { featured: true } })
    await tx.commit()
    return { ok: true }
  } catch (err) {
    console.error('setFeaturedBrochure failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Create a new draft brochure with the required fields pre-filled. */
export async function createBrochure(input: {
  title: string
  slug: string
  season: string
  event?: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const doc = await sanityWriteClient.create({
      _type: 'brochure',
      title: input.title,
      slug: { _type: 'slug', current: input.slug },
      season: input.season,
      event: input.event ?? '',
      status: 'draft',
      featured: false,
      pages: [],
    })
    return { ok: true, id: doc._id }
  } catch (err) {
    console.error('createBrochure failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Duplicate a brochure — copies pages/sections but resets status and slug. */
export async function duplicateBrochure(
  id: string,
  overrides?: { title?: string; slug?: string; season?: string; event?: string }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const src = await sanityWriteClient.fetch<Brochure | null>(`*[_id == $id][0]`, { id })
    if (!src) return { ok: false, error: 'Source brochure not found' }
    const doc = await sanityWriteClient.create({
      _type: 'brochure',
      title: overrides?.title?.trim() || `${src.title} (copy)`,
      slug: {
        _type: 'slug',
        current: overrides?.slug?.trim() || `${src.slug.current}-copy-${Date.now()}`,
      },
      season: overrides?.season?.trim() || src.season,
      event: overrides?.event?.trim() ?? src.event,
      status: 'draft',
      featured: false,
      theme: src.theme,
      accentColor: src.accentColor,
      backgroundColor: src.backgroundColor,
      textColor: src.textColor,
      titleColor: src.titleColor,
      bodyColor: src.bodyColor,
      eyebrowItalic: src.eyebrowItalic,
      eyebrowTransform: src.eyebrowTransform,
      fontOverrides: src.fontOverrides,
      customFonts: src.customFonts,
      titleScale: src.titleScale,
      eyebrowScale: src.eyebrowScale,
      taglineScale: src.taglineScale,
      customColors: src.customColors,
      navColor: src.navColor,
      textureImage: src.textureImage,
      hideTexture: src.hideTexture,
      logo: src.logo,
      pages: src.pages ?? [],
      seo: src.seo,
      leadCapture: src.leadCapture,
    })
    return { ok: true, id: doc._id }
  } catch (err) {
    console.error('duplicateBrochure failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Hard-delete a Sanity image asset. */
export async function deleteImageAsset(assetId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sanityWriteClient.delete(assetId)
    return { ok: true }
  } catch (err) {
    console.error('deleteImageAsset failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

/** Hard-delete a brochure. Prefer archiving in most cases. */
export async function deleteBrochure(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sanityWriteClient.delete(id)
    return { ok: true }
  } catch (err) {
    console.error('deleteBrochure failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ── Company mutations ────────────────────────────────────────────────────

export type CompanyInput = {
  name: string
  slug: string
  domain: string
  displayName: string
  website?: string
  accentColor?: string
  logo?: SanityImage | null
  featuredBrochureId?: string | null
}

function normaliseDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

async function isDomainTakenByOther(domain: string, excludeId?: string): Promise<boolean> {
  const result = await sanityWriteClient.fetch<{ _id: string } | null>(
    `*[_type == "company" && domain == $domain && _id != $excludeId][0]{_id}`,
    { domain, excludeId: excludeId ?? '__none__' }
  )
  return result !== null
}

export async function fetchCompanyForEdit(id: string) {
  return sanityWriteClient.fetch<{
    _id: string
    name: string
    slug?: { current: string }
    domain: string
    displayName: string
    website?: string
    accentColor?: string
    logo?: SanityImage
    featuredBrochure?: { _ref: string; _type: 'reference' }
  } | null>(`*[_id == $id][0]`, { id })
}

export async function createCompany(
  input: CompanyInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const domain = normaliseDomain(input.domain)
    if (!domain) return { ok: false, error: 'Domain is required' }
    if (await isDomainTakenByOther(domain)) {
      return { ok: false, error: `Another company is already using ${domain}` }
    }
    const doc = await sanityWriteClient.create({
      _type: 'company',
      name: input.name.trim(),
      slug: { _type: 'slug', current: input.slug.trim() },
      domain,
      displayName: input.displayName.trim(),
      website: input.website?.trim() || undefined,
      accentColor: input.accentColor?.trim() || undefined,
      logo: input.logo ?? undefined,
      featuredBrochure: input.featuredBrochureId
        ? { _type: 'reference', _ref: input.featuredBrochureId }
        : undefined,
    })
    return { ok: true, id: doc._id }
  } catch (err) {
    console.error('createCompany failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function updateCompany(
  id: string,
  input: CompanyInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const domain = normaliseDomain(input.domain)
    if (!domain) return { ok: false, error: 'Domain is required' }
    if (await isDomainTakenByOther(domain, id)) {
      return { ok: false, error: `Another company is already using ${domain}` }
    }
    // Use unset for the optional fields so clearing them removes the property
    // rather than persisting `null`.
    const set: Record<string, unknown> = {
      name: input.name.trim(),
      slug: { _type: 'slug', current: input.slug.trim() },
      domain,
      displayName: input.displayName.trim(),
    }
    const unset: string[] = []

    if (input.website?.trim()) set.website = input.website.trim()
    else unset.push('website')

    if (input.accentColor?.trim()) set.accentColor = input.accentColor.trim()
    else unset.push('accentColor')

    if (input.logo) set.logo = input.logo
    else unset.push('logo')

    if (input.featuredBrochureId) {
      set.featuredBrochure = { _type: 'reference', _ref: input.featuredBrochureId }
    } else {
      unset.push('featuredBrochure')
    }

    await sanityWriteClient.patch(id).set(set).unset(unset).commit()
    return { ok: true }
  } catch (err) {
    console.error('updateCompany failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function deleteCompany(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    // Block deletion when brochures still reference this company. Without
    // this, the brochures' `company` ref would dangle silently.
    const refs = await sanityWriteClient.fetch<number>(
      `count(*[_type == "brochure" && references($id)])`,
      { id }
    )
    if (refs > 0) {
      return {
        ok: false,
        error: `${refs} brochure${refs === 1 ? '' : 's'} still reference this company. Reassign them first.`,
      }
    }
    await sanityWriteClient.delete(id)
    return { ok: true }
  } catch (err) {
    console.error('deleteCompany failed:', err)
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
