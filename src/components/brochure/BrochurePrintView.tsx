'use client'

import { useEffect } from 'react'
import type { Brochure } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'
import { BrochureBrandingProvider } from './BrochureContext'
import { accentColorVars } from '@/lib/accentColor'

type Props = {
  brochure: Brochure
}

/**
 * Print-optimised view used by /[slug]/print and the Puppeteer PDF pipeline.
 * Each section becomes its own A4-landscape page (297mm × 210mm), so the PDF
 * is naturally paginated by Chromium via `@page { size: A4 landscape }`.
 * Container queries resolve to the printed sheet width, matching the desktop
 * reader. No nav, no animations, no client-side wiring.
 */
export function BrochurePrintView({ brochure }: Props) {
  const pages = brochure.pages ?? []
  const sections = pages.flatMap((p) => p.sections ?? []).filter((s) => s._type !== 'footer')
  const total = sections.length
  const theme = brochure.theme ?? 'dark'
  const accentStyle = accentColorVars(brochure.accentColor)

  useFitSectionsToPages()

  return (
    <BrochureBrandingProvider value={{ accentColor: brochure.accentColor, logo: brochure.logo, theme }}>
      <div className="brochure-print-root" data-theme={theme} style={accentStyle}>
        {sections.map((section, i) => {
          const pageNum = i + 1
          const showFolio = i > 0
          return (
            <div key={section._key} className="brochure-print-page">
              <SectionRenderer
                section={section}
                pageNum={pageNum}
                total={total}
                showFolio={showFolio}
              />
            </div>
          )
        })}
      </div>
    </BrochureBrandingProvider>
  )
}

/**
 * After fonts and images load, measure each section against its A4 page and
 * apply a uniform `transform: scale(...)` if it overflows. CSS alone can't
 * "fit-to-container", so we measure once on the client. Puppeteer waits on
 * `window.__brochurePrintReady` before snapshotting the PDF.
 */
function useFitSectionsToPages() {
  useEffect(() => {
    let cancelled = false

    const fit = () => {
      const pages = document.querySelectorAll<HTMLElement>('.brochure-print-page')
      pages.forEach((page) => {
        const section = page.firstElementChild as HTMLElement | null
        if (!section) return
        section.style.transform = ''
        section.style.transformOrigin = ''
        const ph = page.clientHeight
        const pw = page.clientWidth
        const sh = section.scrollHeight
        const sw = section.scrollWidth
        if (!ph || !pw || !sh || !sw) return
        const scale = Math.min(1, ph / sh, pw / sw)
        if (scale < 1) {
          // Anchor at the page's top edge so scaled content fills from the top
          // rather than centering and clipping symmetrically top/bottom.
          section.style.transformOrigin = 'center top'
          section.style.transform = `scale(${scale})`
        }
      })
    }

    const waitForImages = () => {
      const imgs = Array.from(document.images)
      return Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              })
        )
      )
    }

    ;(async () => {
      try {
        await document.fonts?.ready
      } catch {
        /* ignore */
      }
      await waitForImages()
      if (cancelled) return
      // One rAF lets layout settle after the last image's intrinsic size resolves.
      requestAnimationFrame(() => {
        if (cancelled) return
        fit()
        ;(window as unknown as { __brochurePrintReady?: boolean }).__brochurePrintReady = true
      })
    })()

    return () => {
      cancelled = true
    }
  }, [])
}
