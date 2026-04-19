import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'
import { sanityClient } from './client'

const builder = imageUrlBuilder(sanityClient)

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
