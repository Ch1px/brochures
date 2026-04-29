import { sanityWriteClient } from '@/lib/sanity/client'
import { ALL_IMAGE_ASSETS } from '@/lib/sanity/queries'
import { MediaLibraryClient } from '@/components/admin/MediaLibraryClient'
import type { ImageAssetRow } from '@/lib/sanity/actions'

export const dynamic = 'force-dynamic'

export default async function MediaPage() {
  const assets = await sanityWriteClient.fetch<ImageAssetRow[]>(ALL_IMAGE_ASSETS)

  return (
    <main className="library-page">
      <MediaLibraryClient assets={assets} />
    </main>
  )
}
