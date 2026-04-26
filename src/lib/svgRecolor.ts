/**
 * Per-element SVG recolouring helpers for the Circuit Map section.
 *
 * Strategy: bake everything into the SVG string before it's inlined via
 * dangerouslySetInnerHTML — both the stable `data-recolor-id` markers and
 * the per-element colour overrides. React's rendering becomes the single
 * source of truth; no post-mount DOM mutation is needed for colours.
 *
 * String-based regex transforms are used (not DOMParser) so this works on
 * the server during SSR as well as in the browser. The transforms are
 * idempotent and tolerant of attribute order, quoting style, and existing
 * inline `style` attributes.
 */

export const RECOLORABLE_TAGS = [
  'path',
  'rect',
  'circle',
  'polygon',
  'line',
  'ellipse',
  'polyline',
] as const

const TAG_GROUP = RECOLORABLE_TAGS.join('|')

// Regex matches an entire opening tag of a recolourable element, splitting
// the attribute body from the optional trailing self-close `/`. Captures:
//   group 1: tag name
//   group 2: attribute body (lazy — does NOT include the trailing slash)
//   group 3: optional self-close slash (`` or `/`)
// We close the match on the literal `>` so callers always know where the tag
// ends. Lazy `[^>]*?` is required so the slash group can claim a `/` that
// appears immediately before `>` even when the attributes contain `/`
// elsewhere (e.g. `xlink:href="#foo/bar"/>`).
const TAG_RE = new RegExp(`<(${TAG_GROUP})\\b([^>]*?)(\\/?)>`, 'gi')

const ID_ATTR_RE = /data-recolor-id\s*=\s*["']el-(\d+)["']/i
const FILL_ATTR_RE = /\bfill\s*=\s*["']([^"']*)["']/i
const STROKE_ATTR_RE = /\bstroke\s*=\s*["']([^"']*)["']/i
const STYLE_ATTR_RE = /\bstyle\s*=\s*["']([^"']*)["']/i

/**
 * Assign sequential `data-recolor-id="el-N"` markers to every recolourable
 * element in the SVG string, in document order. Idempotent: existing markers
 * are kept, and the counter advances past the highest existing N so newly-
 * added elements always get a fresh id.
 */
export function bakeRecolorIds(svgText: string): string {
  if (!svgText) return svgText
  // First pass: find the maximum existing id so we don't clash.
  let maxN = -1
  svgText.replace(TAG_RE, (_match, _tag, attrs) => {
    const m = ID_ATTR_RE.exec(attrs)
    if (m) {
      const n = Number(m[1])
      if (Number.isFinite(n) && n > maxN) maxN = n
    }
    return _match
  })

  // Second pass: stamp ids on elements that don't have one yet, continuing
  // from maxN + 1. Re-emits the tag with the slash position preserved so
  // self-closing `<path/>` stays self-closing.
  let next = maxN + 1
  return svgText.replace(TAG_RE, (match, tag, attrs, slash) => {
    if (ID_ATTR_RE.test(attrs)) return match
    const id = `el-${next}`
    next += 1
    return `<${tag} data-recolor-id="${id}"${attrs}${slash}>`
  })
}

/**
 * Determine whether an element should have its fill, stroke, or both
 * recoloured based on its existing attributes — without parsing the DOM.
 *
 * Rules:
 * - Explicit `fill="none"` (attr or style) → fill off.
 * - Explicit non-"none" fill → fill on.
 * - Explicit non-"none" stroke → stroke on.
 * - Element has a stroke but NO explicit fill → fill off (treat as a
 *   stroke-only shape; the SVG default of black fill is almost certainly
 *   incidental on circuit-style line work, and recolouring it would turn
 *   the path into a visible blob).
 * - No explicit fill AND no stroke → default to fill on (the element is
 *   relying on SVG's default black fill).
 */
function detectColorTargetsFromAttrs(attrs: string): { fill: boolean; stroke: boolean } {
  const fillAttr = FILL_ATTR_RE.exec(attrs)?.[1] ?? null
  const strokeAttr = STROKE_ATTR_RE.exec(attrs)?.[1] ?? null
  const styleAttr = STYLE_ATTR_RE.exec(attrs)?.[1] ?? ''

  const styleFillMatch = /(?:^|;)\s*fill\s*:\s*([^;]+)/i.exec(styleAttr)
  const styleStrokeMatch = /(?:^|;)\s*stroke\s*:\s*([^;]+)/i.exec(styleAttr)
  const styleFill = styleFillMatch ? styleFillMatch[1].trim() : null
  const styleStroke = styleStrokeMatch ? styleStrokeMatch[1].trim() : null

  const effectiveFill = styleFill ?? fillAttr
  const effectiveStroke = styleStroke ?? strokeAttr

  const hasExplicitFill = effectiveFill !== null
  const hasExplicitStroke = effectiveStroke !== null

  const strokeOn = hasExplicitStroke && effectiveStroke !== 'none'
  const fillOn = hasExplicitFill
    ? effectiveFill !== 'none'
    : !strokeOn // default-black fill applies only when nothing else is going on

  if (!fillOn && !strokeOn) return { fill: true, stroke: false }
  return { fill: fillOn, stroke: strokeOn }
}

/**
 * Inject per-element colour overrides into the SVG string as inline
 * `style="fill: …; stroke: …"`. Inline style wins over `fill`/`stroke`
 * attributes and CSS, so overrides are visually authoritative.
 *
 * Auto-detects whether to override fill, stroke, or both based on the
 * element's existing attributes.
 */
export function bakeOverridesIntoSvg(
  svgText: string,
  overrides: Map<string, string>,
): string {
  if (!svgText || overrides.size === 0) return svgText

  return svgText.replace(TAG_RE, (match, tag, attrs, slash) => {
    const idMatch = ID_ATTR_RE.exec(attrs)
    if (!idMatch) return match
    const id = `el-${idMatch[1]}`
    const color = overrides.get(id)
    if (!color) return match

    const targets = detectColorTargetsFromAttrs(attrs)
    const declarations: string[] = []
    if (targets.fill) declarations.push(`fill: ${color}`)
    if (targets.stroke) declarations.push(`stroke: ${color}`)
    if (declarations.length === 0) return match

    const newStyleSnippet = declarations.join('; ')
    const styleMatch = STYLE_ATTR_RE.exec(attrs)
    let newAttrs: string
    if (styleMatch) {
      const existing = styleMatch[1].trim().replace(/;\s*$/, '')
      // Strip any prior fill/stroke declarations from the existing style so
      // the override wins and we don't end up with duplicate, conflicting
      // declarations after multiple edits.
      const cleaned = existing
        .split(/\s*;\s*/)
        .filter((decl) => {
          if (!decl) return false
          const lower = decl.toLowerCase().trim()
          return !lower.startsWith('fill:') && !lower.startsWith('stroke:')
        })
        .join('; ')
      const merged = cleaned ? `${cleaned}; ${newStyleSnippet}` : newStyleSnippet
      newAttrs = attrs.replace(STYLE_ATTR_RE, `style="${merged}"`)
    } else {
      newAttrs = `${attrs} style="${newStyleSnippet}"`
    }
    return `<${tag}${newAttrs}${slash}>`
  })
}
