# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## ✅ Database Status: MongoDB is FULLY DEPRECATED — running on Amazon DynamoDB

**Migration completed (July 2026).** MongoDB Atlas has been abandoned entirely (the cluster was unreachable, is being decommissioned, and its DB user should be revoked). The runtime database is **Amazon DynamoDB**, region `us-east-1`, accessed via the AWS SDK for JavaScript v3 (`@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`), on-demand billing. **Mongoose and the `mongodb` package have been uninstalled; `philosopia-api/models/` has been deleted.** Do not reintroduce Mongoose.

Three tables are live and seeded:

| Table | Partition key | Sort key | Notes |
|---|---|---|---|
| `philosopia-content` | `entityType` (S) | `id` (S) | All 8 content entity types (philosopher, school, period, concept, beef, work, quote, artwork) |
| `philosopia-analytics` | `day` (S, `YYYY-MM-DD`) | `ts` (S, ISO timestamp + suffix) | Native TTL enabled on `expiresAt` (epoch seconds, 90-day expiry) — replaces the old Mongo TTL index |
| `philosopia-users` | `username` (S) | — | Admin auth; bcrypt hash stored (hashing moved from the Mongoose pre-save hook into `authRoutes.js` / `scripts/createAdmin.js`) |

What replaced Mongoose:
- **`philosopia-api/db/client.js`** — the `DynamoDBDocumentClient` singleton (loads `.env` regardless of caller cwd). `DYNAMO_ENDPOINT` overrides the endpoint for DynamoDB Local offline testing.
- **`philosopia-api/db/content.js`** — repository for the content table: `listByType`, `getById`, `getByIds` (BatchGet, powers the beef/concept/quote/work joins), `put`, `putMany` (BatchWrite, 25/chunk with retry on `UnprocessedItems`), `deleteById`.
- **`philosopia-api/db/analytics.js`** — day-partition writes/queries for the analytics table.
- **`philosopia-api/db/users.js`** — get/put for the users table.
- **`philosopia-api/db/aliases.js`** — `withFlatAliases()` / `withFlatAliasesList()`, the DynamoDB-era replacement for the old Mongoose virtuals (`models/_shared.js`, now deleted): decorates items leaving the API with derived flat keys (`nameEn`, `nameHe`, …) from the canonical nested `{ en, he }` source, so **the frontend needed zero changes**.
- **`philosopia-api/scripts/setupTables.js`** — idempotent one-off that creates all 3 tables (on-demand billing) and enables analytics TTL. Run via `npm run setup:tables`.

Routes no longer use `.populate()` or MongoDB aggregation pipelines — `periods.js` and `schools.js` do their group-by joins in app code (fetch all philosophers once, bucket by `periodId`/`schoolId`); `beefs.js`, `concepts.js`, `quotes.js`, `works.js` join via `getByIds`. All response JSON shapes were kept identical to the Mongo-era API, verified endpoint-by-endpoint against the live AWS tables.

Known follow-up: `quotes.js`/`works.js`/`artworkRoutes.js` add a synthetic `_id: item.id` to each item for frontend compatibility (React keys, copy-state tracking) — safe to drop once the frontend is updated to use `id` directly. See the Known Data Issue section below — some seed data still references philosophers by short ids that don't match `philosophers.json`, causing partial skips during seeding (independent of the DB migration; same behavior existed under Mongo).

---

## ⚠️ Known Data Issue: Philosopher ID Mismatches (found July 2026)

`data/philosophers.json` uses full canonical ids (e.g. `rene_descartes`, `john_locke`, `baruch_spinoza`, `immanuel_kant`, `friedrich_nietzsche`) — 62 total. Three other data files reference philosophers by **short ids** that don't match, so those records are silently skipped during seeding (the lookup `allPhilosophers.find(p => p.id === item.philosopherId)` returns undefined → warning + skip):

- **`data/beefs.js`** — ✅ fixed: the `rationalism-empiricism` beef now uses `rene_descartes` / `john_locke` (was `descartes` / `locke`).
- **`seeders/seed_library.js`** — ⏳ not yet fixed. Of 13 `libraryData` entries, only `plato` and `aristotle` match; the rest (`descartes`, `nietzsche` ×2, `kant` ×2, `spinoza` ×2, `de_beauvoir` ×2) need the same short→canonical rename. `confucius` ×2 has no canonical match at all (see below).
- **`data/quotes.js`** — ⏳ not yet fixed. Of 46 entries, 17 use short ids that need renaming: `descartes`→`rene_descartes`, `locke`→`john_locke`, `kant`→`immanuel_kant`, `nietzsche`→`friedrich_nietzsche`, `spinoza`→`baruch_spinoza`, `de_beauvoir`→`simone_de_beauvoir`, `hegel`→`georg_wilhelm_friedrich_hegel`, `hobbes`→`thomas_hobbes`, `leibniz`→`gw_leibniz`, `maimonides`→`moses_maimonides`, `marx`→`karl_marx`, `rousseau`→`jean_jacques_rousseau`, `schopenhauer`→`arthur_schopenhauer`, `arendt`→`hannah_arendt`, `kierkegaard`→`soren_kierkegaard`. The remaining 3 (`aquinas`, `husserl`, `machiavelli`) aren't renames — see below.

**Genuinely missing from `philosophers.json`** (referenced in `quotes.js` and/or `seed_library.js` but no matching record exists — these keep skipping regardless of id renames, until either added to `philosophers.json` or their quote/library entries are removed):
- Thomas Aquinas (`aquinas`)
- Edmund Husserl (`husserl`)
- Niccolò Machiavelli (`machiavelli`)
- Confucius (`confucius`) — Chinese philosophy is currently represented only by Mencius and Xunzi

Note: `seeders/seeder.js`, `seeders/seed_library.js`, and `seeders/quoteSeeder.js` still `import mongoose` and connect via `MONGO_URI` — consistent with the Database Status section above (the DynamoDB port hasn't landed yet), so they can't actually run against a live database right now.

Note: `.env` is untracked/gitignored and is **not copied into new git worktrees** — copy it from the main checkout manually before running seeders inside a worktree.

---

## What Is Philosopia?

**Philosopia** is a bilingual (English/Hebrew) interactive encyclopedia of the history of philosophy. The goal is to make philosophy accessible to curious people — not just academics — by presenting philosophers, their ideas, their schools of thought, and their famous disagreements in a clean, engaging web experience available in both English and Hebrew.

### What the site covers:
- **Philosophers** — detailed profiles with images, biographical summaries, key ideas, quotes, influences, and school affiliations. Data is automatically enriched from Wikipedia and Wikidata.
- **Schools of thought** — Stoicism, Empiricism, Existentialism, and many more, with their member philosophers.
- **Periods** — a chronological timeline from the Pre-Socratics through the 20th century.
- **Concepts** — foundational philosophical ideas explained accessibly (e.g. Free Will, The Good, The Sublime).
- **Beefs** — historical disagreements between philosophers framed in a fun, engaging way (e.g. Rationalism vs. Empiricism).
- **Art & Philosophy** — artwork connected to philosophical movements and ideas.
- **Works** and **Quotes** — (implemented in backend, currently toggled off in the nav but routes exist).

The site is fully bilingual — all content is stored in English and Hebrew, fonts swap (Playfair Display/Inter for EN, Frank Ruhl Libre/Heebo for HE), RTL layout applies automatically for Hebrew, and URLs are prefixed `/en/` or `/he/`.

---

## What We Built — Project History

### Foundation
- Set up a **monorepo** with an Express.js REST API (`philosopia-api/`) and a React SPA (`philosopia-site/`), orchestrated with `concurrently` from the root.
- Originally connected to MongoDB Atlas with Mongoose models; **migrated to Amazon DynamoDB in July 2026** (see Database Status above) after the Atlas cluster became unreachable.
- Migrated the backend to **ES Modules** (`"type": "module"`).

### Data Layer Refactor & DynamoDB Migration (July 2026)
- Refactored every content schema to a canonical bilingual shape (nested `{ en, he }`) and string-key relations (no Mongo ObjectId refs), in preparation for a database-agnostic move.
- Replaced Mongoose entirely with a thin repository layer over the AWS SDK v3 (`philosopia-api/db/`); deleted `philosopia-api/models/`.
- Provisioned 3 DynamoDB tables (`philosopia-content`, `philosopia-analytics`, `philosopia-users`) via a one-off setup script; re-ran all seeders against DynamoDB; verified every route against the live AWS tables.
- Rewrote `periods`/`schools` (formerly `$lookup` aggregations) and `beefs`/`concepts`/`quotes`/`works` (formerly `.populate()`) as app-side joins over `getByIds`/`listByType`.

### Data & Seeding
- Built a `masterSeed.js` pipeline that seeds all entities (philosophers, periods, schools, concepts, beefs, works, quotes, artworks).
- Built **Wikipedia/Wikidata enrichers** that auto-populate philosopher bios (EN & HE), images, influenced-by/students relations, country, and religion from open data.
- Philosopher model supports image priority: `manualImageUrl` → `enrichedImageUrl` → `imageUrl`.

### Backend API
- REST endpoints under `/api/` for all entities: philosophers, periods, schools, concepts, beefs, works, quotes, artworks, auth.
- **Server-side 5-minute TTL cache** middleware to reduce MongoDB load.
- **JWT authentication** for admin-only mutation routes.
- **Rate limiting** middleware.
- **Health check** at `GET /api/health`.
- **Analytics ingestion** (`POST /api/analytics/events`) and stats aggregation (`GET /api/analytics/stats`).

### Frontend
- React Router with language-prefixed routes (`/en/*`, `/he/*`). Base `/` redirects to `/en`.
- `LanguageContext` + `texts.js` for all translation strings.
- `AuthContext` for JWT admin login/logout.
- `ThemeContext` for dark/light mode toggle.
- **Client-side localStorage caching** (5-min TTL) in `src/lib/api.js` to minimize repeated API calls.
- `@/` path alias configured in `jsconfig.json`.
- Tailwind CSS with shadcn/ui primitives (`Button`, `Badge`, `Dialog`, `Separator`, `ScrollArea`, `Sheet`, `Slider`, `Card`).

### Key Pages & Features Built
| Feature | Status |
|---|---|
| Home page with bento grid, philosopher spotlight, featured beef, About section | ✅ Done |
| Philosophers page — grid view with paginated cards + alphabetical filter (AlphaNav) | ✅ Done |
| Philosophers page — timeline view with era sidebar, scroll-spy, philosopher detail modal | ✅ Done |
| Individual philosopher profile page | ✅ Done |
| Schools page + school detail page | ✅ Done |
| Concepts page + concept detail page | ✅ Done |
| Beefs page + beef detail page | ✅ Done |
| Art & Philosophy page | ✅ Done |
| About page | ✅ Done |
| Works page | ✅ Built (toggled off in nav) |
| Quotes page | ✅ Built (toggled off in nav) |
| Admin login (`/login`) | ✅ Done |
| Admin dashboard — Statistics tab (content counts + analytics KPIs, daily chart, top pages, exit pages, top events) | ✅ Done |
| Admin dashboard — Beef Manager tab (add/delete beefs via form) | ✅ Done |
| Analytics tracker (`src/utils/tracker.js`) — pageviews, exit tracking, time on page, custom events, batched via `sendBeacon` | ✅ Done |
| Docker multi-stage builds for API + frontend (nginx) | ✅ Done |
| Bilingual RTL/LTR layout | ✅ Done |
| Dark/light theme toggle | ✅ Done |

### Refactoring & Improvements Made Along the Way
- Cleaned up `App.jsx` — extracted `AppShell` component, synced language with URL path.
- Added `AlphaNav` component for letter-based filtering on the philosophers list.
- Moved periods timeline into `PhilosophersPage` (periods route now redirects to `?view=timeline`).
- Fixed philosopher identifier consistency and cache middleware logic.
- Added `.env` for `REACT_APP_API_BASE_URL`.
- Hebrew bio support added to the enrichment pipeline.

---

## Monorepo Structure

```
philosopia_site/
├── philosopia-api/     # Express.js REST API (backend)
├── philosopia-site/    # React SPA (frontend)
├── docker-compose.yml  # Orchestrates both services
└── package.json        # Root scripts using concurrently
```

---

## Commands

### Development (from root)
```bash
npm run install:all   # Install all dependencies for both workspaces
npm run dev           # Run API + frontend concurrently
npm run start:api     # API only (port 5000)
npm run start:site    # Frontend only (port 3000)
npm run seed          # Seed/initialize the DynamoDB database
```

### Frontend (from philosopia-site/)
```bash
npm start             # Dev server at localhost:3000
npm run build         # Production build
npm test              # Run tests (React Testing Library via react-scripts)
npm test -- --testPathPattern=<file>  # Run a single test file
```

### Backend (from philosopia-api/)
```bash
npm run dev           # nodemon dev server at port 5000
npm start             # Production start
npm run setup:tables  # One-off: create the 3 DynamoDB tables + enable analytics TTL (idempotent)
npm run seed:all      # Run masterSeed.js to seed all data into DynamoDB
```

### Docker
```bash
docker-compose up     # Build and start both containers
docker-compose up -d  # Detached mode
```

---

## Architecture

### Backend (`philosopia-api/`)
- **Entry**: `server.js` — Express app, DynamoDB connectivity check (`DescribeTableCommand`, non-fatal), middleware setup, route registration
- **Routes** (`routes/`): REST endpoints registered under `/api/` (philosophers, periods, schools, concepts, beefs, works, quotes, artworks, auth, analytics). Relations are joined app-side by string business keys via `db/content.js`
- **`db/`**: the DynamoDB repository layer — `client.js` (DocumentClient singleton), `content.js` (content-table CRUD/joins), `analytics.js` (day-partition writes/queries), `users.js` (auth), `aliases.js` (`withFlatAliases` — derives legacy flat keys from nested `{en,he}` for API responses). `models/` no longer exists.
- **Middleware**: request logging, 5-min TTL server-side caching, JWT auth, rate limiting, health check at `GET /api/health` (pings DynamoDB)
- **Seeders** (`seeders/`): `masterSeed.js` orchestrates seeding into DynamoDB via `db/content.js`; enrichers fetch Wikipedia/Wikidata to fill philosopher bios and relations
- **Scripts** (`scripts/`): `setupTables.js` (idempotent table + TTL provisioning), `createAdmin.js` (seeds the default admin user)
- **ES Modules**: Uses `"type": "module"` — all imports use ESM syntax

### Frontend (`philosopia-site/`)
- **Entry**: `src/index.js` → `src/App.jsx` (React Router setup)
- **Routing**: All routes prefixed by language (`/en/*` or `/he/*`); base `/` redirects to `/en`
- **Pages** (`src/pages/`): One page component per route
- **Components** (`src/components/`): Reusable UI; `src/components/ui/` contains shadcn/ui primitives
- **Context** (`src/context/`): `AuthContext.jsx` (JWT admin auth), `ThemeContext.jsx` (dark/light)
- **i18n** (`src/i18n/`): `LanguageContext.jsx` provides EN/HE toggle; `texts.js` holds all translation strings
- **API layer** (`src/lib/api.js`): Axios wrapper with client-side localStorage caching (5-min TTL)
- **Analytics** (`src/utils/tracker.js`): Lightweight SPA tracker; batches events via `sendBeacon`; auto-tracks pageviews, exits, time-on-page
- **Path alias**: `@/` maps to `src/` (configured in `jsconfig.json`)

### Data Flow
1. React frontend calls `src/lib/api.js` (which checks localStorage cache first)
2. API requests hit `philosopia-api` with server-side 5-min cache
3. DynamoDB stores all data (content, analytics, users) — MongoDB Atlas is deprecated/decommissioned
4. Admin-only mutations go through JWT-protected routes

### Bilingual Architecture
- All content models store both EN and HE versions (e.g., `name.en` / `name.he`, `summary.en` / `summary.he`)
- Font config in `tailwind.config.js`: Playfair Display + Inter for EN; Frank Ruhl Libre + Heebo for HE
- RTL CSS applied automatically for Hebrew
- URL path (`/en` vs `/he`) drives the language context

### Philosopher Model (Core Entity)
The `Philosopher` record is the richest shape (canonical since the July 2026 refactor; becomes the DynamoDB item shape as-is):
- Bilingual text stored **only** as nested `{ en, he }` (`name`, `years`, `summary`, `keyIdeas`, `quotes`); flat `nameEn/nameHe/…` are derived read-only aliases for API compatibility
- Relations by string keys: `schoolId`, `periodId`; other entities point back via `philosopherId` / `relatedPhilosopherIds` — no ObjectId refs anywhere
- Wikipedia enrichment: `wikiTitle`, `wikiQid`, `bioHtml`, `wikiData.bioEn`, `wikiData.bioHe`, `imageUrl`
- Wikidata relations: `influencedBy`, `students`, `foundationalTexts`, `countryOfCitizenship`, `religion`
- Image priority: `manualImageUrl` → `enrichedImageUrl` → `imageUrl`

### Analytics System
- **Frontend**: `tracker.js` intercepts `pushState` and `popstate` to detect SPA navigation. Events are batched (1 s delay) and sent via `sendBeacon` on page exit.
- **Backend**: `POST /api/analytics/events` accepts up to 50 events per call, sanitizes inputs, and writes day-bucketed items to the `philosopia-analytics` DynamoDB table (PK = day, native TTL = 90 days) via `BatchWriteItem` in chunks of 25 (`db/analytics.js`).
- **Dashboard**: `GET /api/analytics/stats?days=N` queries one partition per day in parallel and computes the aggregations in app code (pageviews by page, totals, avg time on page, bounce rate by session, exit pages, top custom events, daily trend). Response JSON shape is identical to the old Mongo-aggregation version, so the admin dashboard needed no changes.

### Docker / Production
- Both services use multi-stage Docker builds (Node 22-alpine → nginx-alpine for frontend)
- In Docker, frontend sets `REACT_APP_API_BASE_URL=/api` and nginx proxies `/api/` to the API container
- In local dev, frontend reads `REACT_APP_API_BASE_URL` from `philosopia-site/.env` (default: `http://localhost:5000/api`)
- API listens on port 5000; frontend dev server on 3000; nginx serves on 80 in production

---

## Environment Variables

**`philosopia-api/.env`**:
```
PORT=5000

# --- DynamoDB (live database) ---
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<IAM user key — never commit>
AWS_SECRET_ACCESS_KEY=<IAM user secret — never commit>
DYNAMO_TABLE_PREFIX=philosopia
# DYNAMO_ENDPOINT=http://localhost:8000   # only when testing against DynamoDB Local
```

⚠️ The IAM access key currently in `.env` was shared in a chat session on 2026-07-02 for expedited setup — **rotate it** (create a new access key in IAM, update `.env`, delete the old key) once the migration work is done.

**`philosopia-site/.env`**:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

---

## Optional Future Work

These are ideas that were discussed or naturally follow from the current state of the project. None are planned yet — they're options.

### Content & Data
- **Re-enable Works and Quotes pages** — they're fully built, just toggled off in the nav. Uncomment the nav links and routes in `App.jsx` when content is ready.
- **Search** — a global search bar across philosophers, concepts, beefs, and schools. With DynamoDB, the pragmatic approach at this data size is an in-memory index in the API (the whole catalog is <100 KB); frontend can use a command-palette style UI (`cmdk`).
- **Philosopher relation graph** — visualize influenced-by/students connections as an interactive force-directed graph (D3.js or `react-force-graph`).
- **More beefs** — add more historical philosophical debates (e.g. Plato vs. Sophists, Kant vs. Hume, Sartre vs. Camus).
- **Concept linking** — connect concepts to philosophers and schools so browsing one surfaces the others.

### Admin & Content Management
- **Re-enable the admin auth guard** in `AdminDashboard.jsx` (the guard is commented out with a TODO).
- **Full CRUD for all entities** in the admin — currently only beefs have a manager. Add managers for philosophers, concepts, schools.
- **Image upload** — allow admins to upload custom philosopher images rather than relying on Wikipedia URLs.
- **Rich text editor** for bios and descriptions in the admin panel.

### UX & Design
- **Mobile navbar** — the current nav hides on mobile. Add a hamburger menu with a slide-out drawer.
- **Re-enable the Hero section** on the HomePage — it's fully designed but commented out (`HomePage.jsx`). Could be activated as a landing section.
- **Quotes stoa section** — also commented out in `HomePage.jsx`, could be a beautiful quotes browsing gateway.
- **Animated page transitions** with `framer-motion`.
- **Search-filtered timeline** — let users filter the philosopher timeline by school or concept tag.

### Analytics & Growth
- **User behavior events** — wire up `tracker.event()` calls on meaningful interactions (philosopher card clicks, beef reads, language switches).
- **Analytics export** — let admins export CSV from the dashboard.
- **Referrer tracking** — the data is already stored; surface it in the analytics dashboard.

### Technical
- **Test coverage** — add component tests for key pages (PhilosophersPage, HomePage, AdminDashboard).
- **SEO** — add `react-helmet-async` for per-page `<title>` and `<meta>` tags; structured data (JSON-LD) for philosopher profiles.
- **OpenGraph / social sharing** — dynamic OG images for philosopher profiles.
- **PWA** — add a service worker + manifest for offline support and installability.
- **Error boundary** — wrap the app with a React error boundary for graceful degradation.
- **API versioning** — prefix routes with `/api/v1/` for future compatibility.
