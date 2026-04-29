'use server'

import { revalidatePath } from 'next/cache'
import { currentUser } from '@clerk/nextjs/server'
import {
  saveBrochure as saveBrochureMutation,
  setBrochureStatus as setBrochureStatusMutation,
  setFeaturedBrochure as setFeaturedBrochureMutation,
  createBrochure as createBrochureMutation,
  duplicateBrochure as duplicateBrochureMutation,
  deleteBrochure as deleteBrochureMutation,
  updateBrochureSettings as updateBrochureSettingsMutation,
  uploadImageAsset,
  uploadFileAsset,
  fetchBrochureForEdit,
  type BrochureSettingsUpdate,
} from './mutations'
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
      | 'fontOverrides'
      | 'customColors'
      | 'navColor'
      | 'textureImage'
      | 'hideTexture'
      | 'logo'
    >
  >
) {
  await assertAdmin()
  return saveBrochureMutation(id, updates)
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
}) {
  await assertAdmin()
  const result = await createBrochureMutation(input)
  revalidatePath('/admin')
  return result
}

export async function duplicateBrochureAction(
  id: string,
  overrides?: { title?: string; slug?: string; season?: string; event?: string }
) {
  await assertAdmin()
  const result = await duplicateBrochureMutation(id, overrides)
  revalidatePath('/admin')
  return result
}

export async function deleteBrochureAction(id: string) {
  await assertAdmin()
  const result = await deleteBrochureMutation(id)
  revalidatePath('/admin')
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
): Promise<{ ok: true } | { ok: false; error: string }> {
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
