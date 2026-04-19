# GPGT Brochures

Publishing system for Grand Prix Grand Tours event brochures.

- **Public brochures**: `brochures.grandprixgrandtours.com/[slug]` — SEO-indexed, ISR cached, OG preview cards
- **Root redirect**: `brochures.grandprixgrandtours.com/` → the featured brochure
- **Admin library**: `/admin` (Clerk auth + email allowlist)
- **Sanity Studio**: `/studio` (embedded, same auth)
- **Lead capture**: `/api/lead` → HubSpot Forms API + Resend notification
- **ISR bust**: `/api/revalidate` ← Sanity webhook on publish

Stack: Next.js 15 (App Router, React 19) · Sanity · Clerk · HubSpot · Resend · Vercel

---

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create service accounts

- **Sanity**: [sanity.io/manage](https://www.sanity.io/manage) → create project → copy `projectId`. Create an API token with Editor role.
- **Clerk**: [dashboard.clerk.com](https://dashboard.clerk.com) → create application → copy publishable + secret keys.
- **HubSpot**: get your Portal ID (top-right in the account). Form IDs are configured per-brochure inside Sanity.
- **Resend** (optional): [resend.com](https://resend.com) → create API key for transactional notifications on new leads.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in each section. The `ADMIN_EMAIL_ALLOWLIST` is critical — anyone logging in via Clerk with an email NOT in this list gets a 404 on `/admin` and `/studio`.

### 4. Run the dev server

```bash
npm run dev
```

Visit:
- `http://localhost:3000/studio` → sign in with Clerk, create your first brochure
- `http://localhost:3000/[slug]` → the brochure renders publicly

### 5. Create a first brochure

Open `/studio`, click the Brochure type, then "+ Create new". Fill in:
- **Title**: e.g. "Monaco Grand Prix 2026"
- **Slug**: auto-generated from title
- **Season**: 2026
- **Status**: draft
- **Pages**: add at least one page with at least one Cover section

Flip Status to "Published" and the brochure becomes visible at `/[slug]`.

To make it the subdomain root redirect: tick **Featured** on the brochure.

---

## Deploying to production

### Vercel

```bash
vercel link
vercel env pull .env.local   # pulls prod env into local
vercel --prod                # deploys
```

All env vars from `.env.example` need to be set in the Vercel project settings under Settings → Environment Variables.

### DNS

Point `brochures.grandprixgrandtours.com` at Vercel:

```
CNAME  brochures  cname.vercel-dns.com.
```

Vercel's dashboard will walk you through SSL provisioning (automatic via Let's Encrypt).

### Sanity webhook (for instant ISR busts on publish)

In Sanity project → API → Webhooks → "Add webhook":
- **URL**: `https://brochures.grandprixgrandtours.com/api/revalidate`
- **Trigger on**: Create, Update, Delete
- **Filter**: `_type == "brochure"`
- **Projection**: `{slug, status, _id}`
- **Secret**: paste the value of `SANITY_REVALIDATE_SECRET` from your env

Without this, brochure edits still go live — just wait up to 60 seconds for ISR to refresh.

---

## Project structure

```
gpgt-brochures/
├── .env.example
├── next.config.js
├── middleware.ts              # Clerk gate on /admin and /studio
├── sanity.config.ts           # Studio config (loaded by embedded studio)
├── schemas/                   # Sanity schemas — 19 section types + brochure + page
│   ├── index.ts
│   ├── brochure.ts
│   ├── page.ts
│   └── sections/
│       └── ... (19 files)
└── src/
    ├── app/
    │   ├── layout.tsx         # ClerkProvider + globals.css
    │   ├── page.tsx           # Root: redirect to featured brochure
    │   ├── globals.css        # Brochure styles (ported wholesale from builder artifact)
    │   ├── [slug]/
    │   │   └── page.tsx       # Public brochure route (ISR)
    │   ├── studio/
    │   │   ├── layout.tsx
    │   │   └── [[...tool]]/
    │   │       └── page.tsx   # Embedded Sanity Studio
    │   ├── admin/
    │   │   ├── layout.tsx     # Email allowlist check
    │   │   └── page.tsx       # Brochure library
    │   └── api/
    │       ├── lead/route.ts       # HubSpot forms proxy
    │       └── revalidate/route.ts # Sanity webhook → ISR bust
    ├── components/
    │   └── brochure/
    │       ├── BrochureReader.tsx    # Horizontal slider + keyboard nav (client)
    │       ├── BrochureNav.tsx       # Top brochure nav (client)
    │       ├── SectionRenderer.tsx   # _type dispatcher
    │       └── sections/
    │           ├── Cover.tsx
    │           └── UnsupportedSection.tsx  # Placeholder for the other 18
    ├── lib/
    │   ├── env.ts
    │   └── sanity/
    │       ├── client.ts            # Public (CDN) + write-enabled clients
    │       ├── image.ts             # urlFor() + urlForSection()
    │       └── queries.ts           # GROQ queries
    └── types/
        └── brochure.ts              # TypeScript types mirroring the schema
```

---

## What still needs porting

This scaffold is end-to-end working — a brochure doc in Sanity → public rendered page — but only **Cover** is ported from the 19 section types. The other 18 show the `UnsupportedSection` placeholder.

Each one follows the same pattern. For each section type:

1. Open the builder artifact (`gpgt-brochure-studio.html`) and find the `renderX()` function for that section
2. Create `src/components/brochure/sections/X.tsx` — wrap the HTML as JSX, take a typed prop from `src/types/brochure.ts`, resolve any Sanity image refs via `urlForSection()`
3. Register the new component in `src/components/brochure/SectionRenderer.tsx` — uncomment the matching `case` in the switch
4. Test by creating a brochure in Studio that uses that section type

Order I'd suggest, by frequency of use:

1. `Intro` and `ImageHero` — most common next to Cover
2. `Features` and `Stats` — straightforward grids
3. `Packages` and `Itinerary` — the commercial/operational core
4. `ContentImage` / `ImageContent` — reuse intro CSS
5. `SectionHeading` / `SectionHeadingCentered` — chapter openers
6. `QuoteProfile` — pattern-match Cover for image handling
7. Gallery variants (`GalleryEditorial`, `GalleryGrid`, `GalleryDuo`, `GalleryHero`) — image-array heavy
8. `Closing` — ties into the enquiry modal
9. `CircuitMap` — last because it's the most bespoke (SVG colour remap logic needs porting too)

The builder itself (the editor UI at `/admin/brochures/[id]/edit`) also still needs porting. That's a bigger task — the whole left/right panel layout, property editors, drag-to-reorder, etc. Do it after all 19 sections render correctly on the public side.

---

## Things this scaffold deliberately skips

- **Analytics hooks** (Plausible) — wire in later under `src/lib/analytics.ts`
- **Enquiry modal UI component** — API endpoint is ready; the front-end modal component needs building
- **Sitemap route** — GROQ query exists (`PUBLISHED_BROCHURES_SITEMAP`), but no `/sitemap.xml` route yet
- **410 Gone response for archived/unpublished** — currently returns 404. Next.js App Router has no first-class 410 helper; to upgrade: either use middleware that does a cheap Sanity status lookup and rewrites to a `/gone` route with `NextResponse.rewrite({ status: 410 })`, or move `/[slug]` to a route handler so you can write the response directly. Low priority — 404 still removes the page from the index, just slower.
- **Error boundaries and loading states** — add per-route once the public page has more than just Cover
- **Font extraction** — fonts are base64-embedded in globals.css. Later, extract to `/public/fonts/*.woff2` and use `next/font/local` for better caching

---

## Commands

```bash
npm run dev         # start local dev
npm run build       # production build
npm run start       # start production server locally
npm run lint        # lint via next
npm run typecheck   # TypeScript check without emit
```

---

## Licence

Private — © Grand Tours Travel Group
