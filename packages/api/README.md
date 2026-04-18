# @forge-cloud/api

Cloudflare Worker (Hono) that exposes the Forge grid over HTTP. Backed by PostgreSQL (`theophysics` — 2.94M rows, 37 tables).

## Quick start

```bash
npm install
cd packages/api

# Set the database connection string (local dev)
echo 'DATABASE_URL="postgresql://postgres:PASSWORD@HOST:5432/theophysics"' > .dev.vars

# Run locally
npm run dev

# Deploy
wrangler secret put DATABASE_URL   # production secret
npm run deploy
```

## Proof-of-concept request

```bash
curl https://forge-api.davidokc28.workers.dev/api/verse/GN-001-001
```

Returns the verse text, MacArthur + Matthew Henry commentary, YHVH (person), heaven + earth (places), the Creation event, and Hebrew interlinear — in one response.

## Route surface

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/verse/:euid` | Full cascade for a verse |
| GET | `/api/verse/:euid/text` | KJV verse text only |
| GET | `/api/verse/:euid/translations` | All translations for the verse |
| GET | `/api/verse/:euid/interlinear` | Hebrew/Greek word-by-word with Strong's |
| GET | `/api/verse/:euid/words` | KJV word positions with tags |
| GET | `/api/verse/:euid/commentary` | MacArthur + Matthew Henry |
| GET | `/api/books` | All 66 books with metadata |
| GET | `/api/book/:code` | Book + chapter list |
| GET | `/api/book/:code/:chapter` | Verses in a chapter |
| GET | `/api/search?q=&scope=kjv\|strongs\|topics` | Full-text search |
| GET | `/api/person/:euid` | Person + enrichment + verses |
| GET | `/api/persons?q=` | Search persons |
| GET | `/api/place/:euid` | Place + verses |
| GET | `/api/places?q=` | Search places |
| GET | `/api/timeline/periods` | All 240 periods |
| GET | `/api/timeline/events` | Events with verse counts |
| GET | `/api/timeline/year/:year` | Events + persons in a year |
| GET | `/api/concordance/:word` | All occurrences of a word |
| GET | `/api/topics` | Paginated topic list |
| GET | `/api/topics/:topic` | Verses for a topic |
| GET | `/api/translations` | All available translations |
| GET | `/api/parallel/:euid` | Side-by-side translations |

## Connection strategy

`src/db.ts` prefers a Cloudflare Hyperdrive binding (`env.HYPERDRIVE`) if configured, otherwise falls back to `env.DATABASE_URL`. For production, create a Hyperdrive config and uncomment the binding in `wrangler.toml`:

```bash
wrangler hyperdrive create forge-pg \
  --connection-string="postgresql://postgres:PASSWORD@HOST:5432/theophysics"
```

## Multi-database routing

Two `[env.*]` blocks exist in `wrangler.toml`:

- `forge-api-bible` — bible.theophysics.pro → theophysics PG
- `forge-api-openintel` — openintel.theophysics.pro → OpenIntel PG (same schema pattern)

Deploy per environment: `wrangler deploy --env bible`.
