import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import type { Section } from '@/types/brochure'

/**
 * Per-field AI assist — small, fast generations to help admins fill in or
 * rewrite a single field on a single section. Backed by Haiku 4.5 for snap.
 *
 * No tools, no extended thinking, no web search. Plain-text output.
 *
 * Grounded in:
 *   - the brochure's stored aiBrief.prompt (the same brief the full-brochure
 *     generator was given)
 *   - the type and current contents of the section being edited
 *   - the field name being generated
 *   - optional one-line "hint" the admin types in the popover
 */

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_TOKENS = 1024

const SYSTEM_PROMPT = `You write copy for premium travel and hospitality brochures published by Grand Prix Grand Tours.

VOICE — match these every time:
- Specific over general. "Parabolica entry at 340 km/h" beats "thrilling corner".
- Sensory. The reader should hear, see, taste it.
- Restrained. No exclamation marks. No "amazing", "incredible", "unforgettable", "world-class".
- Place-literate. Reference the city, the venue, the neighbourhood.
- Editorial rhythm. Mix short sentences with one longer one that carries the moment.
- British English. Use em-dashes (—), not double hyphens.

OUTPUT — strict:
- Output ONLY the requested field value, as plain text.
- No JSON, no Markdown, no quotation marks wrapping the answer.
- No preamble like "Here is" or "Sure".
- Stay within the length implied by the field (eyebrows are short; bodies are 3–5 sentences).
- If the field name suggests a single character (e.g. drop-cap "letter"), output one character only.`

export type GenerateFieldInput = {
  brief: { prompt: string; sources?: string[] }
  field: string
  sectionType?: string
  sectionContext?: Section | null
  currentValue?: string
  hint?: string
}

export type GenerateFieldResult = { ok: true; value: string } | { ok: false; error: string }

export async function generateField(input: GenerateFieldInput): Promise<GenerateFieldResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured on the server' }
  }

  const briefPrompt = input.brief.prompt?.trim()
  if (!briefPrompt) {
    return { ok: false, error: 'No brief saved on this brochure — add one in Settings to enable AI assist.' }
  }

  const sourcesLine = input.brief.sources && input.brief.sources.length
    ? `REFERENCE URLS (for context only, do not browse):\n${input.brief.sources.map((u, i) => `  ${i + 1}. ${u}`).join('\n')}`
    : ''

  const sectionBlock = input.sectionContext
    ? `CURRENT SECTION (${input.sectionType ?? input.sectionContext._type}):\n${formatSectionForPrompt(input.sectionContext)}`
    : input.sectionType
      ? `SECTION TYPE: ${input.sectionType}`
      : ''

  const currentBlock = input.currentValue?.trim()
    ? `CURRENT VALUE OF ${input.field.toUpperCase()}:\n${input.currentValue.trim()}`
    : `CURRENT VALUE OF ${input.field.toUpperCase()}: (empty)`

  const hintBlock = input.hint?.trim()
    ? `EXTRA HINT FROM THE ADMIN:\n${input.hint.trim()}`
    : ''

  const userMessage = [
    `BROCHURE BRIEF:\n${briefPrompt}`,
    sourcesLine,
    sectionBlock,
    currentBlock,
    hintBlock,
    `Write the new value for the "${input.field}" field. Output the value only — nothing else.`,
  ].filter(Boolean).join('\n\n')

  const client = new Anthropic({ apiKey })
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
    const text = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
    if (!text) {
      return { ok: false, error: 'Claude returned no text' }
    }
    return { ok: true, value: stripWrappingQuotes(text) }
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `Claude API error ${err.status}: ${err.message}` }
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Generation failed' }
  }
}

function formatSectionForPrompt(section: Section): string {
  const filtered: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(section)) {
    if (k.startsWith('_')) continue
    if (v == null) continue
    if (typeof v === 'string' && !v.trim()) continue
    if (Array.isArray(v) && v.length === 0) continue
    if (typeof v === 'object' && (v as { _type?: string })._type === 'image') continue
    if (typeof v === 'object' && (v as { _type?: string })._type === 'file') continue
    if (k === 'svg' || k === 'svgOriginal') continue
    filtered[k] = v
  }
  try {
    return JSON.stringify(filtered, null, 2)
  } catch {
    return ''
  }
}

function stripWrappingQuotes(text: string): string {
  const trimmed = text.trim()
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('\u201c') && trimmed.endsWith('\u201d')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim()
  }
  return trimmed
}
