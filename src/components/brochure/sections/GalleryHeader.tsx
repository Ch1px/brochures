import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding, useEyebrowNormaliser, useTitleNormaliser } from '../BrochureContext'

type Props = {
  eyebrow?: string
  title?: string
  sectionKey?: string
}

/**
 * Shared gallery header — ported from the builder's renderGalleryHeader().
 * Used by GalleryGrid, GalleryDuo, GalleryHero (not by GalleryEditorial,
 * which uses its own .gallery-title class).
 *
 * Returns null if both fields are empty — matches the builder's early-return behaviour.
 */
export function GalleryHeader({ eyebrow, title, sectionKey }: Props) {
  const { editorMode } = useBrochureBranding()
  const titleN = useTitleNormaliser()
  const eyebrowN = useEyebrowNormaliser()
  if (!eyebrow && !title && !editorMode) return null
  const e = eyebrowN(eyebrow)
  const t = titleN(title)
  return (
    <div className="gallery-variant-header">
      {(eyebrow || editorMode) && sectionKey ? <InlineEditable sectionKey={sectionKey} field="eyebrow"><div className="gallery-variant-eyebrow">{e}</div></InlineEditable> : eyebrow ? <div className="gallery-variant-eyebrow">{e}</div> : null}
      {(title || editorMode) && sectionKey ? <InlineEditable sectionKey={sectionKey} field="title"><h2 className="gallery-variant-title">{t}</h2></InlineEditable> : title ? <h2 className="gallery-variant-title">{t}</h2> : null}
    </div>
  )
}
