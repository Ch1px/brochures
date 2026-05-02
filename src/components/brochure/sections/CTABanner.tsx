import type { SectionCTABanner } from '@/types/brochure'
import { RichBody } from '../RichBody'
import { SectionCTA } from '../SectionCTA'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding, useEyebrowNormaliser, useTitleNormaliser } from '../BrochureContext'

type Props = {
  data: SectionCTABanner
  pageNum: number
  total: number
  showFolio: boolean
}

export function CTABanner({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const titleN = useTitleNormaliser()
  const eyebrowN = useEyebrowNormaliser()
  return (
    <section className="section page-text-center page-cta-banner" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-text-center-inner">
        {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="text-center-eyebrow">{eyebrowN(data.eyebrow)}</div></InlineEditable> : null}
        {(data.title || editorMode) ? <InlineEditable sectionKey={data._key} field="title"><h2 className="text-center-title">{titleN(data.title)}</h2></InlineEditable> : null}
        {(data.body || editorMode) ? <InlineEditable sectionKey={data._key} field="body" richBody><RichBody className="text-center-body" text={data.body} /></InlineEditable> : null}
        <SectionCTA text={data.ctaText} href={data.ctaHref} />
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
