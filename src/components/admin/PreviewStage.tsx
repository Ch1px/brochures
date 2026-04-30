'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { AnnotationKind, Brochure } from '@/types/brochure'
import { SectionRenderer } from '../brochure/SectionRenderer'
import { BrochureBrandingProvider } from '../brochure/BrochureContext'
import { GoogleFontsLink } from '../brochure/GoogleFontsLink'
import { TextureOverride } from '../brochure/TextureOverride'
import { CustomFontFaces } from '../brochure/CustomFontFaces'
import { accentColorVars } from '@/lib/accentColor'
import { backgroundColorVars, textColorVars, titleColorVars, eyebrowStyleVars, navColorVars } from '@/lib/themeColorVars'
import { fontOverrideVars, googleFontsUrl } from '@/lib/fontPalette'
import { textScaleVars } from '@/lib/textScale'
import { resolvedAccentColor, resolvedLogo } from '@/lib/brochureBranding'
import { PREVIEW_DEVICE_WIDTHS, type PreviewDevice } from '@/hooks/useEditorLayout'

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
    onSetPendingKind: (kind: AnnotationKind | null) => void
    onPlaceNew: (sectionKey: string, x: number, y: number) => void
    onAddAnnotation: (sectionKey: string, annotation: import('@/types/brochure').Annotation) => void
    onAddDrawing: (sectionKey: string, drawing: import('@/types/brochure').CircuitDrawing) => void
    selectedDrawingKey: string | null
    onSelectDrawing: (key: string | null) => void
    onUpdateDrawing: (sectionKey: string, drawingKey: string, update: Partial<import('@/types/brochure').CircuitDrawing>) => void
    onDeleteDrawing: (sectionKey: string, drawingKey: string) => void
    drawTool: 'freehand' | 'line'
    drawStyle: 'solid' | 'dashed' | 'dotted'
    onSetDrawTool: (tool: 'freehand' | 'line') => void
    onSetDrawStyle: (style: 'solid' | 'dashed' | 'dotted') => void
  }
  onInlineEdit?: (sectionKey: string, fieldPath: string, value: string) => void
  onInlineMediaEdit?: (sectionKey: string, fieldPath: string, value: unknown) => void
  onRequestMapEdit?: () => void
  previewDevice: PreviewDevice
  previewWidth: number
  onPreviewDeviceChange: (device: PreviewDevice) => void
  onPreviewWidthChange: (width: number) => void
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
  previewDevice,
  previewWidth,
  onPreviewDeviceChange,
  onPreviewWidthChange,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const page = brochure.pages[currentPageIndex]
  const total = brochure.pages.length

  // Width applied to the frame positioner. For preset devices we use the
  // canonical width; for 'custom' the user has dragged the grip to a value.
  const effectiveFrameWidth =
    previewDevice === 'custom' ? previewWidth : PREVIEW_DEVICE_WIDTHS[previewDevice]

  const handleGripDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      const startX = e.clientX
      const startWidth = effectiveFrameWidth
      const onMove = (ev: MouseEvent) => {
        // Symmetric resize: dragging the right edge by N expands the
        // centred frame by 2N (both edges move out by N).
        const delta = ev.clientX - startX
        onPreviewWidthChange(startWidth + delta * 2)
      }
      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'
    },
    [effectiveFrameWidth, onPreviewWidthChange]
  )

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
  // Effective branding falls back to the host company's defaults when the
  // brochure-level field is unset. See `lib/brochureBranding.ts`.
  const effectiveAccent = resolvedAccentColor(brochure)
  const effectiveLogo = resolvedLogo(brochure)
  const accentStyle = accentColorVars(effectiveAccent)
  const bgStyle = backgroundColorVars(brochure.backgroundColor)
  const textStyle = textColorVars(brochure.textColor)
  const titleStyle = titleColorVars(brochure.titleColor)
  const eyebrowStyle = eyebrowStyleVars(brochure.eyebrowItalic, brochure.eyebrowTransform)
  const fontStyle = fontOverrideVars(brochure.fontOverrides, brochure.customFonts)
  const navStyle = navColorVars(brochure.navColor)
  const scaleStyle = textScaleVars(brochure)
  const fontsUrl = googleFontsUrl(brochure.fontOverrides)

  return (
    <BrochureBrandingProvider value={{ accentColor: effectiveAccent, backgroundColor: brochure.backgroundColor, textColor: brochure.textColor, titleColor: brochure.titleColor, fontOverrides: brochure.fontOverrides, customColors: brochure.customColors, logo: effectiveLogo, theme, editorMode: true, onInlineEdit, onInlineMediaEdit, onRequestMapEdit, recolor, annotations: annotationsProp }}>
    <GoogleFontsLink url={fontsUrl} />
    <CustomFontFaces customFonts={brochure.customFonts} />
    <TextureOverride hideTexture={brochure.hideTexture} textureImage={brochure.textureImage} />
    <div className="preview-stage-wrap">
      <div className="preview-stage-toolbar">
        <div className="preview-stage-label">
          <span className="preview-stage-label-num">
            {String(currentPageIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </span>
          <span className="preview-stage-label-name">{page.name}</span>
        </div>
        <PreviewDeviceToggle
          device={previewDevice}
          width={effectiveFrameWidth}
          onChange={onPreviewDeviceChange}
        />
      </div>
      <div className="preview-stage-frame-area">
        <div
          className="preview-stage-frame-positioner"
          style={{ maxWidth: `${effectiveFrameWidth}px` }}
        >
          <div
            className="preview-stage-frame"
            data-theme={theme}
            data-custom-bg={brochure.backgroundColor ? '' : undefined}
            style={{ ...accentStyle, ...bgStyle, ...textStyle, ...titleStyle, ...eyebrowStyle, ...fontStyle, ...navStyle, ...scaleStyle }}
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
          <div
            className="preview-stage-resize-grip"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview frame"
            onMouseDown={handleGripDown}
            title={`${Math.round(effectiveFrameWidth)}px`}
          />
        </div>
      </div>
    </div>
    </BrochureBrandingProvider>
  )
}

type DeviceToggleProps = {
  device: PreviewDevice
  width: number
  onChange: (device: PreviewDevice) => void
}

function PreviewDeviceToggle({ device, width, onChange }: DeviceToggleProps) {
  const presets: { id: PreviewDevice; label: string; icon: React.ReactNode }[] = [
    {
      id: 'desktop',
      label: 'Desktop',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="1.5" y="2.5" width="13" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 14h6M8 12v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'tablet',
      label: 'Tablet',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="3" y="1.5" width="10" height="13" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="12.5" r="0.6" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'mobile',
      label: 'Mobile',
      icon: (
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden>
          <rect x="4.5" y="1.5" width="7" height="13" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="8" cy="12.5" r="0.5" fill="currentColor" />
        </svg>
      ),
    },
  ]
  return (
    <div className="preview-device-toggle" role="group" aria-label="Preview device">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`preview-device-toggle-btn${device === p.id ? ' active' : ''}`}
          onClick={() => onChange(p.id)}
          title={p.label}
          aria-pressed={device === p.id}
          aria-label={p.label}
        >
          {p.icon}
        </button>
      ))}
      <span
        className={`preview-device-width${device === 'custom' ? ' active' : ''}`}
        title={device === 'custom' ? 'Custom width — drag the grip to resize' : `${Math.round(width)}px`}
      >
        {Math.round(width)}px
      </span>
    </div>
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
