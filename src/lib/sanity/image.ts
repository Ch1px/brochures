import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { sanityClient } from './client'
import type { SanityFile } from '@/types/brochure'

const builder = imageUrlBuilder(sanityClient)
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

/**
 * Resolve a Sanity image ref to a CDN URL.
 * Supports chained transformations: urlFor(image).width(1200).height(630).url()
 */
export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

/**
 * Shortcut: get a reasonably-sized URL for a section image.
 * Uses the image's hotspot for intelligent cropping.
 */
export function urlForSection(source: SanityImageSource | undefined, width = 1600) {
  if (!source) return undefined
  return urlFor(source).width(width).auto('format').url()
}

/**
 * Resolve a Sanity file asset ref (e.g. an uploaded video) to a CDN URL.
 * Sanity file refs look like `file-{id}-{format}`; the CDN URL is
 * https://cdn.sanity.io/files/{projectId}/{dataset}/{id}.{format}
 */
export function urlForFile(file: SanityFile | undefined): string | undefined {
  if (!file?.asset?._ref) return undefined
  const match = file.asset._ref.match(/^file-([a-zA-Z0-9]+)-([a-zA-Z0-9]+)$/)
  if (!match) return undefined
  const [, id, format] = match
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${format}`
}
