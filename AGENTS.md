# Philosopia development guidance

## Verified project baseline

- Three independent npm packages: root orchestration, `philosopia-site`
  (React/Vite SPA), and `philosopia-api` (Express ES-module API).
- Local defaults: frontend 3000, API 5001; Vite proxies `/api`.
- Runtime persistence is DynamoDB, accessed through `philosopia-api/db/`.
  Content uses `entityType/id`, users `username`, analytics `day/ts`.
- Stored bilingual fields use nested `{ en, he }`; the API derives legacy
  flat aliases. Seed sources may use flat fields transformed by seeders.
- Public pages use language-prefixed routes; `/login` and `/admin` are separate.
  Biography enrichment runs offline; the artwork page also fetches Commons data
  in the browser.

## Important locations

- `philosopia-site/src/App.jsx`: routing and application shell.
- `src/pages/`, `src/components/`: screens and reusable UI.
- `src/hooks/queries.js`, `src/lib/api.js`: server-state and HTTP access.
- `src/i18n/`, `src/context/`, `src/index.css`: language, state, theme tokens.
  The `src/` paths above are relative to `philosopia-site/`.
- `philosopia-api/server.js`, `routes/`, `middleware/`: HTTP application.
- `philosopia-api/db/`: repositories, response aliases, relationship graph.
- `philosopia-api/data/`, `seeders/`, `scripts/`: content and database tools.
- Root `docker-compose.yml`, package Dockerfiles, and frontend `nginx.conf`:
  container builds and routing.
- Read `README.md` and `CLAUDE.md` for context; verify claims against code.
  The frontend README and `philosopia-api/docs/database-schema.md` contain
  obsolete CRA/MongoDB guidance. Do not reintroduce MongoDB/Mongoose.

## Development rules

- Follow nearby JavaScript/JSX style and module conventions. Preserve existing
  line endings, including CRLF in the API's `data/philosophers.json` and
  `data/periods.js`.
- Keep changes focused. Avoid unrelated formatting, renaming, refactoring,
  dependency upgrades, or new infrastructure.
- Use functional React components and existing UI primitives/theme tokens.
- Add server reads through `queries.js` and the shared API client. Keep stable
  query keys and invalidate all affected queries after writes.
- Preserve both languages, RTL/LTR behavior, route compatibility, and
  same-language biography fallbacks.
- Copy graph nodes/links before passing them to the mutating graph library.
- Keep DynamoDB access in `db/`. Preserve response envelopes, bilingual aliases,
  and compatibility fields unless the task explicitly changes the contract.
- Validate mutation types, IDs, referenced records, and authorization on the
  server. Browser guards and comments describing access are not enforcement.
- Address server-cache invalidation when changing mutations. Keep specific
  routes before parameter routes where relevant.

## Verified commands

From repository root:

- `npm run dev`: run API and frontend together.
- `npm run start:api`: start API.
- `npm run start:site`: start Vite.
- `npm run build`: build frontend.

From `philosopia-api/`:

- `npm run dev`: run with nodemon.
- `npm start`: run `server.js`.
- `npm run validate:data`: read-only seed reference validation.
- `npm test`: isolated backend tests with Node's built-in runner; database
  clients are mocked before application modules load.

From `philosopia-site/`:

- `npm start`: Vite development server.
- `npm run build`: production output in `dist/`.
- `npm run preview`: preview that output.

Backend tests use Node's experimental module-mocking flag. No frontend test
runner or lint command is currently configured. Do not claim otherwise.
Docker files exist; successful builds/deployment must be verified separately.

## Security and database rules

- Never print or commit credentials, tokens, environment values, or user dumps.
- Keep secrets server-side. `VITE_*` variables are public browser configuration.
- Use the AWS credential provider chain; never hardcode AWS credentials.
- Confirm the intended account, endpoint, region, and table prefix before
  database operations. Do not assume a development database is configured.
- Run seeding, enrichment, table setup, admin creation, backups, cleanup, or
  deployment only when the task explicitly authorizes those operations.
- Seed scripts may execute immediately when imported. Inspect before importing.
- Full-item puts replace records; preserve enrichment and manual fields.
- Preserve JWT failure when `JWT_SECRET` is absent; never add a fallback secret.
- Sanitize untrusted HTML before rendering it.

## Validation and change management

- Inspect Git status first; preserve unrelated user changes.
- No branch/commit convention is established. Follow the requested workflow;
  do not commit, push, or deploy without authorization.
- Review the complete diff for unintended files, secrets, generated output,
  lockfile churn, response changes, and line-ending changes.
- For frontend changes, run the build and check affected routes in English/
  Hebrew, light/dark themes, and relevant viewport sizes.
- Run `validate:data` for seed-source changes; it does not validate live data.
- For auth, writes, and data transformations, require meaningful regression
  coverage. If tooling is absent, report the gap and agree on setup.
- Declare dependencies in the importing package and update its lockfile.
  Explain dependency changes and validate isolated package builds.
- Report checks performed, failures, checks omitted, and remaining risks.
