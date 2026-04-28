'use client'

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
