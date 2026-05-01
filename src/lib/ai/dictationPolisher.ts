import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Polish a raw browser-speech-recognition transcript.
 *
 * The Web Speech API gives back lowercase, punctuation-free, run-on text.
 * This pass adds capitalisation, sentence breaks, paragraphing, and fixes
 * obvious filler/disfluencies — without adding or removing meaning.
 *
 * Backed by Haiku 4.5 — small, fast, cheap. No tools, no thinking.
 */

const MODEL = 'claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You clean up raw speech-to-text transcripts for an editor field.

Your job:
- Add capitalisation, full stops, commas, question marks, and apostrophes.
- Break long run-on speech into sentences and short paragraphs where natural.
- Fix obvious transcription errors that produce broken grammar (e.g. "their" vs "there", missing articles, dropped function words).
- Remove filler ("um", "uh", "you know", "like" used as filler) and self-corrections (e.g. "the red — I mean blue car" → "the blue car").
- Use British English spelling.
- Use em-dashes (—) for editorial asides, not double hyphens.

What you must NOT do:
- Do NOT add facts, examples, or content the speaker didn't say.
- Do NOT remove specifics (names, numbers, places).
- Do NOT change meaning or rephrase ideas.
- Do NOT translate or change voice/tone.
- Do NOT add quotation marks, headers, lists, or Markdown.

Output:
- Return ONLY the cleaned text. No preamble, no explanation, no quotation marks wrapping the answer.`

export type PolishDictationResult = { ok: true; value: string } | { ok: false; error: string }

export async function polishDictation(rawText: string): Promise<PolishDictationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured on the server' }
  }

  const trimmed = rawText.trim()
  if (!trimmed) return { ok: true, value: '' }

  // Token budget scales with input — give comfortable headroom so we never
  // truncate. Speech is ~1.3 tokens/word; round up generously.
  const maxTokens = Math.min(4000, Math.max(256, Math.ceil(trimmed.length / 2)))

  const client = new Anthropic({ apiKey })
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Clean up this transcript:\n\n${trimmed}`,
        },
      ],
    })
    const text = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim()
    if (!text) return { ok: false, error: 'Polisher returned no text' }
    return { ok: true, value: stripWrappingQuotes(text) }
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `Claude API error ${err.status}: ${err.message}` }
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Polish failed' }
  }
}

function stripWrappingQuotes(text: string): string {
  const t = text.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith('\u201c') && t.endsWith('\u201d')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim()
  }
  return t
}
