type Props = {
  eyebrow?: string
  title?: string
}

/**
 * Shared gallery header — ported from the builder's renderGalleryHeader().
 * Used by GalleryGrid, GalleryDuo, GalleryHero (not by GalleryEditorial,
 * which uses its own .gallery-title class).
 *
 * Returns null if both fields are empty — matches the builder's early-return behaviour.
 */
export function GalleryHeader({ eyebrow, title }: Props) {
  if (!eyebrow && !title) return null
  return (
    <div className="gallery-variant-header">
      {eyebrow ? <div className="gallery-variant-eyebrow">{eyebrow}</div> : null}
      {title ? <h2 className="gallery-variant-title">{title}</h2> : null}
    </div>
  )
}
