# CLAUDE.md

Orientation for Claude sessions working on this codebase. Covers architecture, conventions, and the non-obvious decisions that aren't visible from reading any single file. For setup and end-user flow, read `README.md` instead.

---

## What this is

A publishing system for Grand Prix Grand Tours event brochures. Admins build brochures in a custom in-house editor at `/admin/brochures/[id]/edit`; the output is rendered publicly at `brochures.grandprixgrandtours.com/[slug]`. Each brochure is per-event, per-season (e.g. Monaco 2026).

Single-admin editing model — no real-time collaboration. ~3 admins total, small audience, <20 brochures per year.

## Stack

- **Next.js 15** (App Router, React 19 RC) on Vercel
- **TypeScript** strict mode
- **Sanity** — CMS, image CDN, embedded Studio at `/studio`
- **Clerk** — auth for `/admin` and `/studio`; email allowlist on top of auth
- **HubSpot** — lead capture via Forms API (endpoint built, front-end modal not)
- **Resend** — transactional email for new-lead notifications
- **jose** — JWT signing for preview tokens

No Tailwind. No CSS-in-JS. Single `globals.css` (~447KB, ported wholesale from the HTML prototype the design was built in) plus a scoped `editor.css` for the admin chrome.

npm, not pnpm/yarn. `npm install --legacy-peer-deps` required because Sanity/Clerk peer ranges don't yet include React 19 RC.

## Architecture at a glance

```
           Public reader                         Admin editor
           ─────────────                         ────────────
┌─────────────────────────────┐        ┌─────────────────────────────┐
│  /[slug]  (ISR 60s)         │        │  /admin/brochures/[id]/edit │
│  ┌───────────────────────┐  │        │  ┌───────────────────────┐  │
│  │ BrochureReader        │  │        │  │ BrochureEditor (state)│  │
│  │   ↳ BrochureNav       │  │        │  │   ↳ EditorTopbar      │  │
│  │   ↳ SectionRenderer ──┼──┼────────┼──│   ↳ PagesPanel        │  │
│  │      ↳ <section>s × 19│  │  same  │  │   ↳ PreviewStage ─────┼──┼──┐
│  └───────────────────────┘  │ section│  │   ↳ PropertiesPanel   │  │  │
└─────────────┬───────────────┘  comps │  │      ↳ editors × 19   │  │  │
              │                        │  │   ↳ AddSectionModal   │  │  │
              │ GROQ                   │  └───────────────────────┘  │  │
              │                        └─────────────┬───────────────┘  │
              │                                      │ server actions   │
              ▼                                      ▼                  │
┌─────────────────────────────────────────────────────────────────┐     │
│  Sanity Content Lake                                            │◀────┘
│  brochure { pages: [ page { sections: [cover | intro | …] } ] } │   SectionRenderer
│  + assets (images, no SVG files)                                │   is shared — same
└─────────────────────────────────────────────────────────────────┘   components render
                                                                      both public and preview
```

**Single source of truth**: Sanity. The editor holds the brochure in local React state for low-latency editing, debounces saves back via server actions. The public reader fetches from Sanity directly (via CDN) on each request (with ISR).

## Directory map

```
gpgt-brochures/
├── CLAUDE.md                          ← this file
├── README.md                          ← user-facing setup
├── schemas/                           ← Sanity schemas (23 files)
│   ├── brochure.ts                    ← top-level document
│   ├── page.ts                        ← page object (name + sections[])
│   ├── index.ts                       ← registers all types
│   └── sections/                      ← one file per section type
│       ├── cover.ts  coverCentered.ts  intro.ts  contentImage.ts  imageContent.ts
│       ├── sectionHeading.ts  sectionHeadingCentered.ts  features.ts  imageHero.ts
│       ├── stats.ts  packages.ts  itinerary.ts  galleryEditorial.ts  galleryGrid.ts
│       ├── galleryDuo.ts  galleryHero.ts  quoteProfile.ts  closing.ts  circuitMap.ts
│       └── index.ts
├── sanity.config.ts                   ← Studio config (loaded by /studio route)
├── middleware.ts                      ← Clerk gate on /admin/* and /studio/*
├── next.config.js                     ← 20MB body limit for image uploads
└── src/
    ├── app/
    │   ├── layout.tsx                 ← ClerkProvider + globals.css
    │   ├── globals.css                ← ~447KB, ported from HTML prototype
    │   ├── page.tsx                   ← root: redirect to featured brochure
    │   ├── [slug]/page.tsx            ← public brochure, ISR, verifies preview JWT
    │   ├── studio/[[...tool]]/page.tsx ← embedded Sanity Studio
    │   ├── admin/
    │   │   ├── layout.tsx             ← email allowlist check
    │   │   ├── page.tsx               ← library (server) → AdminLibraryClient
    │   │   └── brochures/[id]/edit/
    │   │       ├── page.tsx           ← fetches brochure, renders BrochureEditor
    │   │       ├── layout.tsx         ← imports editor.css
    │   │       └── editor.css         ← scoped chrome styles (topbar, panels, fields)
    │   └── api/
    │       ├── lead/route.ts          ← HubSpot forms proxy + Resend notification
    │       └── revalidate/route.ts    ← Sanity webhook → revalidatePath
    ├── components/
    │   ├── brochure/                  ← public reader components
    │   │   ├── BrochureReader.tsx     ← horizontal slider + keyboard nav (CLIENT)
    │   │   ├── BrochureNav.tsx        ← top nav with burger menu (CLIENT)
    │   │   ├── SectionRenderer.tsx    ← _type dispatcher
    │   │   └── sections/              ← 16 section components (Cover, SplitSection,
    │   │                                  SectionHeading handle multi _type variants)
    │   └── admin/                     ← editor components
    │       ├── BrochureEditor.tsx     ← root state holder (CLIENT)
    │       ├── EditorTopbar.tsx       ← title, save indicator, status, preview link
    │       ├── PagesPanel.tsx         ← left column tree
    │       ├── PreviewStage.tsx       ← centre 16:10 preview using SectionRenderer
    │       ├── PropertiesPanel.tsx    ← right column dispatcher
    │       ├── AddSectionModal.tsx    ← 19-type picker with mini-previews
    │       ├── NewBrochureModal.tsx   ← library create flow
    │       ├── AdminLibraryClient.tsx ← library grid + duplicate action
    │       ├── editors/               ← 16 property editor forms (1-per-section)
    │       └── fields/                ← FieldInput, FieldTextarea, FieldImage,
    │                                     FieldImageSlot, FieldList, FieldObjectArray,
    │                                     FieldBoolean, FieldSelect, FieldLabel
    ├── hooks/
    │   └── useAutosave.ts             ← 1s debounced save, beforeunload guard
    ├── lib/
    │   ├── env.ts                     ← requireEnv / optionalEnv helpers
    │   ├── nanokey.ts                 ← 12-char _key generator
    │   ├── previewToken.ts            ← jose HS256 signing/verification
    │   ├── sectionLabels.ts           ← _type → display label maps
    │   ├── sectionDefaults.ts         ← sectionDefaults(type) factories
    │   ├── sectionPreviews.ts         ← mini-preview HTML + picker order
    │   ├── themeCircuitSvg.ts         ← circuit SVG palette remap (client-safe)
    │   └── sanity/
    │       ├── client.ts              ← public CDN + write-enabled clients
    │       ├── image.ts               ← urlFor / urlForSection helpers
    │       ├── queries.ts             ← GROQ queries
    │       ├── mutations.ts           ← server-only write helpers
    │       └── actions.ts             ← 'use server' action wrappers
    └── types/
        └── brochure.ts                ← Brochure, Page, Section discriminated union
```

## Core data model

Top-level document in Sanity:

```ts
brochure {
  title, slug, season ('2026'|'2027'|'2028'), event,
  status ('draft'|'published'|'unpublished'|'archived'),
  publishedAt, featured,
  theme ('dark'|'light'),
  accentColor (hex like '#cf212a'; overrides --brand-red for this brochure),
  logo (image; overrides the GPGT nav logo for this brochure),
  seo { metaTitle, metaDescription, ogImage, noIndex },
  leadCapture { hubspotFormId, hubspotPortalId, destinationEmail },
  pages [ page { _key, name, sections: [ … ] } ]
}
```

**19 section types**, camelCase in Sanity and TypeScript. Most types map 1:1 to a component, but three components handle variants via `_type` check:

- `Cover` → handles `cover` + `coverCentered`
- `SplitSection` → handles `contentImage` + `imageContent`
- `SectionHeading` → handles `sectionHeading` + `sectionHeadingCentered`

Total: **16 section components, 19 `_type` values**.

Each section has:
- `_key`: string (Sanity array item id, we generate client-side via `nanokey()` for optimistic updates)
- `_type`: discriminant
- …field content per schema

## Non-obvious decisions

### Status field is explicit, separate from Sanity drafts

Sanity has native `drafts.{id}` vs `{id}` document IDs. We don't use this convention. Instead, every brochure is a single doc with an explicit `status: 'draft' | 'published' | 'unpublished' | 'archived'` field. Why: we need 4 states, Sanity's built-in model only gives 2. The `/[slug]` public route filters on `status == "published"`; preview-token-verified requests can see any status.

### Whole-array patches, not granular array operations

`saveBrochureAction` does `patch.set({ pages })` — replaces the whole pages array on every save. Simpler than Sanity's `insert()`/`unset()` operations and fine for single-admin editing. If we ever need multi-admin, switch to granular ops keyed by `_key`. Don't assume you can edit granularly here without first moving to the other pattern — race conditions are real.

### Server actions, not API routes, for mutations

`src/lib/sanity/actions.ts` has `'use server'` directives. Every mutation goes through a server action that re-checks the email allowlist via `assertAdmin()`. Middleware gates routes; actions gate mutations. Both layers matter — don't remove either.

Exception: `/api/lead` and `/api/revalidate` are route handlers because they're called by external services (HubSpot form submission, Sanity webhook).

### Image uploads via FormData server action

Client reads file → FormData → `uploadImageAction` → server uses Sanity write client to upload to Asset pipeline → returns `{ _type: 'image', asset: { _ref } }`. The write token never reaches the browser.

**Body size limit**: `next.config.js` sets `experimental.serverActions.bodySizeLimit: '20mb'`. Default is 1MB. Don't remove without consequences.

### SVG uploads are client-side only

CircuitMap SVGs are stored as text on the document (not as file assets). On upload, the client reads the file, runs `themeCircuitSvg()` to remap the F1-style palette to the brochure theme, and writes the themed XML to the `svg` text field. No server round-trip. The public reader uses `dangerouslySetInnerHTML` — safe because admin-authored content.

### The public reader and the editor use the same section components

`<SectionRenderer>` and its 16 children are shared. The editor wraps each in a `.preview-section-hitbox` div that adds click-to-select but renders the exact same markup. This means fixing a bug in a section component fixes it in both places, but also means the components can't assume they're in either context. Specifically:

- They are **plain components, not client components** (`SectionRenderer.tsx` has no `'use client'`), but because they're imported by `BrochureReader` (client) and `PreviewStage` (client), they end up in the client bundle anyway
- They receive `pageNum`, `total`, `showFolio` — both consumers pass these
- They use `urlForSection()` to resolve Sanity image refs to CDN URLs — don't hard-code URLs

### Container-scoped `cqi` / `cqh` units

The brochure CSS (in `globals.css`) uses `cqi` (container query inline) and `cqh` units throughout. In the public reader, the container is set by `BrochureReader` via the slider. In the editor preview, `.preview-stage-frame` has `container-type: size; container-name: brochure-frame;` so sections scale to the frame, not the viewport. If you add new section styles, keep using these units — don't switch to `vw`/`vh` or you'll break the editor preview.

### Per-instance SVG gradient IDs

`Cover.tsx`, `Closing.tsx`, `ImageHero.tsx`, `ImagePlaceholderSVG.tsx` all generate unique SVG `<defs>` gradient IDs using the section `_key` or `useId()`. The builder prototype used hard-coded IDs (`id="imhg1"` etc.) which collide when multiple sections of the same type render on one page. Don't revert — bugs are subtle and visual.

### Per-brochure accent + logo override

Each brochure may set an `accentColor` (single hex) and a `logo` (image). The accent overrides the four `--brand-red*` CSS variables at the brochure root (`BrochureReader` for public, `.preview-stage-frame` for editor preview) via `accentColorVars()` in `src/lib/accentColor.ts`. Hover/glow/dim values are derived from the single hex (lighten 10%, alpha 0.35, alpha 0.12). All section CSS already reads `var(--brand-red)`, and section JSX SVGs use `currentColor` with the SVG element's `color` set to `var(--brand-red)` — so the override cascades automatically. Admin chrome (topbar, panels) is outside this scope and stays on the platform default.

`circuitMap` sections store both `svg` (themed at upload time) and `svgOriginal` (untouched). `CircuitMap` re-themes from `svgOriginal` at render via `themeCircuitSvg(svgOriginal, accentColor)` so accent changes take effect without re-uploading. Existing brochures without `svgOriginal` keep their stored `svg` (back-compat).

`BrochureContext.tsx` exposes `accentColor`, `logo`, `theme` to descendants that need them outside the prop tree (currently only `CircuitMap`). The provider wraps both reader and editor-preview roots.

### `.page-brand-mark` is in the markup but hidden

Every section component renders `<div class="page-brand-mark">Grand Prix Grand Tours</div>`. `globals.css` has `.page-brand-mark { display: none }` globally. Kept in markup to match the prototype 1:1 so any future design decision to show it is a single CSS change.

### The fonts are base64-embedded in globals.css

Formula1, Northwell, Titillium — all inlined as `data:font/woff2;base64,…` URLs inside `@font-face` rules. This makes globals.css ~447KB. Tradeoff: one fewer HTTP request chain but larger CSS file. Future optimisation: extract to `/public/fonts/*.woff2` and use `next/font/local`. Not urgent.

## Conventions

### Autosave pattern

```ts
// In BrochureEditor:
const [brochure, setBrochure] = useState<Brochure>(initialBrochure)
const { status: saveStatus } = useAutosave(brochure)
```

Any state update via `setBrochure` triggers `useAutosave` to debounce (1s) and call `saveBrochureAction`. Don't bypass this by calling Sanity directly from the client — the write token isn't exposed there anyway. If you need an imperative save, use `flushNow()` from `useAutosave`.

### Field edit pattern

Every property edit in the right panel flows through one function in `BrochureEditor`:

```ts
const handleSectionChange = (update: Partial<Section>) => {
  setBrochure(prev => ({
    ...prev,
    pages: prev.pages.map(p => ({
      ...p,
      sections: p.sections.map(s =>
        s._key === currentSectionKey ? { ...s, ...update } as Section : s
      ),
    })),
  }))
}
```

The `as Section` cast is necessary — `Partial<Section>` is a union of partials which TypeScript can't merge into a concrete member safely. The cast is safe at runtime because each editor only passes valid keys for its section's type.

### Section registration

When adding a new section type, **five files need updates** (easy to miss one):

1. `schemas/sections/{type}.ts` — new Sanity schema
2. `schemas/page.ts` — add to the `sections` array-of member list
3. `schemas/sections/index.ts` — add to `sectionSchemas` array
4. `src/types/brochure.ts` — new discriminated union member, add to `Section` type
5. `src/lib/sectionLabels.ts` — add to `SECTION_LABELS` + `SECTION_DESCRIPTIONS`
6. `src/lib/sectionDefaults.ts` — new factory in the switch
7. `src/lib/sectionPreviews.ts` — mini-preview HTML + add to `SECTION_PICKER_ORDER`
8. `src/components/brochure/sections/{Type}.tsx` — public reader component
9. `src/components/brochure/SectionRenderer.tsx` — new `case` in the switch
10. `src/components/admin/editors/{Type}Editor.tsx` — editor component
11. `src/components/admin/PropertiesPanel.tsx` — new `case` in the dispatcher

Yes, 11 files. Yes, this could be abstracted. No, don't abstract it without a strong reason — the explicit duplication makes refactors trivially grep-able and the data model stable.

### Design tokens

All editor chrome CSS uses tokens defined at `:root` in `globals.css`:

```
--brand-red        #cf212a    primary accent
--brand-red-hover  #c20500     button hover
--chrome-bg        deep dark   editor root background
--chrome-surface   dark panel  side panels
--chrome-raised    slightly lighter   input backgrounds
--chrome-border    faint       section dividers
--chrome-border-strong   a bit brighter for focus
--chrome-text            main text
--chrome-text-secondary  labels, secondary
--chrome-text-tertiary   placeholders, meta
--chrome-text-muted      disabled
--font-display     Formula1 condensed — titles
--font-condensed   Formula1 regular — buttons, labels
--font-mono        Titillium small caps — eyebrows, meta
--font-body        Titillium — paragraphs
```

Don't hard-code colours in component JSX — use the tokens. This makes theming trivial if we ever add a light mode or brand refresh.

### Field component API

All `Field*` components share a shape:

```ts
{
  label: string
  description?: string       // optional hint below the label
  value: T | undefined       // always accept undefined
  onChange: (value: T) => void
}
```

When adding a new field type, follow this. If the field wraps a standard input, use `useId()` + `htmlFor` for screen readers (see `FieldInput.tsx`).

## Common tasks

### Add a new property field to an existing section

1. Add the field to `schemas/sections/{type}.ts` (Sanity validation)
2. Add to the TypeScript type in `src/types/brochure.ts`
3. If it needs default content, update `sectionDefaults(type)` in `src/lib/sectionDefaults.ts`
4. Add the corresponding `<Field*>` in the matching editor in `src/components/admin/editors/{Type}Editor.tsx`
5. If it's rendered, update the public component in `src/components/brochure/sections/{Type}.tsx`

### Add a new field component type

`src/components/admin/fields/Field{Name}.tsx` implementing the `{ label, description, value, onChange }` contract, export from `fields/index.ts`. If it needs new CSS, append to `src/app/admin/brochures/[id]/edit/editor.css` following the existing `.field-*` naming. Don't touch `globals.css` for editor-only styles.

### Change a brochure-level field (title, slug, etc.)

Brochure-level editing is currently limited — title is in `EditorTopbar`, other fields (slug, season, event, SEO, leadCapture) can only be edited via `/studio`. If a full brochure-metadata panel is needed, add it as a tab or modal in `BrochureEditor`, using the same field components and `saveBrochureAction`.

### Run the project

```bash
npm install --legacy-peer-deps   # required for React 19 RC peer deps
cp .env.example .env.local       # fill in Sanity + Clerk at minimum
npm run dev                      # http://localhost:3000
npm run typecheck                # strict TypeScript check
npm run build                    # production build test
```

Minimum env for local dev: `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_API_WRITE_TOKEN`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `ADMIN_EMAIL_ALLOWLIST` (your sign-in email), `PREVIEW_TOKEN_SECRET`.

Sanity CORS: add `http://localhost:3000` with credentials in the Sanity API settings or embedded Studio will fail.

## Things not to do

- **Don't expose `SANITY_API_WRITE_TOKEN` to client code**. Only imported by files that have `'use server'` or `import 'server-only'`. Breaking this exfiltrates full database write access.
- **Don't remove the `assertAdmin()` call in server actions**. Middleware is not sufficient — Next.js can technically serve server actions without going through middleware in edge cases, and defence-in-depth matters for admin mutations.
- **Don't switch status management from the explicit field to Sanity's draft system.** It would cascade into all the GROQ queries, the `/[slug]` route logic, and the editor's status dropdown. Not worth it.
- **Don't add Tailwind.** `globals.css` is sized for full ports of the brochure CSS — adding another styling system would fork the token system and make refactors harder. Use CSS modules or the existing design tokens.
- **Don't replace `dangerouslySetInnerHTML` in `CircuitMap.tsx` with a sanitiser.** The SVG content comes from admin-authored uploads, not user input. Sanitising would strip the circuit diagram.
- **Don't hard-code Sanity asset URLs.** Always go through `urlFor()` / `urlForSection()` — they respect project ID, dataset, and transformation parameters.
- **Don't trust the editor's local state to match Sanity after a crash.** Autosave is best-effort. If the save indicator shows "error", the state is diverged; a page refresh will show the last saved version.

## Known follow-ups

Logged in `README.md`'s "deliberately skipped" list. Summary:

- **410 Gone for unpublished/archived**: Currently 404s. Next.js App Router has no first-class 410 helper; requires middleware rewriting to a `/gone` route or moving `/[slug]` to a route handler. Low priority — 404 still de-indexes, just slower.
- **Sitemap.xml**: GROQ query exists (`PUBLISHED_BROCHURES_SITEMAP`); needs a `src/app/sitemap.ts` consumer. Maybe 15 lines.
- **Enquiry modal**: `/api/lead` works end-to-end (HubSpot + Resend); no front-end modal component exists yet. The closing section's CTA `ctaHref: '#enquire'` is the intended trigger.
- **Analytics**: No Plausible integration. Per the architecture plan, event hooks go into `BrochureReader` for page-flip tracking and into the enquiry modal for conversion tracking.
- **Font extraction**: Fonts are base64 in globals.css; extracting to `/public/fonts/*.woff2` + `next/font/local` would reduce the CSS bundle from ~447KB to ~30KB. Not blocking.
- **Section-type switch UI**: Once a section is added, its `_type` is fixed. No "convert Cover to Cover Centered" action — user deletes and re-adds. Probably fine; don't build unless asked.

## Design-source fidelity

The HTML prototype (`gpgt-brochure-studio.html` in the brochure-studio project, not in this repo) is the **design source of truth**. All 19 section components were ported 1:1 from `renderX()` functions in that file. The editor UI mirrors the prototype's builder. If there's ever a visual discrepancy between the Next.js app and the prototype, the prototype wins unless explicitly decided otherwise.

If you're asked to add a new section type that doesn't exist in the prototype, flag this — the design should be decided first, usually by updating the prototype, then ported.