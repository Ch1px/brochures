import type { SanityImage } from '@/types/brochure'

/**
 * Builds a CSS string that overrides the default halftone background texture
 * across all textured sections. Injected as a `<style>` block at the
 * brochure root.
 *
 * - `hideTexture: true` → removes the texture (background-image: none)
 * - `textureImage` set → replaces the halftone with a custom Sanity image
 * - Neither → returns null (no override, CSS default halftone applies)
 */
export function textureOverrideCss(
  hideTexture?: boolean,
  textureImage?: SanityImage,
  imageUrlFn?: (img: SanityImage, width?: number) => string | undefined,
): string | null {
  // The selectors that carry the halftone texture in globals.css.
  const selectors = [
    '.page-intro',
    '.page-features',
    '.page-stats',
    '.page-packages',
    '.page-itinerary',
    '.page-gallery',
    '.page-gallery-grid',
    '.page-gallery-duo',
    '.page-gallery-hero',
    '.page-quote-profile',
    '.page-circuit-map',
    '.page-text-center',
    '.page-logos',
  ]

  if (hideTexture) {
    const selector = selectors.join(',\n')
    return `${selector} { background-image: none !important; }`
  }

  if (textureImage && imageUrlFn) {
    const url = imageUrlFn(textureImage, 1600)
    if (url) {
      const light = selectors.join(',\n')
      const dark = selectors.map((s) => `[data-theme="dark"] ${s}`).join(',\n')
      return [
        `${light} {`,
        `  background-image: url(${url}) !important;`,
        `  background-size: 800px auto;`,
        `  background-position: top left;`,
        `  background-repeat: repeat;`,
        `}`,
        `${dark} {`,
        `  background-image:`,
        `    linear-gradient(rgba(11, 11, 13, 0.88), rgba(11, 11, 13, 0.88)),`,
        `    url(${url}) !important;`,
        `  background-size: auto, 600px auto;`,
        `  background-repeat: repeat, repeat;`,
        `  background-position: 0 0, top left;`,
        `}`,
      ].join('\n')
    }
  }

  return null
}
