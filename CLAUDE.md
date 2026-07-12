# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the project's **architectural source of truth**.

---

## What Is Philosopia?

**Philosopia** is a bilingual (English/Hebrew) interactive encyclopedia of the history of philosophy — philosophers, schools, periods, concepts, artwork, and famous disagreements ("beefs") — aimed at curious people, not just academics. All content exists in both languages; URLs are prefixed `/en/` or `/he/`, fonts swap per language (Playfair Display/Inter for EN, Frank Ruhl Libre/Heebo for HE), and RTL layout applies automatically for Hebrew.

**Project snapshot (2026-07-10):**
- **66 philosophers, 100% bilingual coverage** — every one has an English *and* Hebrew Wikipedia-enriched bio.
- **In-memory bidirectional knowledge graph** — Wikidata relation QIDs resolve to internal profile slugs; reverse edges are inferred on the fly. No graph DB.
- Runtime database is **Amazon DynamoDB** (MongoDB is fully deprecated — see Data Layer below).
- Enrichment (Wikipedia/Wikidata) is an **offline, seed-time process** — no external API calls on the serving path.

---

## Current Architecture

Monorepo with two independent processes: an Express.js REST API and a React SPA. In dev they run simultaneously (two terminals, or `npm run dev` from the root via `concurrently`).

```
philosopia_site/
├── philosopia-api/     # Express.js REST API (backend, port 5001)
├── philosopia-site/    # React SPA (frontend, port 3000)
├── docker-compose.yml  # Orchestrates both services
└── package.json        # Root scripts using concurrently
```

### Backend (`philosopia-api/`)
- **Entry**: `server.js` — Express app, DynamoDB connectivity check (`DescribeTableCommand`, non-fatal), middleware setup, route registration.
- **Routes** (`routes/`): REST endpoints under `/api/` (philosophers, periods, schools, concepts, beefs, works, quotes, artworks, auth, analytics). No DB-side joins: relations are joined app-side by string business keys via `db/content.js` — `periods.js`/`schools.js` bucket philosophers by `periodId`/`schoolId`; `beefs.js`/`concepts.js`/`quotes.js`/`works.js` join via `getByIds` (BatchGet).
- **Middleware**: request logging, **server-side 5-min TTL cache**, JWT auth (admin-only mutations), rate limiting, health check at `GET /api/health` (pings DynamoDB).
- **Seeders** (`seeders/`): `masterSeed.js` orchestrates seeding via `db/content.js`; enrichers fetch Wikipedia/Wikidata (see Enrichment Pipeline).
- **Scripts** (`scripts/`): `setupTables.js` (idempotent table + TTL provisioning), `createAdmin.js` (default admin user), `validateSeedData.js` (seed-id guard), `enrichPhilosophers.js` (targeted enrichment).
- **ES Modules** throughout (`"type": "module"`).

### Frontend (`philosopia-site/`)
- **Build tool: Vite** (migrated from Create React App 2026-07-10). `vite.config.js` holds the React plugin, the `@` → `src/` alias (mirrors `jsconfig.json`, kept for editor intellisense), dev-server port 3000, and (since 2026-07-11) a **dev-server proxy** forwarding `/api` → `http://localhost:5001` — the app calls relative `/api/...` URLs everywhere, so requests are same-origin in dev (proxy) and in production (nginx); no CORS. `index.html` lives at the package root (Vite convention); build output is `dist/`. Env vars must be prefixed `VITE_` and read via `import.meta.env` — `process.env.*` is not available in the browser bundle.
- **Entry**: `index.html` → `src/index.jsx` → `src/App.jsx` (React Router; all routes language-prefixed `/en/*` / `/he/*`, base `/` redirects to `/en`).
- **Pages** (`src/pages/`): one component per route. **Components** (`src/components/`): reusable UI; `src/components/ui/` holds shadcn/ui primitives.
- **Context**: `AuthContext` (JWT admin auth), `ThemeContext` (dark/light); **i18n**: `LanguageContext` + `texts.js` for all translation strings.
- **Data fetching: React Query** (`@tanstack/react-query`, adopted 2026-07-10). `QueryClientProvider` wraps the app in `src/index.jsx` (defaults: `staleTime` 5 min to match the server cache, `retry: 1`, no refetch-on-focus). **All server reads go through the hooks in `src/hooks/queries.js`** (`usePhilosopher`, `usePhilosophersList`, `useSchools`, `useBeefs`, …, plus `useAdminStats` and the `useCreateBeef`/`useDeleteBeef` mutations, which invalidate `['beefs']` on success). `src/lib/api.js` is now a thin axios fetcher used only by the hooks — the old hand-rolled localStorage/sessionStorage cache (`src/lib/cache.js`) is deleted, and no page calls axios directly anymore (exception: the `AuthContext` login POST). When adding a fetch call-site, add a hook to `queries.js` — don't re-introduce raw axios in components.
- **Global search** (`src/components/GlobalSearch.jsx`, added 2026-07-10): ⌘K/Ctrl+K command palette (`cmdk`) + navbar trigger, fuzzy search (`fuse.js`) over philosophers/schools/concepts/beefs in both languages (keys: names ×3, enwiki-title alias ×2, summaries ×1). The index is a `useSearchIndex(enabled)` hook — four parallel fetches, only fired when the palette first opens, cached 10 min. Results are grouped by type; selection navigates to `/{lang}/{route}/{id}`. Styled with standard shadcn token classes (the dialog portals to `<body>`, which is safe because the theme variables live on `:root`/`.dark`).
- **Relation graph viz** (`src/components/RelationshipGraph.jsx`, added 2026-07-10; since 2026-07-12 it is **no longer a standalone route** — it renders as the `?view=graph` view of the Philosophers page, `GraphPage.jsx` is deleted, the navbar "Graph" link is removed, and `/{lang}/graph` redirects via `<Navigate>` to `/{lang}/philosophers?view=graph` so old links keep working): `react-force-graph-2d` over `useGraphNetwork()` (the `/philosophers/graph/network` endpoint). Nodes are colored by **school of thought** by default (2026-07-12: golden-angle hue rotation over the sorted schoolIds present in the data — no hand-curated palette; legend labels come from `useSchools()`, falling back to prettified ids), with the original **era coloring** (hue map over the canonical periodIds — see Gotchas) selectable in the control bar; the legend follows the active mode. Sizing is uniform unless the **Highlight Influence** toggle is on, which scales node area by total degree — computed at draw time in `nodeRadius()`, so toggling never rebuilds data or layout. Labels appear on zoom or hover. Canvas colors are resolved from the shadcn CSS variables at render, keyed on `theme` from `ThemeContext`, so the graph re-colors on toggle. Hover previews a node's neighborhood and **single-click focuses it** (2026-07-12) — a sticky 1-hop spotlight that dims everything else, cleared by clicking the node again or the background; focus and hover share one pipeline (`activeNode = focusNode || hoverNode`), so the dim/highlight/label logic has no focus-specific branches. **Double-click navigates to the profile** (single-click navigation moved to make room for focus). Inferred links draw **dashed**; arrows point influencer → influenced. **Group by School** (control bar) registers a hand-rolled cluster force (`makeClusterForce`: per-tick velocity nudge toward per-school anchors on a circle — no direct d3-force import) and weakens link strength to 0.06 while active (d3's default accessor is captured once and restored on toggle-off) so school islands can separate from the densely cross-linked core; it reheats only when the toggle flips. **Drag-to-pin** (2026-07-11): `onNodeDragEnd` fixes the dropped node in place (`fx`/`fy` — the library otherwise releases them on drop, snapping the node back), marked by a dashed halo drawn in `drawNode` (also visible mid-drag as a preview); `onNodeRightClick` clears the pin and reheats the simulation; the cursor flips to `grabbing` during a drag. **Physics tuning** (same day): a `fgRef` effect sets charge strength −180 / link distance 60 (d3 defaults −30/30) so the network spreads readably out of the box, with a one-time `zoomToFit` per dataset on engine stop and `cooldownTicks` 200. ⚠️ Two invariants: **all** force settings — the base tuning *and* the cluster-force/link-strength override — are re-applied **idempotently on every effect run** (keyed on `graphData` *and* `size.width`) because a remounted canvas is a fresh force-graph instance with default forces (reheats only fire per new dataset / toggle flip); and the container measure **ignores zero-width readings** (hidden/collapsed container) so the canvas never unmounts — a remount would silently discard pins, zoom, and tuned forces. The graph mutates its data, so the hook's response is deep-copied before being handed to the lib. Known dev-console noise: `react-kapsule` (the lib's wrapper) triggers React's "deps array changed size" warning — library-internal, dev-only, no production impact.
- **Philosophers timeline** (`TimelineView` inside `src/pages/PhilosophersPage.jsx`; redesigned 2026-07-12): the page's segmented view switcher — synced to `?view=`, so each view is bookmarkable — offers **timeline** (default) | **grid** | **graph** (the relation graph, see below). The timeline itself is a classic vertical-axis historical timeline — a central gradient axis with **compact cards alternating sides on desktop** (`md+`, life years ride the axis opposite each card) and an **inline-start rail with stacked cards on mobile** (years as an in-card badge instead); era sections with sticky heroes, scroll-spy sidebar, and the detail modal are unchanged. Styled entirely with shadcn token classes (the old hardcoded `amber`/`slate`/`orange` card palette is gone from the stream) and logical properties (`start-*`/`end-*`, `ms`/`me`) so it mirrors correctly in RTL. **Philosophers are sorted chronologically within each period** (oldest birth first) by `birthYearOf()` in the same file — parses the birth year out of `yearsEn` handling every format in the data: `"624–546 BCE"` (one trailing era marker governs both ends), `"121–180 AD"`, bare-CE `"1138–1204"`, mixed-era `"4 BCE – 65 AD"`, circa `"c. 310–235 BCE"`, and `"5th Century BCE"` (→ mid-century estimate); BCE maps to negative years, ties break by `nameEn`, unparseable sorts last. The sort lives in the frontend `eras` memo — `GET /api/periods` still returns philosophers unsorted (DynamoDB scan order).
- **Analytics** (`src/utils/tracker.js`): SPA tracker, batches events via `sendBeacon`.
- **Path alias**: `@/` → `src/` (`jsconfig.json`).
- **Theming**: `tailwind.config.js` — `darkMode: ["class"]` + the full shadcn color/radius token mapping over the CSS variables in `src/index.css` (`:root` = light "The Library", `.dark` = dark "The Cave"; `ThemeContext` toggles the class on `<html>` and persists to localStorage). It also carries the bilingual font setup. **Use the token classes** (`bg-card`, `text-muted-foreground`, …) for anything that must follow the theme — they work everywhere, including portaled content.

### Data Flow
1. React components call React Query hooks (`src/hooks/queries.js`) — deduped, cached 5 min, retried.
2. API serves from DynamoDB behind a server-side 5-min cache.
3. All external enrichment (Wikipedia/Wikidata) happened earlier, offline, at seed time.
4. Admin-only mutations go through JWT-protected routes.

### Philosopher Model (core entity)
- Bilingual text stored **only** as nested `{ en, he }` (`name`, `years`, `summary`, `keyIdeas`, `quotes`). Flat keys (`nameEn`, `nameHe`, …) are **derived, read-only aliases** added by `db/aliases.js` (`withFlatAliases`) on the way out of the API — never store them.
- Relations by string keys: `schoolId`, `periodId`; other entities point back via `philosopherId` / `relatedPhilosopherIds`. No ObjectId refs anywhere.
- Wikipedia enrichment fields: `wikiTitle`, `wikiQid`, `bioHtml` (EN), `wikiData.bioHe` (HE), `imageUrl`, `lastEnriched`.
- Wikidata relation fields: `influencedBy`, `students`, `foundationalTexts`, `countryOfCitizenship`, `religion` — arrays of `{ qid, labelEn, labelHe }`.
- Image priority: `manualImageUrl` → `enrichedImageUrl` → `imageUrl`.

---

## Data Layer & Knowledge Graph

### DynamoDB (runtime database)

**Migration completed July 2026. MongoDB is FULLY DEPRECATED** — the Atlas cluster was unreachable and is being decommissioned (its DB user should be revoked). Mongoose and the `mongodb` package are uninstalled; `philosopia-api/models/` is deleted. **Do not reintroduce Mongoose.** Region `us-east-1`, AWS SDK v3 (`@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb`), on-demand billing.

| Table | Partition key | Sort key | Notes |
|---|---|---|---|
| `philosopia-content` | `entityType` (S) | `id` (S) | All 8 content entity types (philosopher, school, period, concept, beef, work, quote, artwork) |
| `philosopia-analytics` | `day` (S, `YYYY-MM-DD`) | `ts` (S, ISO timestamp + suffix) | Native TTL on `expiresAt` (epoch seconds, 90-day expiry) |
| `philosopia-users` | `username` (S) | — | Admin auth; bcrypt hash (hashing lives in `authRoutes.js` / `scripts/createAdmin.js`) |

The repository layer (`philosopia-api/db/`):
- **`client.js`** — `DynamoDBDocumentClient` singleton; loads `.env` regardless of caller cwd. `DYNAMO_ENDPOINT` overrides the endpoint for DynamoDB Local.
- **`content.js`** — content-table repository: `listByType`, `getById`, `getByIds` (BatchGet), `put`, `putMany` (BatchWrite, 25/chunk with retry on `UnprocessedItems`), `deleteById`.
- **`analytics.js`** — day-partition writes/queries. **`users.js`** — get/put for auth.
- **`aliases.js`** — `withFlatAliases()` / `withFlatAliasesList()`: derives the legacy flat keys from nested `{ en, he }` so the frontend needed zero changes after the migration.
- **`philosopherGraph.js`** — the knowledge graph (below).

All Mongo-era response JSON shapes were preserved, verified endpoint-by-endpoint. Known leftover: `quotes.js`/`works.js`/`artworkRoutes.js` add a synthetic `_id: item.id` for frontend compatibility — safe to drop once the frontend uses `id` directly.

### Knowledge graph (`db/philosopherGraph.js`, added 2026-07-10)

An in-memory, bidirectional relation graph — deliberately **no graph DB**; the catalog is ~66 records (<100 KB).

- **QID → slug map:** on first use it scans all philosophers and builds a `Map<wikiQid, philosopher>`. The map is **rebuilt every 5 minutes** (matches the route-cache TTL, picks up re-seeds without a restart); an in-flight-promise guard makes concurrent builds share one table scan.
- **Resolution:** `withResolvedRelations(philosopher)` — applied in `GET /api/philosophers/:id` — decorates each `influencedBy`/`students` entry whose QID belongs to one of our own philosophers with a `philosopherId` slug.
- **Inferred reverse edges**, marked `inferred: true`, synthesized on the fly (deduped by QID against stated edges):
  - X's `students` lists me → X joins my `influencedBy` (X taught me).
  - X's `influencedBy` lists me → X joins my `students` (X follows me).
  - Example: Socrates shows Aristotle/Nietzsche/Popper as followers even though Wikidata only states each edge from the other side.
- **Frontend contract:** `WikidataList` in `PhilosopherPage.jsx` renders entries with `philosopherId` as `<Link>` chips to `/{lang}/philosophers/{slug}` (solid border; **dashed** border when `inferred`), and entries without one as inert text chips. ~198 of ~670 stored relation edges resolve internally.
- The list endpoint (`GET /api/philosophers`) is intentionally **not** decorated, to keep list payloads light.
- **Graph network endpoint** (`GET /api/philosophers/graph/network`, added 2026-07-10): `buildNetwork()` in `philosopherGraph.js` returns `{ nodes, links }` for the whole catalog — 66 nodes (id, bilingual names, periodId/schoolId, years) and ~195 directed links `source → target` (source influenced target), deduped across the two Wikidata properties. `link.inferred: true` marks edges attested only by the teacher's `students` (P802) with no `influencedBy` (P737) back-claim — exactly the edges the target's profile shows as dashed chips. ⚠️ The route is registered **before** `/:id` in `routes/philosophers.js` — keep it there or Express swallows "graph" as a philosopher id.

---

## Enrichment Pipeline (offline / seed-time only)

Nothing on the serving path calls Wikipedia or Wikidata — enrichment runs offline and persists into DynamoDB.

- **`seeders/universalEnricher.js`** — the core. For a given `(wikiQid, wikiTitle)`:
  1. EN bio + portrait: `en.wikipedia.org/api/rest_v1/page/summary/<wikiTitle>` → `bioHtml`, `imageUrl`.
  2. **HE bio**: resolves the Hebrew article via the item's Wikidata `hewiki` sitelink (`wbgetentities` → `sitelinks.hewiki.title`), then fetches the `he.wikipedia.org` REST summary → returned as `bioHtmlHe`, stored as `wikiData.bioHe`.
  3. Relations via Wikidata SPARQL (`P737` influencedBy, `P802` students, `P27` citizenship, `P800` foundationalTexts, `P140` religion), with EN + HE labels. (`P800` "notable work" replaced `P1343` "described by source" on 2026-07-10 — see Data Issue History.)
- **`seeders/enrichAllPhilosophers.js`** — full sweep, 1 s delay between philosophers. ⚠️ Long-running; if run as a harness background task it can be killed at the ~2-min default timeout — prefer chunked targeted runs.
- **`scripts/enrichPhilosophers.js <id> [...ids]`** — targeted enrichment (same per-item logic). **Use this after adding a new philosopher**, and as the cleanup pass after a sweep.

**Rate limiting (HTTP 429):** the Wikipedia/Wikidata `api.php` and REST endpoints throttle aggressively under sweep cadence. `getWikipediaData` and `getHebrewWikiTitle` retry all non-404 failures with linear backoff (5s/10s/15s, up to 4 attempts) and treat throttled non-JSON bodies as retryable rather than "no data". A sweep can still leave a few gaps — finish by re-running the targeted enricher for any item with empty `bioHtml`/`bioHe`.

**Overwrite semantics:** the enrich scripts only overwrite a field when the newly fetched value is non-empty. That prevents transient API failures from wiping good data, but it also means **stale/wrong values survive re-enrichment unless cleared first** (this bit us with wrong-QID relations — clear the affected fields, then enrich).

### QID integrity — hard-won lessons

- **Wrong-person QIDs** (found & fixed 2026-07-09): an audit comparing each stored `wikiQid` against the QID its `wikiTitle` resolves to (enwiki `pageprops.wikibase_item`) found **19 wrong values** — most egregiously `rene_descartes` pointed at Q6527 (Rousseau), so his Hebrew bio came out as Rousseau's. All 19 fixed in `philosophers.json` + DynamoDB; the QID-derived relation fields were cleared and re-enriched.
- **Disambiguation-page QIDs** (found & fixed 2026-07-10): `xunzi` pointed at Q21072863 — the enwiki "Xunzi" **disambiguation page**, not the philosopher (Q216072, `Xunzi (philosopher)`). His `bioHtml` was "may refer to…" junk and he *appeared* to lack a Hebrew article (the disambiguation item has no `hewiki` sitelink; the real item does). **The QID-vs-title audit cannot catch this class** — stored and derived QIDs *agree* on the disambiguation page.

**Checklist for adding a new philosopher:**
1. Add the record to `data/philosophers.json` with canonical snake_case id, `wikiTitle`, `wikiQid` (⚠️ preserve CRLF — see Gotchas).
2. Verify the QID: the enwiki `wikiTitle` must resolve to the same `wikiQid` (`pageprops.wikibase_item`), and its `pageprops` must **not** have the `disambiguation` flag.
3. `npm run validate:data` (also runs automatically as step 0 of `masterSeed.js`; its `KNOWN_MISSING` allowlist is empty — any unknown id fails the seed).
4. Seed, then `node scripts/enrichPhilosophers.js <id>`; eyeball `bioHtml` for "may refer to".

---

## Bilingual State & UI Fallback

- **Coverage: 66/66.** Every philosopher has `bioHtml` (EN) and `wikiData.bioHe` (HE), verified 2026-07-10. Every record also has a curated bilingual `summary` and `name`/`years` in both languages.
- **Profile-page fallback chain** (`PhilosopherPage.jsx`): the bio section renders the rich Wikipedia HTML for the active language (`wikiData.bioHe` in Hebrew, `bioHtml` in English). If missing (a future not-yet-enriched record), it falls back to the **same-language** plain-text `summary` (rendered as escaped text, not HTML), then to a localized "not available" message. It deliberately **never falls back across languages** — an English paragraph inside the RTL layout reads as broken.
- Language is driven by the URL prefix; `dir="rtl"` is applied for Hebrew; relation chips show `labelHe` with `labelEn` fallback (external entities sometimes lack Hebrew labels on Wikidata).

---

## Analytics System

- **Frontend**: `tracker.js` intercepts `pushState`/`popstate` for SPA navigation; events batch (1 s) and flush via `sendBeacon` on exit.
- **Backend**: `POST /api/analytics/events` accepts ≤50 events/call, sanitizes, writes day-bucketed items (PK = day, TTL 90 days) via BatchWrite in chunks of 25 (`db/analytics.js`).
- **Dashboard**: `GET /api/analytics/stats?days=N` queries one partition per day in parallel and aggregates in app code (pageviews, totals, avg time on page, bounce rate, exit pages, top events, daily trend). Response shape is identical to the Mongo-era version.

---

## Commands

### Development (from root)
```bash
npm run install:all   # Install all dependencies for both workspaces
npm run dev           # Run API + frontend concurrently
npm run start:api     # API only (port 5001)
npm run start:site    # Frontend only (port 3000)
npm run seed          # Seed the DynamoDB database (validates ids first)
```

Two-terminal equivalent (what README.md documents for humans): `cd philosopia-api && npm run dev` and `cd philosopia-site && npm start`.

### Backend (from philosopia-api/)
```bash
npm run dev            # nodemon dev server at port 5001
npm start              # Production start
npm run setup:tables   # One-off: create the 3 DynamoDB tables + analytics TTL (idempotent)
npm run seed:all       # masterSeed.js — seeds everything
npm run validate:data  # Cross-check philosopher ids in quotes/beefs/seed_library vs philosophers.json
node scripts/enrichPhilosophers.js <id> [...ids]   # Targeted enrichment
```

### Frontend (from philosopia-site/)
```bash
npm start             # Vite dev server at localhost:3000
npm run build         # Production build → dist/
npm run preview       # Serve the production build locally
```
There is currently **no test runner** (react-scripts/Jest went away with the Vite migration; Vitest is the planned replacement — `src/setupTests.js` and the @testing-library deps were kept for it).

### Docker
```bash
docker-compose up     # Build and start both containers
docker-compose up -d  # Detached
```

---

## Docker / Production

- Multi-stage builds for both services (Node 22-alpine; frontend served by nginx-alpine).
- In Docker the frontend is built with `VITE_API_BASE_URL=/api` and nginx proxies `/api/` to the API container on **5001** (frontend waits for the API healthcheck). ⚠️ The container port follows the API's `.env` (`env_file` in `docker-compose.yml`) — `PORT`, the compose `expose`/healthcheck, and `nginx.conf`'s `proxy_pass` must all agree. The Dockerfile copies Vite's `dist/` output (not CRA's `build/`).
- Local dev: API on 5001, frontend dev server on 3000; nginx serves on 80 in production.

---

## Environment Variables

**`philosopia-api/.env`**:
```
PORT=5001

# --- DynamoDB (live database) ---
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<IAM user key — never commit>
AWS_SECRET_ACCESS_KEY=<IAM user secret — never commit>
DYNAMO_TABLE_PREFIX=philosopia
# DYNAMO_ENDPOINT=http://localhost:8000   # only for DynamoDB Local

# --- Auth ---
JWT_SECRET=<long random string — never commit; REQUIRED, no code fallback (auth fails closed without it)>
```

(~~Rotate the IAM access key~~ — closed **without rotation** 2026-07-11: the key in `.env` was shared in a chat session on 2026-07-02 for expedited setup. **Risk acknowledged and accepted by the owner for the existing active key**, which remains in service. Do not re-raise this as a pending task; if the decision is ever revisited, rotation = create a new key in IAM, update `.env`, delete the old one. ⚠️ Never write the actual key id or secret into this file or any tracked file.)

**`philosopia-site/.env`**:
```
VITE_API_BASE_URL=/api
```
(Relative since 2026-07-11: the Vite dev proxy forwards `/api` → `http://localhost:5001` and production nginx does the same-origin routing, so the browser never makes a cross-origin request. The code fallbacks in `src/lib/api.js` and `src/utils/tracker.js` default to `/api` too, making this var optional — set an absolute URL only to point the frontend at a non-proxied API. `AuthContext`'s login POST also uses the shared `API_BASE_URL` now; its hardcoded `localhost:5000` URL would have broken admin login behind nginx. The CRA-era `REACT_APP_API_BASE_URL` and the `NODE_OPTIONS=--openssl-legacy-provider` workaround are gone — Vite needs neither.)

---

## Gotchas & Invariants

- ⚠️ **CRLF line endings:** `data/philosophers.json` and `data/periods.js` are 100% CRLF. Never re-serialize or whole-file-normalize them — patch with byte-exact string edits, and verify the CRLF count is unchanged (± intended new lines) after programmatic edits.
- ⚠️ **`seeders/seed_library.js` executes at module top level** — importing it runs the seeding.
- ⚠️ **Enrich scripts don't overwrite with empty values** — clear stale fields before re-enriching if the source data was wrong.
- **`.env` is gitignored and not copied into git worktrees** — copy it from the main checkout before running anything in a worktree.
- **Why the API runs on port 5001, not 5000:** macOS AirPlay Receiver (`ControlCe` process) squats port 5000 on this machine, and the owner keeps it enabled. The API therefore runs on **5001** everywhere (2026-07-11): `.env` `PORT=5001`, the `server.js` fallback, the Vite proxy target, and the Docker `expose`/healthcheck + nginx `proxy_pass` — these five must stay in sync; **never move any of them back to 5000**. If the API won't bind, check `lsof -nP -iTCP:5001`.
- **Never store flat bilingual keys** (`nameEn`, …) — they are derived by `db/aliases.js` at the API boundary. The nested `{ en, he }` shape is canonical.
- **Do not reintroduce Mongoose/MongoDB.**
- Chinese philosophers (Confucius, Mencius, Xunzi) deliberately use non-existent `periodId`/`schoolId` values (`spring_and_autumn_period`/`warring_states` + `confucianism`) to keep them off the Western timeline grouping.
- **periodId canon** (cleaned up 2026-07-10): the canonical ids are exactly those in `data/periods.js` — `pre_socratic`, `classical_period`, `hellenistic_period`, `medieval_period`, `renaissance_period`, `early_modern_period`, `modern_period`, `contemporary_period` (plus the two deliberately non-existent Chinese ids). Note the classical era is **`classical_period`**, not `classical_greek` — a wrong `classical_greek` entry in TimelineView's allowlist kept the entire Classical era (Socrates/Plato/Aristotle/Antisthenes) off the timeline until 2026-07-10. The noncanonical record values `modern`, `contemporary`, `enlightenment` were normalized the same day (see Data Issue History).

---

## Data Issue History (all resolved)

- **Philosopher id mismatches** (fixed 2026-07-08/09): `data/beefs.js`, `data/quotes.js`, and `seeders/seed_library.js` referenced short ids (`descartes`) that didn't match the canonical ids in `philosophers.json` (`rene_descartes`), silently skipping records during seeding. All renamed; four formerly-missing philosophers (Aquinas, Husserl, Machiavelli, Confucius) added with full records; `renaissance_period` (1400–1600) added to `data/periods.js` for Machiavelli. Guarded forever by `validateSeedData.js` (step 0 of the seed, empty allowlist).
- **Hebrew bios dead code → live** (2026-07-09/10): the enrichers checked for `bioHtmlHe` but `universalEnricher.js` never produced it. Implemented via `hewiki` sitelink + HE REST summary; backfilled to 66/66.
- **19 wrong QIDs** (2026-07-09) and the **xunzi disambiguation-page QID** (2026-07-10) — see QID integrity above. The xunzi fix also replaced his "Stub created by Beef Seeder" placeholder summary and his Hebrew name `שון דזה` (one letter from Sun Tzu's `סון דזה`) with `שו'ן קואנג` + a real bilingual summary and years.
- **periodId normalization + timeline allowlist fix** (2026-07-10): 8 records carried noncanonical periodIds — `modern` ×5 (Bergson, Einstein, Heidegger, Cassirer, Popper) and `contemporary` ×2 (Chomsky, Foucault) → `contemporary_period` (matching the Husserl/Wittgenstein precedent); `enlightenment` ×1 (Hume) → `early_modern_period`. Fixed in `philosophers.json` (byte-exact, CRLF preserved) + DynamoDB. `classical_period` turned out to be canonical all along — the real bug was TimelineView's allowlist naming a non-existent `classical_greek`, which silently dropped the whole Classical era from the timeline; fixed in `PhilosophersPage.jsx`, and the graph's era maps were simplified to canonical ids. A same-day curatorial pass also moved **Kant** (1724–1804) and **Berkeley** (1685–1753) from `modern_period` to `early_modern_period` and **Derrida** (1930–2004) to `contemporary_period` for strict year-range accuracy. Final buckets: early_modern 10, modern 6, contemporary 15.
- **P1343 → P800 foundational texts** (fixed 2026-07-10): the enricher mapped Wikidata **P1343 "described by source"** to `foundationalTexts`, so 65/66 profiles listed encyclopedias that *describe* the philosopher ("Meyers Konversations-Lexikon", museum tagging vocabularies…) under "Major Texts". Fixed to **P800 "notable work"** in `universalEnricher.js` (SPARQL + propertyMap), all stored arrays cleared first (overwrite semantics), all 66 re-enriched. Result: 44/66 have real works (Plato: 38 dialogues; Kant: the three Critiques; Aristotle: Organon/Metaphysics/…); the 22 empty ones are faithful to Wikidata (Socrates and Pyrrho wrote nothing, Epictetus was transcribed by Arrian, most pre-Socratics survive only in fragments). The seed JSON never held the junk — `foundationalTexts` is empty/absent there; enriched relations live only in DynamoDB.
- **schoolId normalization** (fixed 2026-07-12): the graph's school legend exposed near-duplicate and orphan `schoolId` values — `analytic` (Chomsky, Popper) vs `analytic_philosophy` (Wittgenstein), `continental` (Bergson) vs `continental_philosophy`, plus five ids with no school record: `phenomenology` (Husserl, Heidegger), `post_structuralism` (Foucault, Derrida), `neo_kantianism` (Cassirer), `political_realism` (Machiavelli), `science` (Einstein). Fixed by remapping 9 philosopher records onto the canonical set — Chomsky/Popper → `analytic_philosophy`; Bergson + the continental sub-movements (Husserl, Heidegger, Foucault, Derrida, Cassirer) → `continental_philosophy`; Einstein → `philosophy_of_science` — and adding two school records where nothing canonical fit: `political_realism` (renaissance_period) and `philosophy_of_science` (modern_period), in `data/schools.js` + DynamoDB (mirrors the renaissance_period precedent). Applied byte-exact (CRLF preserved) to `philosophers.json`/`schools.js` and to DynamoDB. Result: 26 schools, every philosopher bucketed by `GET /api/schools` except the 3 intentional `confucianism` records, and the graph legend shows exactly one entry per school.

---

## Roadmap & Tech Debt

**Pre-launch checklist: 100% closed (2026-07-11).** Every outstanding pre-launch item is either resolved or intentionally deferred with the risk explicitly accepted by the owner — IAM key rotation (see the note in Environment Variables) and the default admin password (see Next features below). Everything remaining in this section is post-launch improvement, not a launch blocker.

### Near-term priorities
1. **Set up Vitest** — the Vite migration removed the Jest runner; `src/setupTests.js` + @testing-library deps are in place waiting for it.
2. **Delete dead frontend files** — `src/pages/PeriodsPage.jsx` (unrouted; `/periods` redirects to the philosophers timeline) and `src/components/PhilosophyTimeline.jsx` (unimported) are superseded by `TimelineView` inside `PhilosophersPage.jsx`. They still contain the old raw-axios pattern; delete rather than maintain.

(~~Complete the shadcn/Tailwind token mapping~~ — ✅ done 2026-07-10: `tailwind.config.js` now has `darkMode: ["class"]` (matches the ThemeToggle's `dark`/`light` class on `<html>`) and the standard shadcn `colors`/`borderRadius` mapping over the CSS variables in `src/index.css`. This **activated** every previously-no-op `bg-card`/`border-border`/`text-muted-foreground`-style class app-wide — verified page-by-page in both themes (cards gained their intended Almond/Obsidian backgrounds, relation chips their gold primary). `GlobalSearch.jsx`'s arbitrary-value workaround was reverted to standard token classes. Note: `prose`/`dark:prose-invert` classes on the bio sections are still no-ops — `@tailwindcss/typography` was never installed; install it if bio typography needs work.)

(~~Fix `P1343` → `P800` for foundational texts~~ — ✅ done 2026-07-10, see Data Issue History.)
(~~Migrate the frontend CRA → Vite~~ — ✅ done 2026-07-10: `react-scripts` and the `--openssl-legacy-provider` crutch removed, `vite.config.js` added, entry renamed `index.jsx`, env vars renamed `VITE_*`/`import.meta.env`, Dockerfile updated to `dist/`, dead CRA scaffolding deleted (stub `App.js`, `App.test.js`, `logo.svg`, `reportWebVitals`). Build: ~0.8 s.)
(~~Adopt React Query for data fetching~~ — ✅ done 2026-07-10: `QueryClientProvider` in `index.jsx`, all reads via `src/hooks/queries.js` hooks, admin beef mutations with `['beefs']` invalidation, hand-rolled `lib/cache.js` deleted, 14 components refactored off raw axios/`useEffect`. Also fixed a latent admin bug: BeefManager's create sent `philA.data._id` — undefined since the Dynamo migration — instead of the string ids the route expects.)

### Next features (in rough priority order)

(~~Rotate the default admin password~~ — **intentionally deferred** by owner decision 2026-07-11: `scripts/createAdmin.js` still seeds `admin/password123` and the live credential is unchanged — no code or database changes were made. The auth guard and JWT hardening are done; the default credential is a known, owner-accepted gap. Do not re-raise as a launch blocker; rotate whenever the owner chooses.)

(~~Re-enable built-but-hidden surfaces~~ — ✅ done 2026-07-10: Works ("The Library") & Quotes ("The Oracle") pages back in the nav + routes, HomePage Hero ("Step Out of the Cave") and quotes-stoa sections uncommented.)
(~~Stoa `?tag=` deep links~~ — ✅ done 2026-07-10: QuotesPage's active tag now lives in the URL via `useSearchParams` (case-insensitive match, two-way sync — chip clicks write the URL, "All" clears it). The Stoa chips were re-pointed from the non-existent Meaning/Politics tags to real ones: Ethics/Wisdom/Knowledge.)
(~~Re-enable the admin auth guard~~ — ✅ done 2026-07-10: `AdminDashboard.jsx` redirects unauthenticated visitors to `/login` and renders nothing meanwhile. Backend hardened at the same time: the `|| 'secret'` JWT fallback was removed from `authMiddleware.js`/`authRoutes.js` — before this, **anyone could forge a valid admin token** with the known fallback; verified a token signed with `'secret'` now gets 401. A strong `JWT_SECRET` was generated into `philosopia-api/.env`; with it unset the system fails closed.)

### Backlog (unchanged ideas)
- More beefs (Plato vs. Sophists, Kant vs. Hume, Sartre vs. Camus); concept↔philosopher/school linking.
- Admin: full CRUD for all entities, image upload, rich-text editor.
- UX: mobile navbar (hamburger + drawer), framer-motion page transitions, school/concept-filtered timeline.
- Analytics: wire `tracker.event()` on meaningful interactions, CSV export, surface referrer data.
- Technical: component tests for key pages, SEO (`react-helmet-async`, JSON-LD), OG images, PWA, error boundary, `/api/v1/` versioning, drop the synthetic `_id` compat field once the frontend uses `id`.

---

## Feature Status

| Feature | Status |
|---|---|
| Home page (bento grid, spotlight, featured beef, About) | ✅ Done |
| Philosophers — grid view (paginated cards + AlphaNav letter filter) | ✅ Done |
| Philosophers — timeline view (vertical-axis design, chronological sort, era sidebar, scroll-spy, detail modal) | ✅ Done (redesigned 2026-07-12) |
| Philosopher profile page (bilingual rich bios + linked relation chips) | ✅ Done |
| Knowledge graph cross-links (resolved + inferred relation chips) | ✅ Done (2026-07-10) |
| Schools, Concepts, Beefs, Art & Philosophy, About pages | ✅ Done |
| Works ("The Library") / Quotes ("The Oracle") pages | ✅ Done (re-enabled 2026-07-10) |
| HomePage Hero + quotes-stoa sections | ✅ Done (re-enabled 2026-07-10) |
| Admin login + dashboard (Statistics tab, Beef Manager tab) | ✅ Done (auth guard live 2026-07-10; JWT fallback secret removed) |
| Analytics tracker + ingestion + stats dashboard | ✅ Done |
| Docker multi-stage builds (API + nginx frontend) | ✅ Done |
| Bilingual RTL/LTR layout, dark/light theme | ✅ Done |
| Global search (⌘K palette, fuzzy bilingual, client-side index) | ✅ Done (2026-07-10) |
| Relation graph visualization (Philosophers page `?view=graph`; force-directed; school/era coloring + legend, influence sizing, click-to-focus spotlight, group-by-school clustering; old `/{lang}/graph` URL redirects) | ✅ Done (2026-07-10; analytical toolset 2026-07-12) |
