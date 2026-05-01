import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { BrochureOutputSchema, type AiBrochureOutput, type AiSection } from './schemas'
import { buildSystemBlocks, buildUserMessage } from './prompts'
import { sanityWriteClient } from '../sanity/client'
import { nanokey } from '../nanokey'
import type { Page } from '@/types/brochure'

// Local relaxed type for AI-hydrated sections. Image fields on the runtime
// `Section` union are required for some variants (imageHero, galleries etc.)
// but the AI never fills them — admins upload images after generation. Using
// the strict union here forced `as Section` casts everywhere, which Turbopack
// 16 was leaking into the runtime bundle as a "Section is not defined" error.
type HydratedSection = { _key: string; _type: string } & Record<string, unknown>

/**
 * End-to-end: free-form admin brief → Claude Opus 4.7 (with web_search +
 *   extended thinking) → emit_brochure tool call → Sanity doc.
 *
 * Caching strategy: system blocks are frozen and cached on the last block
 *   (see prompts.ts → buildSystemBlocks). The brief and sales contact go in
 *   the user message so the prefix stays byte-stable across runs. Verify
 *   via usage.cache_read_input_tokens.
 *
 * Tool flow: tool_choice is 'auto' (forced tool_choice is incompatible with
 *   extended thinking). The system prompt instructs Claude that its final
 *   action MUST be calling emit_brochure. If the response comes back without
 *   a tool call, we retry once with a stronger reminder.
 *
 * Auth: this module is server-only and uses the Sanity write client directly.
 *   assertAdmin() is enforced one layer up in the server action.
 */

const MODEL = 'claude-sonnet-4-6'
// Output budget. Sized to fit thinking + web_search rounds + the final
// emit_brochure tool call. 16K was too tight: thinking + 3 search rounds
// regularly hit the cap before the tool call landed, and we'd fall through
// to the "did not call emit_brochure" error path.
const MAX_TOKENS = 32000
const TOOL_NAME = 'emit_brochure'
const WEB_SEARCH_MAX_USES = 3

/**
 * JSON Schema for the emit_brochure tool. Built once at module load — the
 * tool definition is part of the cached prompt prefix and must be byte-stable.
 *
 * We intentionally do NOT pass `strict: true`. The structured-outputs grammar
 * compiler chokes on our 18-variant discriminated union ("compiled grammar is
 * too large"). Regular tool use accepts arbitrarily large schemas; we validate
 * Claude's output with Zod on our side, which is strict enough for our needs.
 */
const BROCHURE_TOOL_INPUT_SCHEMA = z.toJSONSchema(BrochureOutputSchema, {
  target: 'draft-7',
}) as Record<string, unknown>

export type GenerateInput = {
  event: string
  season: string
  slug?: string
  brief: {
    prompt: string
    sources?: string[]
  }
  salesEmail?: string
  salesPhone?: string
  /** Optional host-company reference. Empty/undefined hosts on the GPGT domain. */
  companyId?: string
}

export type GenerateUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadTokens: number
  cacheCreationTokens: number
}

export type GenerateResult =
  | {
      ok: true
      id: string
      slug: string
      title: string
      usage: GenerateUsage
    }
  | { ok: false; error: string }

export async function generateBrochure(input: GenerateInput): Promise<GenerateResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { ok: false, error: 'ANTHROPIC_API_KEY not configured on the server' }
  }

  const briefPrompt = input.brief.prompt.trim()
  if (!briefPrompt) {
    return { ok: false, error: 'Brief is required' }
  }
  const sources = (input.brief.sources ?? []).map((s) => s.trim()).filter(Boolean)

  const client = new Anthropic({ apiKey })

  const userMessage = buildUserMessage({
    event: input.event,
    season: input.season,
    brief: briefPrompt,
    sources,
    salesEmail: input.salesEmail ?? 'sales@grandprixgrandtours.com',
    salesPhone: input.salesPhone ?? '+44 20 3966 5680',
  })

  let parsed: AiBrochureOutput
  let usage: GenerateUsage

  try {
    const first = await callClaude(client, userMessage, false)
    let toolUse = findToolUse(first.response)
    let chosen = first

    if (!toolUse) {
      const retry = await callClaude(client, userMessage, true)
      toolUse = findToolUse(retry.response)
      chosen = retry
    }

    if (!toolUse) {
      const refusal = chosen.response.content.find((b) => b.type === 'text')
      const stopReason = chosen.response.stop_reason ?? 'unknown'
      const refusalText =
        refusal && 'text' in refusal ? `: ${refusal.text.slice(0, 300)}` : ''
      const hint =
        stopReason === 'max_tokens'
          ? ' — output budget reached before the tool call. Try shortening the brief or fewer reference URLs.'
          : ''
      return {
        ok: false,
        error: `Claude did not call ${TOOL_NAME} (stop_reason: ${stopReason})${refusalText}${hint}`,
      }
    }

    const validation = BrochureOutputSchema.safeParse(toolUse.input)
    if (!validation.success) {
      const issues = validation.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      return { ok: false, error: `Schema validation failed: ${issues}` }
    }

    parsed = validation.data
    usage = {
      inputTokens: chosen.response.usage.input_tokens,
      outputTokens: chosen.response.usage.output_tokens,
      cacheReadTokens: chosen.response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: chosen.response.usage.cache_creation_input_tokens ?? 0,
    }
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `Claude API error ${err.status}: ${err.message}` }
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Generation failed' }
  }

  const pages = hydratePages(parsed.pages)

  try {
    const doc = await sanityWriteClient.create({
      _type: 'brochure',
      title: parsed.title,
      slug: { _type: 'slug', current: input.slug?.trim() || parsed.slug },
      season: parsed.season,
      event: parsed.event,
      status: 'draft',
      featured: false,
      seo: {
        metaTitle: parsed.seoTitle,
        metaDescription: parsed.seoDescription,
        noIndex: false,
      },
      aiBrief: {
        prompt: briefPrompt,
        sources: sources.length ? sources : undefined,
        generatedAt: new Date().toISOString(),
      },
      ...(input.companyId
        ? { company: { _type: 'reference', _ref: input.companyId } }
        : {}),
      pages,
    })
    return {
      ok: true,
      id: doc._id,
      slug: parsed.slug,
      title: parsed.title,
      usage,
    }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Sanity write failed',
    }
  }
}

async function callClaude(
  client: Anthropic,
  userMessage: string,
  isRetry: boolean
): Promise<{ response: Anthropic.Message }> {
  const reminder = isRetry
    ? '\n\nIMPORTANT: Your previous response did not call the emit_brochure tool. You MUST call emit_brochure now with the full brochure as a single tool invocation. Do not respond with plain text. Do not perform additional research — work with what you have and emit the brochure now.'
    : ''

  // First attempt: tool_choice 'auto' so the model can web_search for facts
  // before emitting. Retry: force the emit tool and drop web_search entirely
  // so we can't burn another long round on research — emit from what we have.
  const tools: Anthropic.Tool[] = [
    {
      name: TOOL_NAME,
      description:
        'Emit the completed brochure. Call this exactly once with the full pages array.',
      input_schema: BROCHURE_TOOL_INPUT_SCHEMA as Anthropic.Tool.InputSchema,
    },
  ]
  if (!isRetry) {
    tools.push({
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: WEB_SEARCH_MAX_USES,
    } as unknown as Anthropic.Tool)
  }

  // Streaming is required by the SDK when max_tokens + thinking could push the
  // request past the 10-minute non-streaming ceiling. We don't actually consume
  // the stream incrementally — finalMessage() accumulates and returns the same
  // shape as messages.create().
  const response = await client.messages
    .stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      system: buildSystemBlocks(),
      tools,
      tool_choice: isRetry
        ? { type: 'tool', name: TOOL_NAME }
        : { type: 'auto' },
      messages: [{ role: 'user', content: userMessage + reminder }],
    })
    .finalMessage()
  return { response }
}

function findToolUse(response: Anthropic.Message): Anthropic.ToolUseBlock | undefined {
  return response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === TOOL_NAME
  )
}

/** Stamp _keys; pass section content through. Image fields are left empty —
 *  admins upload images themselves after generation. */
function hydratePages(aiPages: AiBrochureOutput['pages']): Page[] {
  return aiPages.map((page) => ({
    _key: nanokey(),
    name: page.name,
    sections: page.sections.map(hydrateSection),
  })) as unknown as Page[]
}

function hydrateSection(s: AiSection): HydratedSection {
  const _key = nanokey()
  switch (s._type) {
    case 'cover':
    case 'coverCentered':
      return {
        _key,
        _type: s._type,
        edition: s.edition,
        brandMark: s.brandMark,
        sup: s.sup,
        title: s.title,
        titleAccent: s.titleAccent,
        tag: s.tag,
        cta: s.cta,
        ref: s.ref,
        background: s.background,
      }
    case 'intro':
      return {
        _key,
        _type: 'intro',
        letter: s.letter,
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        caption: s.caption,
        background: s.background,
      }
    case 'contentImage':
    case 'imageContent':
      return {
        _key,
        _type: s._type,
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        caption: s.caption,
        background: s.background,
      }
    case 'sectionHeading':
    case 'sectionHeadingCentered':
      return {
        _key,
        _type: s._type,
        eyebrow: s.eyebrow,
        title: s.title,
        text: s.text,
        background: s.background,
      }
    case 'features':
      return {
        _key,
        _type: 'features',
        title: s.title,
        titleAccent: s.titleAccent,
        subtitle: s.subtitle,
        cards: s.cards.map((c) => ({
          _key: nanokey(),
          title: c.title,
          text: c.text,
        })),
        background: s.background,
      }
    case 'imageHero':
      return {
        _key,
        _type: 'imageHero',
        eyebrow: s.eyebrow,
        title: s.title,
        text: s.text,
        background: s.background,
      }
    case 'stats':
      return {
        _key,
        _type: 'stats',
        eyebrow: s.eyebrow,
        title: s.title,
        stats: s.stats.map((st) => ({
          _key: nanokey(),
          value: st.value,
          unit: st.unit,
          label: st.label,
        })),
        background: s.background,
      }
    case 'packages':
      return {
        _key,
        _type: 'packages',
        title: s.title,
        packages: s.packages.map((p) => ({
          _key: nanokey(),
          tier: p.tier,
          name: p.name,
          currency: p.currency,
          price: p.price,
          from: p.from,
          featured: p.featured,
          features: p.features,
        })),
        background: s.background,
      }
    case 'itinerary':
      return {
        _key,
        _type: 'itinerary',
        title: s.title,
        days: s.days.map((d) => ({
          _key: nanokey(),
          day: d.day,
          label: d.label,
          title: d.title,
          description: d.description,
        })),
        background: s.background,
      }
    case 'galleryEditorial':
      return {
        _key,
        _type: 'galleryEditorial',
        title: s.title,
        background: s.background,
      }
    case 'galleryGrid':
      return {
        _key,
        _type: 'galleryGrid',
        eyebrow: s.eyebrow,
        title: s.title,
        background: s.background,
      }
    case 'galleryTrio':
      return {
        _key,
        _type: 'galleryTrio',
        eyebrow: s.eyebrow,
        title: s.title,
        background: s.background,
      }
    case 'galleryDuo':
      return {
        _key,
        _type: 'galleryDuo',
        eyebrow: s.eyebrow,
        title: s.title,
        captions: s.captions,
        background: s.background,
      }
    case 'galleryHero':
      return {
        _key,
        _type: 'galleryHero',
        eyebrow: s.eyebrow,
        title: s.title,
        caption: s.caption,
        background: s.background,
      }
    case 'quoteProfile':
      return {
        _key,
        _type: 'quoteProfile',
        eyebrow: s.eyebrow,
        name: s.name,
        quote: s.quote,
        body: s.body,
        background: s.background,
      }
    case 'closing':
      return {
        _key,
        _type: 'closing',
        eyebrow: s.eyebrow,
        title: s.title,
        subtitle: s.subtitle,
        ctaText: s.ctaText,
        ctaHref: s.ctaHref,
        email: s.email,
        phone: s.phone,
        background: s.background,
      }
    case 'circuitMap':
      return {
        _key,
        _type: 'circuitMap',
        eyebrow: s.eyebrow,
        title: s.title,
        caption: s.caption,
        svg: '',
        stats: s.stats.map((st) => ({
          _key: nanokey(),
          value: st.value,
          unit: st.unit,
          label: st.label,
        })),
        background: s.background,
      }
    case 'spotlight':
      return {
        _key,
        _type: 'spotlight',
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        caption: s.caption,
        background: s.background,
      }
    case 'textCenter':
      return {
        _key,
        _type: 'textCenter',
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        background: s.background,
      }
    case 'ctaBanner':
      return {
        _key,
        _type: 'ctaBanner',
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        ctaText: s.ctaText,
        ctaHref: s.ctaHref,
        background: s.background,
      }
    case 'linkedCards':
      return {
        _key,
        _type: 'linkedCards',
        eyebrow: s.eyebrow,
        title: s.title,
        cards: s.cards.map((c) => ({
          _key: nanokey(),
          title: c.title,
          text: c.text,
          linkText: c.linkText,
          linkHref: c.linkHref,
        })),
        background: s.background,
      }
    case 'faq':
      return {
        _key,
        _type: 'faq',
        eyebrow: s.eyebrow,
        title: s.title,
        subtitle: s.subtitle,
        questions: s.questions.map((q) => ({
          _key: nanokey(),
          question: q.question,
          answer: q.answer,
        })),
        background: s.background,
      }
    case 'logoWall':
    case 'logoStrip':
      return {
        _key,
        _type: s._type,
        eyebrow: s.eyebrow,
        title: s.title,
        subtitle: s.subtitle,
        logos: s.logos.map((l) => ({
          _key: nanokey(),
          name: l.name,
        })),
        background: s.background,
      }
    case 'footer':
      return {
        _key,
        _type: 'footer',
        legal: s.legal,
        email: s.email,
        phone: s.phone,
        background: s.background,
      }
  }
}
