import type { SectionTextCenter } from '@/types/brochure'
import { RichBody } from '../RichBody'

type Props = {
  data: SectionTextCenter
  pageNum: number
  total: number
  showFolio: boolean
}

export function TextCenter({ data, pageNum, total, showFolio }: Props) {
  return (
    <section className="section page-text-center" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-text-center-inner">
        {data.eyebrow ? <div className="text-center-eyebrow">{data.eyebrow}</div> : null}
        {data.title ? <h2 className="text-center-title">{data.title}</h2> : null}
        <RichBody className="text-center-body" text={data.body} />
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
