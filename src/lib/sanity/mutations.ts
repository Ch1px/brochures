import 'server-only'
import { sanityWriteClient } from './client'
import type { Brochure, SanityImage } from '@/types/brochure'

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
  logo?: SanityImage | null
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
    if (updates.logo !== undefined) {
      if (updates.logo === null) unset.push('logo')
      else patch.logo = updates.logo
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
