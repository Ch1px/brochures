'use server'

import { revalidatePath } from 'next/cache'
import { currentUser } from '@clerk/nextjs/server'
import {
  saveBrochure as saveBrochureMutation,
  type SaveBrochureResult,
  setBrochureStatus as setBrochureStatusMutation,
  setFeaturedBrochure as setFeaturedBrochureMutation,
  createBrochure as createBrochureMutation,
  duplicateBrochure as duplicateBrochureMutation,
  deleteBrochure as deleteBrochureMutation,
  deleteImageAsset as deleteImageAssetMutation,
  updateBrochureSettings as updateBrochureSettingsMutation,
  uploadImageAsset,
  uploadFileAsset,
  fetchBrochureForEdit,
  createCompany as createCompanyMutation,
  updateCompany as updateCompanyMutation,
  deleteCompany as deleteCompanyMutation,
  fetchCompanyForEdit,
  type BrochureSettingsUpdate,
  type CompanyInput,
} from './mutations'
import { invalidateHostMap } from '@/lib/companies/hostMap'
import { addDomain, removeDomain, getDomainConfig, type DomainConfig } from '@/lib/vercel/domains'
import { signPreviewToken } from '../previewToken'
import { generateBrochure, type GenerateInput, type GenerateUsage } from '../ai/generator'
import { seedLibraryImages, type SeedResult } from '../ai/imageLibrary'
import type { Brochure, SanityImage, SanityFile } from '@/types/brochure'

/**
 * Server actions — invoked from client components in the editor.
 * All enforce the admin email allowlist before running.
 */

async function assertAdmin() {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!email || !allowlist.includes(email.toLowerCase())) {
    throw new Error('Not authorised')
  }
}

/**
 * Pull a `{ name, email }` shape for stamping the brochure's
 * `lastEditedBy` field. Called after `assertAdmin()` so we know the user
 * exists and is allowlisted; falls back gracefully if Clerk's name fields
 * are empty (some users only have an email).
 */
async function getEditor(): Promise<{ name?: string; email: string }> {
  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? ''
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ||
    user?.username ||
    undefined
  return { name, email }
}

export async function saveBrochureAction(
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
      | 'titleItalic'
      | 'titleTransform'
      | 'fontOverrides'
      | 'customColors'
      | 'navColor'
      | 'textureImage'
      | 'hideTexture'
      | 'logo'
    >
  >,
  expectedRev?: string
): Promise<SaveBrochureResult> {
  await assertAdmin()
  const editor = await getEditor()
  return saveBrochureMutation(id, updates, expectedRev, editor)
}

export async function setBrochureStatusAction(
  id: string,
  status: 'draft' | 'published' | 'unpublished' | 'archived',
  slug?: string
) {
  await assertAdmin()
  const result = await setBrochureStatusMutation(id, status)
  // Bust public-page cache on any status change
  if (slug) revalidatePath(`/${slug}`)
  revalidatePath('/')
  revalidatePath('/admin')
  return result
}

export async function setFeaturedBrochureAction(id: string) {
  await assertAdmin()
  const result = await setFeaturedBrochureMutation(id)
  revalidatePath('/')
  revalidatePath('/admin')
  return result
}

export async function createBrochureAction(input: {
  title: string
  slug: string
  season: string
  event?: string
  companyId?: string
}) {
  await assertAdmin()
  const result = await createBrochureMutation(input)
  revalidatePath('/admin')
  return result
}

export async function duplicateBrochureAction(
  id: string,
  overrides?: {
    title?: string
    slug?: string
    season?: string
    event?: string
    companyId?: string | null
  }
) {
  await assertAdmin()
  const result = await duplicateBrochureMutation(id, overrides)
  revalidatePath('/admin')
  return result
}

export async function deleteBrochureAction(id: string) {
  await assertAdmin()
  const result = await deleteBrochureMutation(id)
  revalidatePath('/admin', 'page')
  return result
}

// --- Media library ---

export type ImageAssetRow = {
  _id: string
  originalFilename: string | null
  url: string
  metadata: { dimensions: { width: number; height: number } }
  size: number
  _createdAt: string
}

export async function fetchImageAssetsAction(): Promise<ImageAssetRow[]> {
  await assertAdmin()
  const { sanityWriteClient } = await import('./client')
  const { ALL_IMAGE_ASSETS } = await import('./queries')
  return sanityWriteClient.fetch<ImageAssetRow[]>(ALL_IMAGE_ASSETS)
}

export async function deleteImageAssetAction(assetId: string) {
  await assertAdmin()
  const result = await deleteImageAssetMutation(assetId)
  revalidatePath('/admin/media', 'page')
  return result
}

/**
 * Update brochure-level settings (slug, season, event, SEO, lead capture).
 * On slug change, busts both the old and new public URL caches.
 */
export async function updateBrochureSettingsAction(
  id: string,
  updates: BrochureSettingsUpdate,
  previousSlug?: string
): Promise<{ ok: true; rev: string } | { ok: false; error: string }> {
  await assertAdmin()
  const result = await updateBrochureSettingsMutation(id, updates)
  if (result.ok) {
    if (previousSlug) revalidatePath(`/${previousSlug}`)
    if (updates.slug && updates.slug !== previousSlug) revalidatePath(`/${updates.slug}`)
    revalidatePath('/admin')
    revalidatePath('/')
  }
  return result
}

/**
 * Upload an image file to Sanity Storage. Called from FieldImage / FieldImageSlot.
 *
 * Returns either { ok: true, image } where `image` is a ready-to-store Sanity image ref,
 * or { ok: false, error } with a user-facing message.
 *
 * Enforces: admin allowlist · 20MB size cap · image/* MIME prefix.
 */
export type UploadImageResult =
  | { ok: true; image: SanityImage }
  | { ok: false; error: string }

const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20MB

export async function uploadImageAction(formData: FormData): Promise<UploadImageResult> {
  await assertAdmin()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'No file provided' }
  }
  if (!file.type.startsWith('image/')) {
    return { ok: false, error: 'File is not an image' }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `File too large (max ${MAX_IMAGE_BYTES / (1024 * 1024)}MB)` }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await uploadImageAsset(buffer, {
      filename: file.name,
      contentType: file.type,
    })
    return {
      ok: true,
      image: {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      },
    }
  } catch (err) {
    console.error('uploadImageAction failed:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

/**
 * Upload a video file to Sanity Storage. Called from FieldVideo.
 *
 * Returns either { ok: true, video } where `video` is a ready-to-store Sanity file ref,
 * or { ok: false, error } with a user-facing message.
 *
 * Enforces: admin allowlist · 50MB size cap · video/* MIME prefix.
 *
 * Note: Vercel serverless functions cap request body size at ~4.5MB in
 * production. For prod uploads beyond that, switch to direct browser-to-Sanity
 * upload or a dedicated video host (Mux). Compressed short MP4/WebM loops
 * usually fit comfortably under the cap.
 */
export type UploadVideoResult =
  | { ok: true; video: SanityFile }
  | { ok: false; error: string }

const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB

export async function uploadVideoAction(formData: FormData): Promise<UploadVideoResult> {
  await assertAdmin()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'No file provided' }
  }
  if (!file.type.startsWith('video/')) {
    return { ok: false, error: 'File is not a video' }
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: `File too large (max ${MAX_VIDEO_BYTES / (1024 * 1024)}MB)` }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await uploadFileAsset(buffer, {
      filename: file.name,
      contentType: file.type,
    })
    return {
      ok: true,
      video: {
        _type: 'file',
        asset: { _type: 'reference', _ref: asset._id },
      },
    }
  } catch (err) {
    console.error('uploadVideoAction failed:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

// ── Font upload ──────────────────────────────────────────────────────────

type UploadFileResult =
  | { ok: true; file: { _type: 'file'; asset: { _type: 'reference'; _ref: string } } }
  | { ok: false; error: string }

const MAX_FONT_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Upload a font file (.woff2) to Sanity Storage.
 * Returns a ready-to-store Sanity file reference.
 */
export async function uploadFileAction(formData: FormData): Promise<UploadFileResult> {
  await assertAdmin()

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { ok: false, error: 'No file provided' }
  }
  if (file.size > MAX_FONT_BYTES) {
    return { ok: false, error: `File too large (max ${MAX_FONT_BYTES / (1024 * 1024)}MB)` }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const asset = await uploadFileAsset(buffer, {
      filename: file.name,
      contentType: file.type || 'font/woff2',
    })
    return {
      ok: true,
      file: {
        _type: 'file',
        asset: { _type: 'reference', _ref: asset._id },
      },
    }
  } catch (err) {
    console.error('uploadFileAction failed:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Upload failed',
    }
  }
}

/**
 * Generate a brochure with Claude and persist it as a draft in Sanity.
 * Returns the new doc ID + slug + token-usage breakdown for telemetry.
 */
export async function generateBrochureAction(
  input: GenerateInput
): Promise<
  | { ok: true; id: string; slug: string; title: string; usage: GenerateUsage }
  | { ok: false; error: string }
> {
  await assertAdmin()
  const result = await generateBrochure(input)
  if (result.ok) revalidatePath('/admin')
  return result
}

/**
 * One-time seed: upload every image in /public/textures/images to Sanity
 * as a tagged library asset Claude can reference by filename.
 */
export async function seedLibraryImagesAction(): Promise<SeedResult> {
  await assertAdmin()
  return seedLibraryImages()
}

// ── Company actions ────────────────────────────────────────────────────

/**
 * Company create/update/delete actions also mirror the host on Vercel:
 * Sanity is the source of truth for the company list, and Vercel is mirrored
 * to match. If the Vercel call fails we still return `ok: true` (the Sanity
 * record exists) but include a `warning` so the UI can surface it.
 *
 * Drift only matters when serving traffic — a missing Vercel domain shows up
 * as a 404 on the subdomain. Re-saving the company retries the attachment.
 */

function normaliseHostInput(domain: string): string {
  return domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

export async function createCompanyAction(
  input: CompanyInput
): Promise<{ ok: true; id: string; warning?: string } | { ok: false; error: string }> {
  await assertAdmin()
  const result = await createCompanyMutation(input)
  if (!result.ok) return result

  invalidateHostMap()
  revalidatePath('/admin/companies')
  revalidatePath('/')

  const host = normaliseHostInput(input.domain)
  const vercel = await addDomain(host)
  const warning =
    vercel.ok || vercel.code === 'not_configured' ? undefined : `Vercel: ${vercel.error}`
  return { ok: true, id: result.id, warning }
}

export async function updateCompanyAction(
  id: string,
  input: CompanyInput
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  await assertAdmin()

  // Read existing host so we know whether to detach the old one from Vercel.
  const existing = await fetchCompanyForEdit(id)
  const previousHost = existing?.domain
  const nextHost = normaliseHostInput(input.domain)

  const result = await updateCompanyMutation(id, input)
  if (!result.ok) return result

  invalidateHostMap()
  revalidatePath('/admin/companies')
  revalidatePath('/')

  let warning: string | undefined
  if (previousHost && previousHost !== nextHost) {
    const removed = await removeDomain(previousHost)
    if (!removed.ok && removed.code !== 'not_configured') {
      warning = `Vercel: failed to detach old domain ${previousHost}: ${removed.error}`
    }
  }
  if (!previousHost || previousHost !== nextHost) {
    const added = await addDomain(nextHost)
    if (!added.ok && added.code !== 'not_configured') {
      warning = warning
        ? `${warning}; failed to attach ${nextHost}: ${added.error}`
        : `Vercel: ${added.error}`
    }
  }
  return { ok: true, warning }
}

export async function deleteCompanyAction(
  id: string
): Promise<{ ok: true; warning?: string } | { ok: false; error: string }> {
  await assertAdmin()

  const existing = await fetchCompanyForEdit(id)
  const host = existing?.domain

  const result = await deleteCompanyMutation(id)
  if (!result.ok) return result

  invalidateHostMap()
  revalidatePath('/admin/companies')

  let warning: string | undefined
  if (host) {
    const removed = await removeDomain(host)
    if (!removed.ok && removed.code !== 'not_configured') {
      warning = `Vercel: failed to detach ${host}: ${removed.error}`
    }
  }
  return { ok: true, warning }
}

/**
 * Fetch DNS verification status for a company host. Used by CompanyEditModal
 * to render the verified / pending / misconfigured / not-attached indicator
 * and CNAME hints.
 */
export async function getDomainStatusAction(
  host: string
): Promise<
  | { ok: true; configured: true; status: DomainConfig }
  | { ok: true; configured: false }
  | { ok: true; notAttached: true }
  | { ok: false; error: string }
> {
  await assertAdmin()
  const result = await getDomainConfig(host)
  if (!result.ok) {
    if (result.code === 'not_configured') return { ok: true, configured: false }
    if (result.code === 'not_attached') return { ok: true, notAttached: true }
    return { ok: false, error: result.error }
  }
  return { ok: true, configured: true, status: result.data }
}

/**
 * Attach a domain to the Vercel project on demand. Used as a recovery action
 * when the company was created without Vercel env vars set.
 */
export async function attachDomainAction(
  host: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdmin()
  const result = await addDomain(host)
  if (!result.ok) return { ok: false, error: result.error }
  return { ok: true }
}

/**
 * Generate a signed preview URL for sharing a draft/unpublished brochure.
 * Looks up the current slug from Sanity (so stale UI state can't spoof it)
 * and signs a JWT scoped to that slug with a 7-day expiry.
 */
export async function generatePreviewLinkAction(
  brochureId: string
): Promise<{ ok: true; url: string; expiresInDays: number } | { ok: false; error: string }> {
  await assertAdmin()
  try {
    const brochure = await fetchBrochureForEdit(brochureId)
    if (!brochure) return { ok: false, error: 'Brochure not found' }
    const slug = brochure.slug?.current
    if (!slug) return { ok: false, error: 'Brochure has no slug' }
    const token = await signPreviewToken(slug)
    return {
      ok: true,
      url: `/${slug}?preview=${encodeURIComponent(token)}`,
      expiresInDays: 7,
    }
  } catch (err) {
    console.error('generatePreviewLinkAction failed:', err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Could not generate link',
    }
  }
}
