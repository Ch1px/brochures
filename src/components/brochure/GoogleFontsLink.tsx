/**
 * Renders a Google Fonts CSS <link> for custom font overrides.
 * React 19 auto-hoists <link> elements to <head>.
 */
export function GoogleFontsLink({ url }: { url: string | null }) {
  if (!url) return null
  return <link rel="stylesheet" href={url} />
}
