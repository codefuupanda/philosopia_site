# Philosopia

**Philosopia** is a bilingual (English / Hebrew) interactive encyclopedia of the history of philosophy. It makes philosophy accessible to curious people — not just academics — by presenting philosophers, their ideas, their schools of thought, and their famous disagreements in a clean, engaging web experience, fully available in both English and Hebrew.

## Key Features

- **Rich bilingual biographies — 66/66 coverage.** Every philosopher has a full English *and* Hebrew biography, auto-enriched from Wikipedia/Wikidata (portraits, life years, influences, students, citizenship), with a curated bilingual summary as a graceful fallback.
- **True bilingual UI (RTL/LTR).** All content is stored in English and Hebrew; URLs are prefixed `/en/` or `/he/`, fonts swap per language (Playfair Display/Inter for EN, Frank Ruhl Libre/Heebo for HE), and right-to-left layout applies automatically for Hebrew.
- **Interactive relationship graph.** Philosopher relations from Wikidata are resolved against our own catalog: teachers, influences, students, and followers render as clickable chips that navigate between profiles, and a **force-directed influence map** (`/graph`) visualizes the whole network — era-colored nodes sized by influence, hover-highlighted neighborhoods, dashed inferred edges, and click-through to profiles, fully theme- and RTL-aware. Reverse edges are inferred automatically — Socrates shows Aristotle and Nietzsche among his followers even though Wikidata only states the relation from their side. No graph database required — the whole graph lives in memory.
- **Global search (⌘K).** A command palette over the whole catalog — philosophers, schools, concepts, and beefs — with fuzzy matching in both English and Hebrew, grouped results, and keyboard-first navigation.
- **Philosophical "Beefs".** Historical disagreements (e.g. Rationalism vs. Empiricism) framed in a fun, engaging way.
- **Timeline & schools.** A chronological philosopher timeline from the Pre-Socratics to the 20th century, plus schools-of-thought pages with their member philosophers.
- **Concepts and Art & Philosophy** sections, an admin dashboard with content management and built-in analytics, and dark/light themes.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js (v22), Express.js, ES Modules |
| Database | Amazon DynamoDB (`us-east-1`, on-demand billing), AWS SDK for JavaScript v3 |
| Frontend | React SPA built with **Vite**, React Router, **TanStack React Query** (data fetching/caching), Tailwind CSS + shadcn/ui primitives |
| Auth | JWT for admin-only mutation routes |
| Data enrichment | Wikipedia REST + Wikidata (SPARQL / `wbgetentities`) — offline, seed-time |
| Orchestration | `concurrently` for local dev; Docker multi-stage builds (Node 22-alpine → nginx-alpine) |

> **Note:** the project originally ran on MongoDB Atlas + Mongoose. MongoDB is **fully deprecated** — do not reintroduce it. All data access goes through the repository layer in `philosopia-api/db/`.

## Monorepo Structure

```
philosopia_site/
├── philosopia-api/     # Express.js REST API (backend, port 5000)
├── philosopia-site/    # React SPA (frontend, port 3000)
├── docker-compose.yml  # Orchestrates both services
└── package.json        # Root scripts (concurrently)
```

## Getting Started

### Prerequisites

- **Node.js v22** (matches the Docker images)
- An **AWS account** with a DynamoDB-capable IAM user (access key + secret), region `us-east-1`
- Docker & Docker Compose (only for the containerized workflow)

### 1. Install dependencies

From the repo root — installs root, API, and frontend dependencies in one step:

```bash
npm run install:all
```

### 2. Configure environment variables

Both services read a local `.env` file (gitignored — never commit credentials).

**`philosopia-api/.env`**

```
PORT=5000

# --- DynamoDB (live database) ---
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your IAM user key>
AWS_SECRET_ACCESS_KEY=<your IAM user secret>
DYNAMO_TABLE_PREFIX=philosopia
# DYNAMO_ENDPOINT=http://localhost:8000   # only when testing against DynamoDB Local

# --- Auth (required — admin login/mutations fail closed without it) ---
JWT_SECRET=<long random string, e.g. `openssl rand -hex 48`>
```

**`philosopia-site/.env`** — points the React app at the API port:

```
VITE_API_BASE_URL=http://localhost:5000/api
```

> `.env` files are **not** copied into new git worktrees — copy them from the main checkout manually if you create one.

### 3. Provision and seed the database (first run only)

```bash
cd philosopia-api
npm run setup:tables   # creates the 3 DynamoDB tables + enables analytics TTL (idempotent)
cd ..
npm run seed           # seeds all content (validates seed data first, fails loudly on bad ids)
```

### 4. Run the app — two terminals

The backend and frontend are separate processes and must run **simultaneously in separate terminals**:

**Terminal 1 — Backend / API** (port **5000**):

```bash
cd philosopia-api
npm run dev
```

**Terminal 2 — Frontend** (port **3000**):

```bash
cd philosopia-site
npm start
```

Then open **http://localhost:3000** (the API health check is at http://localhost:5000/api/health).

> **macOS gotcha:** AirPlay Receiver squats port **5000**. If the API fails to bind (or `curl localhost:5000` answers with something odd), disable AirPlay Receiver in System Settings → General → AirDrop & Handoff, or check `lsof -nP -iTCP:5000` for a `ControlCe` process.

**Alternative — single terminal:** from the repo root, `npm run dev` runs both processes together via `concurrently` (API in blue, frontend in green).

### Docker

```bash
docker-compose up      # build and start both containers
docker-compose up -d   # detached mode
```

In Docker, the frontend is built with `VITE_API_BASE_URL=/api` and nginx proxies `/api/` to the API container; the frontend waits for the API's healthcheck before starting.

## Useful Commands

**Root**

```bash
npm run dev           # API + frontend concurrently
npm run start:api     # API only
npm run start:site    # Frontend only
npm run seed          # Seed the database
```

**Backend** (`philosopia-api/`)

```bash
npm run dev            # nodemon dev server, port 5000
npm start              # Production start
npm run setup:tables   # One-off table provisioning (idempotent)
npm run seed:all       # Full seed via masterSeed.js
npm run validate:data  # Cross-check seed-data ids (also runs as step 0 of the seed)
node scripts/enrichPhilosophers.js <id> [...ids]   # Targeted Wikipedia/Wikidata enrichment
```

**Frontend** (`philosopia-site/`)

```bash
npm start              # Vite dev server, port 3000
npm run build          # Production build (outputs to dist/)
npm run preview        # Serve the production build locally
```

## Data Integrity & Enrichment

Philosopher data is enriched offline from Wikipedia/Wikidata (bios in both languages, portraits, relations). The pipeline validates seed ids before every seed (`npm run validate:data`), retries Wikipedia's aggressive rate limits (HTTP 429) with backoff, and guards against known data traps (wrong QIDs, disambiguation pages). After adding a new philosopher, run the targeted enricher rather than the full sweep. Details, lessons learned, and the adding-a-philosopher checklist live in [`CLAUDE.md`](./CLAUDE.md).

## Further Documentation

- [`CLAUDE.md`](./CLAUDE.md) — architectural source of truth: data layer, knowledge graph, enrichment pipeline, gotchas, and roadmap.
- [`philosopia-api/docs/database-schema.md`](./philosopia-api/docs/database-schema.md) — DynamoDB schema details.
