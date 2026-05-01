import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { BrochureOutputSchema, type AiBrochureOutput, type AiSection } from './schemas'
import { buildSystemBlocks, buildUserMessage } from './prompts'
import { fetchSources } from './urlContext'
import { listLibraryImages, resolveLibraryImage, resolveLibraryImages, type LibraryImage } from './imageLibrary'
import { sanityWriteClient } from '../sanity/client'
import { nanokey } from '../nanokey'
import type { Page, Section, SanityImage } from '@/types/brochure'

/**
 * End-to-end: user intent → Claude Opus 4.7 structured output → Sanity doc.
 *
 * Caching strategy: system blocks are frozen and cached on the last block
 *   (see prompts.ts → buildSystemBlocks). First run writes the cache, every
 *   subsequent generate reads it. Verify via usage.cache_read_input_tokens.
 *
 * Auth: this module is server-only and uses the Sanity write client directly.
 *   assertAdmin() is enforced one layer up in the server action.
 */

const MODEL = 'claude-opus-4-7'
const MAX_TOKENS = 16000
const TOOL_NAME = 'emit_brochure'

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
  urls?: string[]
  vibe?: string
  adminNotes?: string
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

  // 1. Fetch URL context and load the image library in parallel.
  const [sources, imageLibrary] = await Promise.all([
    input.urls && input.urls.length ? fetchSources(input.urls) : Promise.resolve([]),
    listLibraryImages(),
  ])
  const okSources = sources.filter((s) => !s.error && s.content.length > 100)

  // 2. Call Claude with forced tool use + prompt caching.
  const client = new Anthropic({ apiKey })
  let parsed: AiBrochureOutput
  let usage: GenerateUsage

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // No `thinking`: Claude rejects thinking + forced tool_choice together.
      // The few-shot + section guide carry enough structure for this task.
      system: buildSystemBlocks(),
      tools: [
        {
          name: TOOL_NAME,
          description:
            'Emit the completed brochure. Call this exactly once with the full pages array.',
          input_schema: BROCHURE_TOOL_INPUT_SCHEMA as Anthropic.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: TOOL_NAME },
      messages: [
        {
          role: 'user',
          content: buildUserMessage({
            event: input.event,
            season: input.season,
            vibe: input.vibe,
            adminNotes: input.adminNotes,
            sources: okSources,
            imageLibrary: imageLibrary.map((img) => ({
              filename: img.filename,
              description: img.description,
              orientation: img.orientation,
            })),
            salesEmail: input.salesEmail ?? 'sales@grandprixgrandtours.com',
            salesPhone: input.salesPhone ?? '+44 20 3966 5680',
          }),
        },
      ],
    })

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === TOOL_NAME
    )
    if (!toolUse) {
      const refusal = response.content.find((b) => b.type === 'text')
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
      return {
        ok: false,
        error: `Schema validation failed: ${issues}`,
      }
    }

    parsed = validation.data
    usage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    }
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      return { ok: false, error: `Claude API error ${err.status}: ${err.message}` }
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Generation failed' }
  }

  // 3. Resolve image filenames → Sanity asset refs; stamp _keys; build pages.
  const pages = hydratePages(parsed.pages, imageLibrary)

  // 4. Create a published Sanity doc (status: 'draft' per the app convention —
  //    see CLAUDE.md "Status field is explicit, separate from Sanity drafts").
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

/** Resolve imageFilename fields → Sanity image refs; add _keys; strip AI-only fields. */
function hydratePages(
  aiPages: AiBrochureOutput['pages'],
  library: LibraryImage[]
): Page[] {
  const byFilename = new Map(library.map((i) => [i.filename, i]))
  const toImage = (filename?: string): SanityImage | undefined => {
    if (!filename) return undefined
    const hit = byFilename.get(filename)
    if (!hit) return undefined
    return { _type: 'image', asset: { _type: 'reference', _ref: hit._id } }
  }
  const toImages = (filenames?: string[]): SanityImage[] =>
    (filenames ?? [])
      .map((f) => toImage(f))
      .filter((img): img is SanityImage => Boolean(img))

  return aiPages.map((page) => ({
    _key: nanokey(),
    name: page.name,
    sections: page.sections.map((s) => hydrateSection(s, toImage, toImages)),
  }))
}

function hydrateSection(
  s: AiSection,
  toImage: (f?: string) => SanityImage | undefined,
  toImages: (fs?: string[]) => SanityImage[]
): Section {
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
        image: toImage(s.imageFilename),
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
        image: toImage(s.imageFilename),
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
        image: toImage(s.imageFilename),
        background: s.background,
      }
    case 'sectionHeading':
      return {
        _key,
        _type: 'sectionHeading',
        eyebrow: s.eyebrow,
        title: s.title,
        text: s.text,
        image: toImage(s.imageFilename),
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
          image: toImage(c.imageFilename),
        })),
        background: s.background,
      }
    case 'imageHero':
      // The runtime type marks `image` as required, but Sanity tolerates a
      // missing image field. Emit the section anyway — admin will upload.
      return {
        _key,
        _type: 'imageHero',
        eyebrow: s.eyebrow,
        title: s.title,
        text: s.text,
        image: toImage(s.imageFilename),
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
          image: toImage(p.imageFilename),
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
        images: toImages(s.imageFilenames),
        background: s.background,
      }
    case 'galleryGrid':
      return {
        _key,
        _type: 'galleryGrid',
        eyebrow: s.eyebrow,
        title: s.title,
        images: toImages(s.imageFilenames),
        background: s.background,
      }
    case 'galleryDuo':
      return {
        _key,
        _type: 'galleryDuo',
        eyebrow: s.eyebrow,
        title: s.title,
        images: toImages(s.imageFilenames),
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
        images: toImages(s.imageFilenames),
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
        photo: toImage(s.photoFilename),
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
        image: toImage(s.imageFilename),
        backgroundImage: toImage(s.backgroundImageFilename),
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
  }
}

// Silence the unused-import for resolveLibraryImage(s); they're the public API
// for future single-section re-generation flows.
export { resolveLibraryImage, resolveLibraryImages }
