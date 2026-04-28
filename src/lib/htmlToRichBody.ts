/**
 * Convert contentEditable innerHTML back to the plain-text format
 * that RichBody.tsx expects:
 *   - Paragraphs as text lines
 *   - Bullet items as "- item text"
 *   - Numbered items as "1. item text"
 *   - Blank lines between blocks
 *
 * Browsers represent contentEditable content inconsistently:
 *   - Chrome wraps lines in <div>
 *   - Firefox uses <br> between lines
 *   - Both may produce <p>, <ul>/<li>, <ol>/<li> from the original RichBody
 */
export function htmlToRichBody(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocks: string[] = []

  function processNode(node: Element) {
    const tag = node.tagName.toLowerCase()

    if (tag === 'ul') {
      const items = Array.from(node.querySelectorAll(':scope > li'))
        .map((li) => `- ${li.textContent?.trim() || ''}`)
        .filter((s) => s !== '- ')
      if (items.length) blocks.push(items.join('\n'))
      return
    }

    if (tag === 'ol') {
      const items = Array.from(node.querySelectorAll(':scope > li'))
        .map((li, i) => `${i + 1}. ${li.textContent?.trim() || ''}`)
        .filter((s) => !s.endsWith('. '))
      if (items.length) blocks.push(items.join('\n'))
      return
    }

    if (tag === 'br') {
      // <br> at top level = blank line separator
      return
    }

    // <p>, <div>, <h1>-<h6>, <span>, or any other block/inline element
    const text = node.textContent?.trim()
    if (text) blocks.push(text)
  }

  const children = doc.body.children
  if (children.length === 0) {
    // No block-level children — might be plain text with <br> tags
    // Split by <br> and treat each segment as a line
    const raw = doc.body.innerHTML
    if (raw.includes('<br')) {
      const lines = raw
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .split('\n')
        .map((l) => l.trim())
      return lines.join('\n')
    }
    return doc.body.textContent?.trim() || ''
  }

  for (const child of Array.from(children)) {
    processNode(child)
  }

  // If no blocks extracted, fall back to innerText
  if (blocks.length === 0) {
    return doc.body.textContent?.trim() || ''
  }

  return blocks.join('\n\n')
}
