import type { Brochure } from '@/types/brochure'
import { SectionRenderer } from './SectionRenderer'
import { BrochureBrandingProvider } from './BrochureContext'
import { accentColorVars } from '@/lib/accentColor'

type Props = {
  brochure: Brochure
}

/**
 * Print-optimised view used by /[slug]/print and the Puppeteer PDF pipeline.
 * Pages stack vertically at A4 landscape (297mm × 210mm) instead of sliding
 * horizontally. No nav, no animations, no client-side wiring — just static
 * markup that prints cleanly. Each page is its own size container so cqi
 * units resolve to the printed page width, matching the desktop reader.
 */
export function BrochurePrintView({ brochure }: Props) {
  const pages = brochure.pages ?? []
  const total = pages.length
  const theme = brochure.theme ?? 'dark'
  const accentStyle = accentColorVars(brochure.accentColor)

  return (
    <BrochureBrandingProvider value={{ accentColor: brochure.accentColor, logo: brochure.logo, theme }}>
      <div className="brochure-print-root" data-theme={theme} style={accentStyle}>
        {pages.map((page, i) => {
          const pageNum = i + 1
          const hasFooter = page.sections.some((s) => s._type === 'footer')
          const showFolio = i > 0 && !hasFooter
          return (
            <div key={page._key} className="brochure-page brochure-print-page">
              {page.sections.map((section) => (
                <SectionRenderer
                  key={section._key}
                  section={section}
                  pageNum={pageNum}
                  total={total}
                  showFolio={section._type === 'footer' ? false : showFolio}
                />
              ))}
            </div>
          )
        })}
      </div>
    </BrochureBrandingProvider>
  )
}
