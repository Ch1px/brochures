import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const apiVersion = '2024-10-01'

/**
 * Public read-only client — used for fetching published brochures on public routes.
 * Reads from the Sanity CDN for speed + caching.
 */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
})

/**
 * Write-enabled client — used server-side only by the builder (admin routes).
 * Uses the write token; never expose on the client.
 * Also reads draft documents (perspective: 'previewDrafts') so the builder
 * sees unpublished changes.
 */
export const sanityWriteClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'previewDrafts',
  token: process.env.SANITY_API_WRITE_TOKEN,
})
