import type { SectionTextCenter } from '@/types/brochure'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding } from '../BrochureContext'

type Props = {
  data: SectionTextCenter
  pageNum: number
  total: number
  showFolio: boolean
}

export function TextCenter({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  return (
    <section className="section page-text-center" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-text-center-inner">
        {(data.eyebrow || editorMode) ? <InlineEditable sectionKey={data._key} field="eyebrow"><div className="text-center-eyebrow">{data.eyebrow || ''}</div></InlineEditable> : null}
        {(data.title || editorMode) ? <InlineEditable sectionKey={data._key} field="title"><h2 className="text-center-title">{data.title || ''}</h2></InlineEditable> : null}
        <InlineEditable sectionKey={data._key} field="body" richBody><RichBody className="text-center-body" text={data.body} /></InlineEditable>
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
