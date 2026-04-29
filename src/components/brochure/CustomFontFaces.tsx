import type { CustomFont } from '@/types/brochure'
import { customFontFaceCss } from '@/lib/fontPalette'

/**
 * Injects @font-face rules for any custom uploaded fonts.
 * React 19 auto-hoists <style> into <head>.
 */
export function CustomFontFaces({ customFonts }: { customFonts?: CustomFont[] | null }) {
  const css = customFontFaceCss(customFonts)
  if (!css) return null
  return <style>{css}</style>
}
