import type { ReactNode } from 'react'

type Block =
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }

const BULLET_RE = /^\s*[-*]\s+(.*)$/
const NUMBERED_RE = /^\s*\d+\.\s+(.*)$/

function parseRichBody(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let current: Block | null = null
  let paragraph: string[] = []

  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join('\n') })
      paragraph = []
    }
  }
  const flushCurrent = () => {
    if (current) {
      blocks.push(current)
      current = null
    }
  }

  for (const line of lines) {
    const bullet = line.match(BULLET_RE)
    const numbered = line.match(NUMBERED_RE)

    if (bullet) {
      flushParagraph()
      if (current?.type !== 'ul') {
        flushCurrent()
        current = { type: 'ul', items: [] }
      }
      current.items.push(bullet[1])
    } else if (numbered) {
      flushParagraph()
      if (current?.type !== 'ol') {
        flushCurrent()
        current = { type: 'ol', items: [] }
      }
      current.items.push(numbered[1])
    } else if (line.trim() === '') {
      flushParagraph()
      flushCurrent()
    } else {
      flushCurrent()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushCurrent()

  return blocks
}

type Props = {
  text: string | undefined | null
  className?: string
}

export function RichBody({ text, className }: Props): ReactNode {
  if (!text) return null
  const blocks = parseRichBody(text)
  if (blocks.length === 0) return null

  if (blocks.length === 1 && blocks[0].type === 'p') {
    return <p className={className}>{blocks[0].text}</p>
  }

  const wrapperClass = ['rich-body', className].filter(Boolean).join(' ')

  return (
    <div className={wrapperClass}>
      {blocks.map((block, i) => {
        if (block.type === 'p') {
          return <p key={i}>{block.text}</p>
        }
        if (block.type === 'ul') {
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          )
        }
        return (
          <ol key={i}>
            {block.items.map((item, j) => (
              <li key={j}>{item}</li>
            ))}
          </ol>
        )
      })}
    </div>
  )
}
