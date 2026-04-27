# Forge Cloud

Cloudflare-native build of FORGE — Workers + Hono + D1 + React/TipTap.

Two deployments target the same codebase:
- `bible.theophysics.pro` — Bible study tool
- `openintel.theophysics.pro` — research platform (later)

## Stack

| Layer        | Service                          | Notes                                      |
|--------------|----------------------------------|--------------------------------------------|
| API          | Cloudflare Workers + Hono        | `packages/api`                             |
| Database     | Cloudflare D1 (SQLite at edge)   | flat-table-name SQLite, no PG, no tunnel   |
| Frontend     | React 19 + Vite + Tailwind       | `packages/web`                             |
| Hosting (UI) | Cloudflare Pages                 | auto-deploys via GitHub Actions            |
| CI / CD      | GitHub Actions + wrangler-action | `.github/workflows/deploy.yml`             |

No Postgres, no Hyperdrive, no Cloudflare Tunnel for the runtime path. The NAS Postgres dump is loaded into D1 once on import; after that, everything runs at the edge.

## One-shot setup

```bash
# 1. clone + install
git clone https://github.com/YellowKidokc/Forge-Cloud.git
cd Forge-Cloud
npm install

# 2. log in to Cloudflare
npx wrangler login

# 3. create the D1 database
npm run db:create -w @forge-cloud/api
#   -> copy the printed `database_id` into packages/api/wrangler.toml

# 4. apply schema + seed (locally first, then remotely)
npx wrangler d1 migrations apply forge-bible --local --cwd packages/api
npx wrangler d1 execute forge-bible --local --file=packages/api/migrations/0002_seed.sql --cwd packages/api

# 5. run dev
npm run dev:api    # http://localhost:8787
npm run dev:web    # http://localhost:5173

# 6. deploy
npm run db:migrate -w @forge-cloud/api      # remote schema
npm run db:seed   -w @forge-cloud/api       # remote seed
npm run deploy:api                          # Worker live
npm run build:web && npm run deploy:pages   # Pages live
```

## Auto-deploy on push

The workflow at `.github/workflows/deploy.yml` deploys on push to `main` (or the legacy `OBS-Plugin-Final-Claude` branch). Add these to **Settings → Secrets and variables → Actions**:

| Type   | Name                     | Value                                                     |
|--------|--------------------------|-----------------------------------------------------------|
| Secret | `CLOUDFLARE_API_TOKEN`   | API token with Workers + D1 + Pages write                |
| Secret | `CLOUDFLARE_ACCOUNT_ID`  | from dashboard sidebar                                   |
| Var    | `VITE_API_URL`           | the deployed Worker URL (e.g. `https://forge-api.davidokc28.workers.dev`) |

Generate the token at https://dash.cloudflare.com/profile/api-tokens with the **Edit Cloudflare Workers** template plus **D1: Edit** and **Pages: Edit**.

## Repo layout

```
Forge-Cloud/
├── packages/
│   ├── api/                     Cloudflare Worker (Hono + D1)
│   │   ├── src/
│   │   │   ├── index.ts         Hono app entry
│   │   │   ├── db.ts            D1 query helper
│   │   │   ├── cascade.ts       The cascade query
│   │   │   ├── euid.ts          EUID validators
│   │   │   └── routes/          Route handlers
│   │   ├── migrations/
│   │   │   ├── 0001_schema.sql  Full schema
│   │   │   └── 0002_seed.sql    Genesis 1 sample data
│   │   └── wrangler.toml
│   └── web/                     React + Vite frontend
│       └── src/
│           ├── App.tsx
│           ├── components/
│           │   ├── Settings/    Modal + 4-edge draggable tabs
│           │   ├── Layout/      Collapsible columns
│           │   ├── Editor/      Placeholder (TipTap lands in Layer 2)
│           │   └── Sidebar/
│           └── api/client.ts
├── .github/workflows/deploy.yml
└── FORGE_CLOUD_BUILD_SPEC.md
```

## Phase status

- [x] **Phase 1** — Worker API (Hono + D1) with cascade query, navigation, search, persons, places, timeline, concordance, topics, translations
- [x] **Step 1 frontend** — Settings modal with 4-edge draggable tabs + collapsible columns + persistence
- [ ] **Phase 2** — Real ingestion (Excel → D1) once the NAS PG dump is available
- [ ] **Layer 2 grid** — TipTap node IDs + `useGrid()` hook + `forge_documents` sidecar in D1
- [ ] **Layer 2b** — Inline AI bubble (uses Anthropic API server-side from the Worker)
- [ ] **Phase 4** — Domain → database router for `openintel.theophysics.pro`

## API smoke test

```bash
curl https://forge-api.davidokc28.workers.dev/api/verse/GN-001-001
```

Returns the cascade for Genesis 1:1: text, MacArthur + Matthew Henry commentary, YHVH (person), heaven + earth (places), Creation event, Hebrew interlinear, BSB/NIV/ESV translations.

## Keyboard shortcuts (frontend)

| Key             | Action                       |
|-----------------|------------------------------|
| `Ctrl+,`        | Open / close settings modal  |
| `Ctrl+\`        | Toggle second column         |
| `Ctrl+Shift+\`  | Toggle third column          |
| `Esc`           | Close settings modal         |
| Drag tab        | Move between edges           |
| Right-click tab | Rename / color / move / del  |
| Double-click divider | Collapse adjacent column |

## Importing the real Bible data later

When you're at the NAS, run:

```sql
-- on PG side, dump the relevant schemas
pg_dump --data-only --inserts \
  --schema=bible --schema=timeline --schema=translations \
  -U postgres -d theophysics > forge.sql

-- transform: schemas to flat names, escape D1 quirks
sed -i 's/INTO bible\./INTO bible_/g; s/INTO timeline\./INTO timeline_/g; s/INTO translations\./INTO translations_/g' forge.sql

# load to D1 (remote)
wrangler d1 execute forge-bible --remote --file=forge.sql --cwd packages/api
```

A proper Excel ingest engine (with per-row labeling and slot metadata) lands in a future phase.
