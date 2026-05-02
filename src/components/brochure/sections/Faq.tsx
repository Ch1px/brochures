import type { SectionFaq } from '@/types/brochure'
import { RichBody } from '../RichBody'
import { InlineEditable } from '../InlineEditable'
import { useBrochureBranding, useEyebrowNormaliser, useTitleNormaliser } from '../BrochureContext'

type Props = {
  data: SectionFaq
  pageNum: number
  total: number
  showFolio: boolean
}

/**
 * FAQ — static 2-column grid of question / answer pairs (max 6).
 *
 * Always-open layout (no accordion) so the section reads identically on
 * web and PDF print. In editor mode all 6 slots show as placeholders so
 * admins can see what's missing.
 */
export function Faq({ data, pageNum, total, showFolio }: Props) {
  const { editorMode } = useBrochureBranding()
  const titleN = useTitleNormaliser()
  const eyebrowN = useEyebrowNormaliser()
  const items = (data.questions ?? []).slice(0, 6)
  const slots = editorMode
    ? Array.from({ length: 6 }, (_, i) => items[i] ?? null)
    : items

  return (
    <section className="section page-faq" data-section-id={data._key}>
      <div className="page-brand-mark">Grand Prix Grand Tours</div>
      <div className="page-faq-inner">
        <div className="faq-header">
          {(data.eyebrow || editorMode) ? (
            <InlineEditable sectionKey={data._key} field="eyebrow">
              <div className="faq-eyebrow">{eyebrowN(data.eyebrow)}</div>
            </InlineEditable>
          ) : null}
          <InlineEditable sectionKey={data._key} field="title">
            <h2 className="faq-title">{titleN(data.title)}</h2>
          </InlineEditable>
          {(data.subtitle || editorMode) ? (
            <InlineEditable sectionKey={data._key} field="subtitle" richBody>
              <RichBody className="faq-subtitle" text={data.subtitle} />
            </InlineEditable>
          ) : null}
        </div>
        <div className="faq-grid">
          {slots.map((item, i) =>
            item ? (
              <div key={item._key} className="faq-item">
                <InlineEditable sectionKey={data._key} field={`questions.${i}.question`}>
                  <div className="faq-question">{titleN(item.question)}</div>
                </InlineEditable>
                <InlineEditable sectionKey={data._key} field={`questions.${i}.answer`} richBody>
                  <RichBody className="faq-answer" text={item.answer} />
                </InlineEditable>
              </div>
            ) : (
              <div key={`empty-${i}`} className="faq-item faq-placeholder">
                <div className="faq-question">Question {String(i + 1).padStart(2, '0')}</div>
                <div className="faq-answer">Add a question and answer in the right panel.</div>
              </div>
            ),
          )}
        </div>
      </div>
      {showFolio ? (
        <div className="page-folio">
          {pageNum} / {total}
        </div>
      ) : null}
    </section>
  )
}
