# @forge-cloud/api

Cloudflare Worker (Hono) backed by Cloudflare D1 (SQLite at edge). Exposes the Forge grid over HTTP.

## Quick start

```bash
npm install
cd packages/api

# 1. Create the D1 database (one-time)
npm run db:create
# -> wrangler prints the database_id; paste it into wrangler.toml

# 2. Run migrations + seed locally
npx wrangler d1 migrations apply forge-bible --local
npx wrangler d1 execute forge-bible --local --file=./migrations/0002_seed.sql

# 3. Dev server
npm run dev               # http://localhost:8787

# 4. Smoke test
curl http://localhost:8787/api/verse/GN-001-001
```

## Deploy

```bash
npx wrangler d1 migrations apply forge-bible --remote
npx wrangler d1 execute forge-bible --remote --file=./migrations/0002_seed.sql
npm run deploy
```

(Or just push to `main` — GitHub Actions does all of the above.)

## Why D1 (not Postgres)

Original spec was Postgres on a NAS via Cloudflare Tunnel + Hyperdrive. Reality: tunnel-fronted PG requires Cloudflare Access + a service token in front of the tunnel, the laptop has to stay on, and Hyperdrive rejects RFC1918 IPs without all that scaffolding. D1 cuts every one of those problems:

- runs at the edge (no tunnel)
- no laptop-must-stay-on dependency
- no Access app, no service token
- free tier covers the whole Bible dataset (~1 GB, well under D1's 10 GB cap)
- same `UNION ALL` cascade query works identically
- `ILIKE` becomes `LIKE ... COLLATE NOCASE`
- schema-prefixed names (`bible.verses`) become flat (`bible_verses`)

## Route surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/verse/:euid`              | Full cascade for a verse |
| GET | `/api/verse/:euid/text`         | KJV verse text only |
| GET | `/api/verse/:euid/translations` | All translations for the verse |
| GET | `/api/verse/:euid/interlinear`  | Hebrew/Greek word-by-word with Strong's |
| GET | `/api/verse/:euid/words`        | KJV word positions with tags |
| GET | `/api/verse/:euid/commentary`   | MacArthur + Matthew Henry |
| GET | `/api/books`                    | All 66 books |
| GET | `/api/book/:code`               | Book + chapter list |
| GET | `/api/book/:code/:chapter`      | Verses in a chapter |
| GET | `/api/search?q=&scope=kjv\|strongs\|topics` | Full-text search |
| GET | `/api/person/:euid`             | Person + enrichment + verses |
| GET | `/api/persons?q=`               | Search persons |
| GET | `/api/place/:euid`              | Place + verses |
| GET | `/api/places?q=`                | Search places |
| GET | `/api/timeline/periods`         | All periods |
| GET | `/api/timeline/events`          | Events with verse counts |
| GET | `/api/timeline/year/:year`      | Events + persons in a year |
| GET | `/api/concordance/:word`        | All occurrences of a word |
| GET | `/api/topics`                   | Paginated topic list |
| GET | `/api/topics/:topic`            | Verses for a topic |
| GET | `/api/translations`             | All available translations |
| GET | `/api/parallel/:euid`           | Side-by-side translations |

## Multi-database routing

`wrangler.toml` defines two named environments:
- `bible` — `forge-api-bible` deployment
- `openintel` — `forge-api-openintel` deployment

Deploy per environment: `wrangler deploy --env bible`. Each env can bind a different D1 database in the dashboard.
