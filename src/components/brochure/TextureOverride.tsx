import type { SanityImage } from '@/types/brochure'
import { urlForSection } from '@/lib/sanity/image'
import { textureOverrideCss } from '@/lib/textureOverride'

type Props = {
  hideTexture?: boolean
  textureImage?: SanityImage
}

/**
 * Injects a <style> block that overrides the default halftone background
 * texture across all textured sections. Rendered at the brochure root.
 */
export function TextureOverride({ hideTexture, textureImage }: Props) {
  const css = textureOverrideCss(hideTexture, textureImage, urlForSection)
  if (!css) return null
  return <style>{css}</style>
}
