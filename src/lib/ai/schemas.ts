import { z } from 'zod'

/**
 * Zod schemas for AI-generated brochure output.
 *
 * Claude is forced (via a single tool call) to emit content matching this
 * shape. Differences from the runtime Section union in `@/types/brochure`:
 *
 * 1. No `_key`. The server generates keys via nanokey() after parsing — this
 *    keeps the LLM output smaller and avoids the model fabricating duplicates.
 * 2. Images are `imageFilename?: string` pointing at a library entry, not a
 *    Sanity asset ref. `resolveImages()` in generator.ts swaps them for refs.
 * 3. `circuitMap.svg` is always omitted — admin-authored upload only.
 *
 * Structured-output JSON Schema limitations to keep in mind:
 *   - No `minLength`/`maxLength` on strings
 *   - No recursion
 *   - `additionalProperties: false` enforced (zodOutputFormat handles this)
 * See claude-api skill docs for the full list.
 */

const imageFilename = z.string().optional().describe(
  'Filename from the supplied image library. ALWAYS pick the best available match — reuse images across sections rather than leaving this blank. Only omit as an absolute last resort when the library is empty.'
)

const background = z.string().optional().describe(
  'Optional CSS color for the section background (e.g. "#0a0a0b"). Leave empty for default.'
)

// --- Sections ---

export const CoverSectionSchema = z.object({
  _type: z.enum(['cover', 'coverCentered']),
  edition: z.string().describe('e.g. "2026 Edition"'),
  brandMark: z.string().describe('e.g. "GPGT · Hospitality"'),
  sup: z.string().describe('Eyebrow above title, e.g. "Formula 1"'),
  title: z.string().describe('Main title — often the event name, e.g. "Monza"'),
  titleAccent: z.string().describe('Accent after title, e.g. "Grand Prix"'),
  tag: z.string().describe('One-line tagline under the title'),
  cta: z.string().describe('Short call-to-action, e.g. "Secure your seat"'),
  ref: z.string().describe('Reference code, e.g. "No. 014 / Volume XV"'),
  imageFilename,
  background,
})

export const IntroSectionSchema = z.object({
  _type: z.literal('intro'),
  letter: z.string().describe('Single drop-cap character'),
  eyebrow: z.string(),
  title: z.string(),
  body: z.string().describe('3–5 sentence evocative opening paragraph'),
  caption: z.string().describe('Short image caption'),
  imageFilename,
  background,
})

export const ContentImageSectionSchema = z.object({
  _type: z.enum(['contentImage', 'imageContent']),
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  caption: z.string().optional(),
  imageFilename,
  background,
})

export const SectionHeadingSchema = z.object({
  _type: z.literal('sectionHeading'),
  eyebrow: z.string(),
  title: z.string(),
  text: z.string().optional(),
  imageFilename,
  background,
})

export const FeaturesSectionSchema = z.object({
  _type: z.literal('features'),
  title: z.string().describe('Lead-in phrase, e.g. "A weekend of"'),
  titleAccent: z.string().describe('Accent phrase that completes the title'),
  subtitle: z.string(),
  cards: z
    .array(
      z.object({
        title: z.string(),
        text: z.string(),
        imageFilename: z
          .string()
          .optional()
          .describe('REQUIRED in practice — every card must have an image. Pick the best library match. Reuse from the library if needed.'),
      })
    )
    .describe('Exactly 3 cards'),
  background,
})

export const ImageHeroSchema = z.object({
  _type: z.literal('imageHero'),
  eyebrow: z.string(),
  title: z.string(),
  text: z.string(),
  imageFilename,
  background,
})

export const StatsSectionSchema = z.object({
  _type: z.literal('stats'),
  eyebrow: z.string(),
  title: z.string(),
  stats: z
    .array(
      z.object({
        value: z.string(),
        unit: z.string(),
        label: z.string(),
      })
    )
    .describe('Exactly 4 stats recommended'),
  background,
})

export const PackagesSectionSchema = z.object({
  _type: z.literal('packages'),
  title: z.string(),
  packages: z.array(
    z.object({
      tier: z.string().describe('e.g. "Bronze", "Gold", "VIP"'),
      name: z.string(),
      currency: z.string().describe('Usually "£"'),
      price: z.string().describe('Just the number, formatted e.g. "2,249"'),
      from: z.string().describe('Usually "From · per person"'),
      featured: z.boolean().describe('Mark exactly one tier (usually the middle) as featured: true'),
      features: z
        .array(z.string())
        .describe('4–6 specific bullet points — real hotels, real transfers, real inclusions'),
      imageFilename: z
        .string()
        .optional()
        .describe('REQUIRED in practice — every package card must have an image. Pick the best library match. Reuse if needed.'),
    })
  ),
  background,
})

export const ItinerarySchema = z.object({
  _type: z.literal('itinerary'),
  title: z.string(),
  days: z.array(
    z.object({
      day: z.string().describe('Two-digit string, e.g. "01"'),
      label: z.string().describe('Day of week + date, e.g. "Friday 4 Sept"'),
      title: z.string().describe('Short phrase, e.g. "Qualifying"'),
      description: z.string(),
    })
  ),
  background,
})

export const GalleryEditorialSchema = z.object({
  _type: z.literal('galleryEditorial'),
  title: z.string(),
  imageFilenames: z
    .array(z.string())
    .describe('Exactly 4 filenames — asymmetric layout (1 tall + 2 stacked + 1 wide). Reuse from the library if needed.'),
  background,
})

export const GalleryGridSchema = z.object({
  _type: z.literal('galleryGrid'),
  eyebrow: z.string(),
  title: z.string(),
  imageFilenames: z
    .array(z.string())
    .describe('Exactly 6 filenames — uniform 3×2 grid. Reuse from the library if the pool is smaller.'),
  background,
})

export const GalleryDuoSchema = z.object({
  _type: z.literal('galleryDuo'),
  eyebrow: z.string(),
  title: z.string(),
  imageFilenames: z.array(z.string()).describe('Exactly 2 filenames'),
  captions: z.array(z.string()).describe('Exactly 2 captions, one per image'),
  background,
})

export const GalleryHeroSchema = z.object({
  _type: z.literal('galleryHero'),
  eyebrow: z.string(),
  title: z.string(),
  caption: z.string().describe('Caption for the lead (first) image'),
  imageFilenames: z
    .array(z.string())
    .describe('Exactly 4 filenames — first is the big hero, next 3 are the thumbnail strip. Reuse if needed.'),
  background,
})

export const QuoteProfileSchema = z.object({
  _type: z.literal('quoteProfile'),
  eyebrow: z.string(),
  name: z.string(),
  quote: z.string(),
  body: z.string(),
  photoFilename: z.string().optional(),
  background,
})

export const ClosingSchema = z.object({
  _type: z.literal('closing'),
  eyebrow: z.string(),
  title: z.string(),
  subtitle: z.string(),
  ctaText: z.string(),
  ctaHref: z.string().describe('Always "#enquire"'),
  email: z.string(),
  phone: z.string(),
  background,
})

export const CircuitMapSchema = z.object({
  _type: z.literal('circuitMap'),
  eyebrow: z.string(),
  title: z.string(),
  caption: z.string(),
  stats: z.array(
    z.object({
      value: z.string(),
      unit: z.string(),
      label: z.string(),
    })
  ),
  background,
})

export const SpotlightSchema = z.object({
  _type: z.literal('spotlight'),
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  caption: z.string().optional(),
  imageFilename: z
    .string()
    .optional()
    .describe('REQUIRED in practice — foreground hero image. Pick the best library match.'),
  backgroundImageFilename: z
    .string()
    .optional()
    .describe('REQUIRED in practice — background image that sits behind the foreground. Can reuse the same file as imageFilename.'),
  background,
})

export const TextCenterSchema = z.object({
  _type: z.literal('textCenter'),
  eyebrow: z.string(),
  title: z.string(),
  body: z.string(),
  background,
})

// --- Union & root ---

export const SectionSchema = z.discriminatedUnion('_type', [
  CoverSectionSchema,
  IntroSectionSchema,
  ContentImageSectionSchema,
  SectionHeadingSchema,
  FeaturesSectionSchema,
  ImageHeroSchema,
  StatsSectionSchema,
  PackagesSectionSchema,
  ItinerarySchema,
  GalleryEditorialSchema,
  GalleryGridSchema,
  GalleryDuoSchema,
  GalleryHeroSchema,
  QuoteProfileSchema,
  ClosingSchema,
  CircuitMapSchema,
  SpotlightSchema,
  TextCenterSchema,
])

export const PageSchema = z.object({
  name: z.string().describe('Short page name for the left-rail tree'),
  sections: z.array(SectionSchema),
})

export const BrochureOutputSchema = z.object({
  title: z.string(),
  slug: z.string().describe('kebab-case slug, no spaces'),
  event: z.string(),
  season: z.string().describe('4-digit year string'),
  seoTitle: z.string(),
  seoDescription: z.string(),
  pages: z.array(PageSchema).describe('Target 8–12 pages'),
})

export type AiSection = z.infer<typeof SectionSchema>
export type AiPage = z.infer<typeof PageSchema>
export type AiBrochureOutput = z.infer<typeof BrochureOutputSchema>
