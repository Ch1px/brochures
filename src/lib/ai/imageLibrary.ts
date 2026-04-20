import 'server-only'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { sanityWriteClient } from '../sanity/client'

/**
 * Brochure image library backed by Sanity assets tagged with label
 * "brochure-library". Two surfaces:
 *
 *   seedLibraryImages() — one-time upload of /public/textures/images/*
 *   listLibraryImages() — hand to Claude so it can pick filenames
 *   resolveLibraryImage(filename) — map a filename → Sanity image ref
 *
 * Each seeded asset carries:
 *   label: "brochure-library"          (for querying back)
 *   title: filename                    (stable lookup key)
 *   description: curated mood/subject  (what Claude sees)
 */

const LIBRARY_LABEL = 'brochure-library'
const LIBRARY_DIR = path.join(process.cwd(), 'public', 'textures', 'images')

/**
 * Hand-curated metadata for known library filenames. Falls back to a generic
 * description if we add an image we haven't curated yet. Good descriptions
 * = good AI image picks.
 */
const CURATED: Record<string, { description: string; orientation: 'landscape' | 'portrait' | 'square' }> = {
  '67b4b180b98a1ea3baa8d705_EvgeniySafronov_F1Baku2023-43-min-e1741343027875.webp': {
    description: 'F1 car at speed on a street circuit, motion blur, race action',
    orientation: 'landscape',
  },
  'auhrz-pool-garden-4587_Classic-Hor.avif': {
    description: 'Hotel pool and garden at dusk, luxury resort atmosphere, calm',
    orientation: 'landscape',
  },
  'Australia-_Melbourne_-F1-Tickets_ProductImage.webp': {
    description: 'Melbourne Grand Prix atmosphere — Australian GP imagery',
    orientation: 'landscape',
  },
  'British-GP-_Silverstone_-F1-Tickets_ProductImage.webp': {
    description: 'Silverstone circuit — British Grand Prix, grandstand and track',
    orientation: 'landscape',
  },
  'Grandstand-B-monaco-view-1200x900.webp': {
    description: 'Monaco grandstand view over Monte Carlo harbour, yachts and cars',
    orientation: 'landscape',
  },
  'H10-MARINA-BARCELONA-Lobby.webp': {
    description: 'Modern hotel lobby — Barcelona, marina, architectural interior',
    orientation: 'landscape',
  },
  'Italy-Mugello-MotoGP-Sales-Closed.webp': {
    description: 'Mugello circuit, Italy — MotoGP paddock and Tuscan hills',
    orientation: 'landscape',
  },
  'shutterstock_2466215149.jpg': {
    description: 'Cinematic motorsport / lifestyle imagery, editorial mood',
    orientation: 'landscape',
  },
  'shutterstock_2466982667.jpg': {
    description: 'Cinematic motorsport / lifestyle imagery, editorial mood',
    orientation: 'landscape',
  },
}

function describe(filename: string): { description: string; orientation: string } {
  return CURATED[filename] ?? { description: 'Editorial image — see filename for hint', orientation: 'landscape' }
}

export type LibraryImage = {
  _id: string
  filename: string
  description: string
  orientation: string
}

/** Query Sanity for all library-tagged image assets. */
export async function listLibraryImages(): Promise<LibraryImage[]> {
  const assets = await sanityWriteClient.fetch<
    Array<{ _id: string; title?: string; originalFilename?: string; description?: string }>
  >(
    `*[_type == "sanity.imageAsset" && label == $label]{ _id, title, originalFilename, description } | order(title asc)`,
    { label: LIBRARY_LABEL }
  )
  return assets.map((a) => {
    const filename = a.title ?? a.originalFilename ?? a._id
    const fallback = describe(filename)
    return {
      _id: a._id,
      filename,
      description: a.description ?? fallback.description,
      orientation: fallback.orientation,
    }
  })
}

/** Resolve a filename from Claude's output back to a Sanity image ref, or null if missing. */
export async function resolveLibraryImage(
  filename: string,
  cached?: LibraryImage[]
): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } } | null> {
  const list = cached ?? (await listLibraryImages())
  const match = list.find((img) => img.filename === filename)
  if (!match) return null
  return { _type: 'image', asset: { _type: 'reference', _ref: match._id } }
}

/** Filter filenames from Claude output down to valid library refs. */
export async function resolveLibraryImages(
  filenames: string[],
  cached?: LibraryImage[]
): Promise<Array<{ _type: 'image'; asset: { _type: 'reference'; _ref: string } }>> {
  const list = cached ?? (await listLibraryImages())
  return filenames
    .map((fn) => {
      const match = list.find((img) => img.filename === fn)
      return match
        ? ({ _type: 'image' as const, asset: { _type: 'reference' as const, _ref: match._id } })
        : null
    })
    .filter((x): x is { _type: 'image'; asset: { _type: 'reference'; _ref: string } } => x !== null)
}

const IMAGE_EXTS = new Set(['.webp', '.avif', '.jpg', '.jpeg', '.png'])
const CONTENT_TYPE: Record<string, string> = {
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
}

export type SeedResult = {
  uploaded: Array<{ filename: string; assetId: string }>
  skipped: Array<{ filename: string; reason: string }>
  alreadyPresent: string[]
  error?: string
}

/**
 * Upload every image in /public/textures/images to Sanity as a library asset.
 * Safe to run repeatedly — existing library entries (matched by filename
 * stored in `title`) are skipped.
 */
export async function seedLibraryImages(): Promise<SeedResult> {
  const existing = await listLibraryImages()
  const existingByFilename = new Set(existing.map((i) => i.filename))

  let entries: string[]
  try {
    entries = await readdir(LIBRARY_DIR)
  } catch (err) {
    return {
      uploaded: [],
      skipped: [],
      alreadyPresent: [],
      error: err instanceof Error ? err.message : 'Could not read library directory',
    }
  }

  const result: SeedResult = {
    uploaded: [],
    skipped: [],
    alreadyPresent: [...existingByFilename],
  }

  for (const entry of entries) {
    const ext = path.extname(entry).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) {
      result.skipped.push({ filename: entry, reason: `Unsupported extension ${ext}` })
      continue
    }
    if (existingByFilename.has(entry)) continue

    const fullPath = path.join(LIBRARY_DIR, entry)
    try {
      const s = await stat(fullPath)
      if (!s.isFile()) continue
      const buf = await readFile(fullPath)
      const meta = describe(entry)
      const asset = await sanityWriteClient.assets.upload('image', buf, {
        filename: entry,
        contentType: CONTENT_TYPE[ext] ?? 'application/octet-stream',
        title: entry,
        description: meta.description,
        label: LIBRARY_LABEL,
      })
      result.uploaded.push({ filename: entry, assetId: asset._id })
    } catch (err) {
      result.skipped.push({
        filename: entry,
        reason: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }

  return result
}
