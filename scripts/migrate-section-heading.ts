/* eslint-disable no-console */
/**
 * One-shot migration: collapse `sectionHeadingCentered` into `sectionHeading`.
 *
 *   - Every section with `_type: 'sectionHeadingCentered'` is rewritten to
 *     `_type: 'sectionHeading'` (no `contentAlign` set — centered is the
 *     new default).
 *   - Every pre-existing `_type: 'sectionHeading'` that lacks `contentAlign`
 *     is backfilled with `contentAlign: 'left'` so its visual layout
 *     does NOT shift when the default flips to centered.
 *
 * Run with:
 *   npx sanity exec scripts/migrate-section-heading.ts --with-user-token
 *
 * (or via tsx with SANITY_API_WRITE_TOKEN set in env).
 */

import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  process.exit(1)
}
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-10-01',
  token,
  useCdn: false,
})

type SectionLike = { _type?: string; contentAlign?: string }
type PageLike = { sections?: SectionLike[] }
type BrochureDoc = { _id: string; _rev: string; pages?: PageLike[] }

async function main() {
  const docs: BrochureDoc[] = await client.fetch(
    `*[_type == "brochure"]{ _id, _rev, pages }`,
  )
  console.log(`Scanning ${docs.length} brochure(s)…`)

  let touchedDocs = 0
  let renamedSections = 0
  let backfilledSections = 0

  for (const doc of docs) {
    if (!doc.pages?.length) continue

    let changed = false
    const newPages = doc.pages.map((page) => {
      if (!page.sections?.length) return page
      const newSections = page.sections.map((section) => {
        if (section._type === 'sectionHeadingCentered') {
          changed = true
          renamedSections += 1
          const { _type: _drop, ...rest } = section
          return { ...rest, _type: 'sectionHeading' }
        }
        if (
          section._type === 'sectionHeading' &&
          (section.contentAlign === undefined || section.contentAlign === '')
        ) {
          changed = true
          backfilledSections += 1
          return { ...section, contentAlign: 'left' }
        }
        return section
      })
      return { ...page, sections: newSections }
    })

    if (!changed) continue
    touchedDocs += 1

    await client
      .patch(doc._id)
      .set({ pages: newPages })
      .ifRevisionId(doc._rev)
      .commit()
    console.log(`✓ patched ${doc._id}`)
  }

  console.log(
    `Done. Touched ${touchedDocs} doc(s); renamed ${renamedSections} centered → standard; backfilled contentAlign=left on ${backfilledSections} pre-existing sectionHeading section(s).`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
