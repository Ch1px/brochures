'use client'

import { useEffect, useRef } from 'react'
import type { AnnotationKind, Brochure } from '@/types/brochure'
import { SectionRenderer } from '../brochure/SectionRenderer'
import { BrochureBrandingProvider } from '../brochure/BrochureContext'
import { GoogleFontsLink } from '../brochure/GoogleFontsLink'
import { TextureOverride } from '../brochure/TextureOverride'
import { CustomFontFaces } from '../brochure/CustomFontFaces'
import { accentColorVars } from '@/lib/accentColor'
import { backgroundColorVars, textColorVars, navColorVars } from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'
import { textScaleVars } from '@/lib/textScale'

type Props = {
  brochure: Brochure
  currentPageIndex: number
  currentSectionKey: string | null
  setCurrentSectionKey: (key: string | null) => void
  recolor?: {
    active: boolean
    targetSectionKey: string | null
    selectedIds: string[]
    onElementClick: (
      sectionKey: string,
      elementId: string,
      x: number,
      y: number,
      multi: boolean,
    ) => void
  }
  annotations?: {
    selectedKey: string | null
    onSelect: (key: string | null) => void
    onMove: (sectionKey: string, annotationKey: string, x: number, y: number) => void
    onTransform: (sectionKey: string, annotationKey: string, update: { rotation?: number; scale?: number }) => void
    onUpdate: (sectionKey: string, annotationKey: string, update: Record<string, unknown>) => void
    pendingKind: AnnotationKind | null
    onPlaceNew: (sectionKey: string, x: number, y: number) => void
    onAddAnnotation: (sectionKey: string, annotation: import('@/types/brochure').Annotation) => void
  }
  onInlineEdit?: (sectionKey: string, fieldPath: string, value: string) => void
  onInlineMediaEdit?: (sectionKey: string, fieldPath: string, value: unknown) => void
  onRequestMapEdit?: () => void
}

/**
 * Preview stage — centre panel of the editor.
 *
 * Renders the current page inside a 16:10 frame, using the exact same
 * Section components as the public reader. Clicking anywhere on a section
 * selects it for editing in the right panel.
 *
 * The frame uses `container-type: size` so the brochure CSS's `cqi`/`cqh`
 * units scale relative to the frame, not the viewport — same design tokens,
 * smaller canvas. When a page has multiple sections stacked vertically, the
 * frame scrolls.
 */
export function PreviewStage({
  brochure,
  currentPageIndex,
  currentSectionKey,
  setCurrentSectionKey,
  recolor,
  annotations: annotationsProp,
  onInlineEdit,
  onInlineMediaEdit,
  onRequestMapEdit,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const page = brochure.pages[currentPageIndex]
  const total = brochure.pages.length

  // Scroll the selected section into view when the selection changes
  // (e.g. user clicks a section in the left panel)
  useEffect(() => {
    if (!currentSectionKey) return
    const el = frameRef.current?.querySelector<HTMLElement>(
      `[data-section-key="${currentSectionKey}"]`
    )
    if (el) {
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      } catch {
        // Older browsers without smooth support
        el.scrollIntoView()
      }
    }
  }, [currentSectionKey])

  // ───────── Empty states ─────────

  if (brochure.pages.length === 0) {
    return <EmptyState title="Empty brochure" hint="Use “+ Add page” in the left panel to get started." />
  }
  if (!page) {
    return <EmptyState title="Page not found" hint={`currentPageIndex = ${currentPageIndex}`} />
  }
  if (page.sections.length === 0) {
    return (
      <EmptyState
        title={`${page.name} · empty page`}
        hint="Use “+ Add section” in the left panel to add content."
      />
    )
  }

  // ───────── Normal render ─────────

  const theme = brochure.theme ?? 'dark'
  const accentStyle = accentColorVars(brochure.accentColor)
  const bgStyle = backgroundColorVars(brochure.backgroundColor)
  const textStyle = textColorVars(brochure.textColor)
  const fontStyle = fontOverrideVars(brochure.fontOverrides, brochure.customFonts)
  const navStyle = navColorVars(brochure.navColor)
  const scaleStyle = textScaleVars(brochure)
  const fontsUrl = googleFontsUrl(brochure.fontOverrides)

  return (
    <BrochureBrandingProvider value={{ accentColor: brochure.accentColor, backgroundColor: brochure.backgroundColor, textColor: brochure.textColor, fontOverrides: brochure.fontOverrides, customColors: brochure.customColors, logo: brochure.logo, theme, editorMode: true, onInlineEdit, onInlineMediaEdit, onRequestMapEdit, recolor, annotations: annotationsProp }}>
    <GoogleFontsLink url={fontsUrl} />
    <CustomFontFaces customFonts={brochure.customFonts} />
    <TextureOverride hideTexture={brochure.hideTexture} textureImage={brochure.textureImage} />
    <div className="preview-stage-wrap">
      <div className="preview-stage-label">
        <span className="preview-stage-label-num">
          {String(currentPageIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
        <span className="preview-stage-label-name">{page.name}</span>
      </div>
      <div
        className="preview-stage-frame"
        data-theme={theme}
        style={{ ...accentStyle, ...bgStyle, ...textStyle, ...fontStyle, ...navStyle, ...scaleStyle }}
        ref={frameRef}
      >
        <div className="brochure-page" style={{ width: '100%' }}>
          {page.sections.map((section) => {
            const isSelected = currentSectionKey === section._key
            const isFooter = section._type === 'footer'
            return (
              <div
                key={section._key}
                className={`preview-section-hitbox ${isSelected ? 'selected' : ''}`.trim()}
                data-section-key={section._key}
                onClick={() => setCurrentSectionKey(section._key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  // Don't intercept when typing in a contentEditable element
                  if ((e.target as HTMLElement)?.isContentEditable) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setCurrentSectionKey(section._key)
                  }
                }}
              >
                <SectionRenderer
                  section={section}
                  pageNum={currentPageIndex + 1}
                  total={total}
                  showFolio={
                    !isFooter &&
                    currentPageIndex > 0 &&
                    !page.sections.some((s) => s._type === 'footer')
                  }
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
    </BrochureBrandingProvider>
  )
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="preview-stage-empty">
      <div className="preview-stage-empty-icon">00</div>
      <div className="preview-stage-empty-title">{title}</div>
      <div className="preview-stage-empty-hint">{hint}</div>
    </div>
  )
}
