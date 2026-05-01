import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { BrochureOutputSchema, type AiBrochureOutput, type AiSection } from './schemas'
import { buildSystemBlocks, buildUserMessage } from './prompts'
import { sanityWriteClient } from '../sanity/client'
import { nanokey } from '../nanokey'
import type { Page, Section } from '@/types/brochure'

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

const MODEL = 'claude-opus-4-7'
const MAX_TOKENS = 16000
const THINKING_BUDGET = 8000
const TOOL_NAME = 'emit_brochure'
const WEB_SEARCH_MAX_USES = 5

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
      return {
        ok: false,
        error: `Claude did not call ${TOOL_NAME}${
          refusal && 'text' in refusal ? `: ${refusal.text.slice(0, 300)}` : ''
        }`,
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
    ? '\n\nIMPORTANT: Your previous response did not call the emit_brochure tool. You MUST call emit_brochure now with the full brochure as a single tool invocation. Do not respond with plain text.'
    : ''

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    thinking: { type: 'enabled', budget_tokens: THINKING_BUDGET },
    system: buildSystemBlocks(),
    tools: [
      {
        name: TOOL_NAME,
        description:
          'Emit the completed brochure. Call this exactly once with the full pages array.',
        input_schema: BROCHURE_TOOL_INPUT_SCHEMA as Anthropic.Tool.InputSchema,
      },
      {
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: WEB_SEARCH_MAX_USES,
      } as unknown as Anthropic.Tool,
    ],
    tool_choice: { type: 'auto' },
    messages: [{ role: 'user', content: userMessage + reminder }],
  })
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
  }))
}

function hydrateSection(s: AiSection): Section {
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
      } as Section
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
      } as Section
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
      } as Section
    case 'sectionHeading':
    case 'sectionHeadingCentered':
      return {
        _key,
        _type: s._type,
        eyebrow: s.eyebrow,
        title: s.title,
        text: s.text,
        background: s.background,
      } as Section
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
      } as Section
    case 'imageHero':
      return {
        _key,
        _type: 'imageHero',
        eyebrow: s.eyebrow,
        title: s.title,
        text: s.text,
        background: s.background,
      } as Section
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
      } as Section
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
      } as Section
    case 'galleryGrid':
      return {
        _key,
        _type: 'galleryGrid',
        eyebrow: s.eyebrow,
        title: s.title,
        background: s.background,
      } as Section
    case 'galleryDuo':
      return {
        _key,
        _type: 'galleryDuo',
        eyebrow: s.eyebrow,
        title: s.title,
        captions: s.captions,
        background: s.background,
      } as Section
    case 'galleryHero':
      return {
        _key,
        _type: 'galleryHero',
        eyebrow: s.eyebrow,
        title: s.title,
        caption: s.caption,
        background: s.background,
      } as Section
    case 'quoteProfile':
      return {
        _key,
        _type: 'quoteProfile',
        eyebrow: s.eyebrow,
        name: s.name,
        quote: s.quote,
        body: s.body,
        background: s.background,
      } as Section
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
      } as Section
    case 'textCenter':
      return {
        _key,
        _type: 'textCenter',
        eyebrow: s.eyebrow,
        title: s.title,
        body: s.body,
        background: s.background,
      }
  }
}
