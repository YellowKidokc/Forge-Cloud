# FORGE CLOUD — Build Spec for Claude Code
## Cloudflare Workers + Hono + PostgreSQL + React/TipTap
## POF 2828 | April 18, 2026

---

## WHAT YOU'RE BUILDING

Take the existing Forge-v2-Monorepo (Tauri desktop app) and create a cloud-deployed variant. The React + TipTap frontend stays. The Tauri/Rust backend gets replaced with a Cloudflare Worker API backed by PostgreSQL.

**Two deployments from one codebase:**
1. `bible.theophysics.pro` — Bible study tool (database: `theophysics` at 192.168.1.97:5432)
2. `openintel.theophysics.pro` — Conspiracy research platform (database: TBD, same schema pattern)

Same frontend, same API code, different data. A config layer routes domains to databases.

---

## ARCHITECTURE

```
Browser (React + TipTap)
    │
    ▼
Cloudflare Worker (Hono API)
    │
    ▼
PostgreSQL (via Hyperdrive or pg connection)
    │
    ├── bible schema    (31k verses, 3k persons, 1.2k places, 744k interlinear words...)
    ├── translations schema  (373k verses across 12 translations)
    ├── timeline schema      (events, epochs, periods, narrative)
    └── study schema         (user notes, tags — future)
```

### The Three Layers (preserved from desktop)
- **Layer 1 (Surface):** TipTap/ProseMirror markdown editor. User writes, reads, navigates.
- **Layer 2 (Grid):** Every verse/word has an EUID coordinate (e.g., `GN-001-001-W0003`). The grid is the database.
- **Layer 3 (AI):** User highlights text → inline chat → AI reads grid → executes.


---

## DATABASE (Already Built — 2.94M rows, 37 tables)

**Connection:** `192.168.1.97:5432` / database: `theophysics` / user: `postgres` / password: `Moss9pep28$`

**NOTE FOR PRODUCTION:** This PostgreSQL is on David's local NAS. For cloud deployment, either:
1. Use Cloudflare Hyperdrive to proxy to a publicly-exposed PG (needs port forwarding or tunnel)
2. Migrate to Neon/Supabase/Railway managed PostgreSQL
3. Use a Cloudflare Tunnel (`cloudflared`) to bridge Worker → NAS

### Key Tables (all populated, ready to query)

| Schema | Table | Rows | What It Is |
|--------|-------|------|------------|
| bible | verses | 31,102 | KJV verse text, canonical spine |
| bible | books | 66 | Book metadata |
| bible | chapters | 1,189 | Chapter metadata |
| bible | words | 744,649 | BSB interlinear (Hebrew/Greek/Aramaic per word) |
| bible | word_index_kjv | 790,685 | KJV word positions with person/place/year per word |
| bible | commentary | 26,841 | MacArthur + Matthew Henry verse-by-verse |
| bible | persons | 3,069 | Biblical persons |
| bible | person_enrichment | 3,069 | Birth/death years, family, occupations |
| bible | person_verses | 37,518 | Person ↔ verse links |
| bible | places | 1,274 | Biblical places |
| bible | place_verses | 691 | Place ↔ verse links |
| bible | prophecies | 1,888 | Prophecy entries |
| bible | commandments | 613 | 613 mitzvot |
| bible | strongs_dictionary | 8,674 | Strong's Hebrew dictionary |
| bible | hitchcocks_names | 2,619 | Hitchcock's name meanings |
| bible | easton_dictionary | 1,808 | Easton's dictionary |
| bible | bsb_concordance | 722,705 | BSB word concordance |
| bible | bsb_topical_index | 116,914 | Topical index (46k topics) |
| bible | refs | 31,102 | Legacy verse reference lookup |
| translations | verses | 373,083 | 12 non-KJV translations |
| translations | catalog | 15 | Translation metadata |
| timeline | events | 395 | Historical events |
| timeline | event_verses | 14,153 | Event ↔ verse links |
| timeline | periods | 240 | Time periods |
| timeline | epochs | 156 | Epochs |
| timeline | narrative | 585 | Narrative blocks |

### EUID System (The Grid Addressing)

Every entity has a unique EUID that encodes its position in the hierarchy:

```
Verse:  GN-001-001       (Genesis 1:1)
Word:   GN-001-001-W0003 (3rd word of Genesis 1:1)
Person: PER-YHVH_1       (YHVH/God)
Place:  PLC-heaven_1     (heaven)
Event:  EVT-creation_1   (Creation)
Commentary: MAC-GN-001-001 (MacArthur on Gen 1:1)
```

Two-letter book codes: GN EX LV NU DT JS JG RT S1 S2 K1 K2 C1 C2 EZ NE ES JB PS PR EC SS IS JE LA EK DA HO JL AM OB JH MI NA HA ZP HG ZC ML MT MK LK JN AC RO CO1 CO2 GA EP PH CL TH1 TH2 TI1 TI2 TT PM HE JA PE1 PE2 JN1 JN2 JN3 JU RE

### The Cascade Query (The Killer Feature)

One query, one verse, everything attached:

```sql
-- Returns commentary, persons, places, events, interlinear, KJV words,
-- translations, concordance, topical entries — all for one verse
SELECT 'commentary' as source, c.source as detail, c.commentary_text as content
FROM bible.commentary c WHERE c.verse_euid = $1
UNION ALL
SELECT 'person', p.display_name, pv.person_euid
FROM bible.person_verses pv
JOIN bible.persons p ON p.person_euid = pv.person_euid
WHERE pv.verse_euid = $1
UNION ALL
SELECT 'place', pl.place_name, plv.place_euid
FROM bible.place_verses plv
JOIN bible.places pl ON pl.place_euid = plv.place_euid
WHERE plv.verse_euid = $1
UNION ALL
SELECT 'event', e.event_name, ev.event_euid
FROM timeline.event_verses ev
JOIN timeline.events e ON e.event_euid = ev.event_euid
WHERE ev.verse_euid = $1
UNION ALL
SELECT 'interlinear', w.language, w.wlc_nestle_base || ' [' || w.strongs_number || '] ' || w.bsb_english
FROM bible.bsb_interlinear w WHERE w.verse_euid = $1
ORDER BY source;
```

Gen 1:1 returns 24+ results from this single query.

---

## API ROUTES (Cloudflare Worker + Hono)

Build as a Hono app deployed as a Cloudflare Worker.

```typescript
// Core routes
GET  /api/verse/:euid          → Full cascade for a verse (commentary + persons + places + events + interlinear)
GET  /api/verse/:euid/text     → Just the verse text (KJV)
GET  /api/verse/:euid/translations → All 12 translations for that verse
GET  /api/verse/:euid/interlinear  → Hebrew/Greek word-by-word with Strong's
GET  /api/verse/:euid/words    → KJV word positions with person/place/year tags
GET  /api/verse/:euid/commentary   → MacArthur + Matthew Henry

// Navigation
GET  /api/book/:code           → All chapters in a book (e.g., /api/book/GN)
GET  /api/book/:code/:chapter  → All verses in a chapter
GET  /api/books                → List all 66 books with metadata

// Search
GET  /api/search?q=grace&scope=kjv       → Full-text search in KJV
GET  /api/search?q=grace&scope=strongs   → Search Strong's dictionary
GET  /api/search?q=creation&scope=topics → Search topical index

// Persons & Places
GET  /api/person/:euid         → Person details + enrichment + all verses
GET  /api/place/:euid          → Place details + all verses
GET  /api/persons?q=moses      → Search persons
GET  /api/places?q=jerusalem   → Search places

// Timeline (chronological spine)
GET  /api/timeline/periods     → All 240 time periods
GET  /api/timeline/events      → All events with verse links
GET  /api/timeline/year/:year  → Everything happening in a given year

// Concordance & Topics
GET  /api/concordance/:word    → All occurrences of a word
GET  /api/topics/:topic        → All verses for a topic
GET  /api/topics               → List all 46k topics (paginated)

// Translations
GET  /api/translations         → List all 12 available translations
GET  /api/parallel/:euid       → Side-by-side comparison of all translations
```

---

## TECH STACK

| Component | Technology | Notes |
|-----------|-----------|-------|
| API Runtime | Cloudflare Workers | Serverless, edge-deployed |
| API Framework | Hono | Lightweight, TypeScript, built for Workers |
| Database | PostgreSQL 15 | Currently at 192.168.1.97:5432 |
| DB Connection | pg (node-postgres) or Hyperdrive | Hyperdrive preferred for connection pooling |
| Frontend | React 18 + TypeScript | Already built in Forge repo |
| Editor | TipTap (ProseMirror) | Already built in Forge repo |
| Styling | Tailwind CSS | Already in Forge repo |
| Deployment | Cloudflare Pages (frontend) + Workers (API) | Monorepo deploy |
| Auth | Cloudflare Access or simple token | Phase 2 |
| AI Layer | Anthropic API (Claude) | Called from Worker, not browser |

### Package Structure (in the fork)

```
forge-cloud/
├── packages/
│   ├── web/              ← React + TipTap frontend (from existing Forge)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Editor/        ← TipTap editor (Layer 1)
│   │   │   │   ├── Grid/          ← Grid overlay (Layer 2)
│   │   │   │   ├── AI/            ← Inline chat (Layer 3)
│   │   │   │   ├── BibleView/     ← Bible-specific navigation
│   │   │   │   ├── Timeline/      ← Chronological spine view
│   │   │   │   └── Sidebar/       ← Book/chapter tree, search
│   │   │   ├── hooks/
│   │   │   │   └── useVerse.ts    ← Hook: fetch cascade for a verse EUID
│   │   │   └── api/
│   │   │       └── client.ts      ← API client (replaces Tauri IPC)
│   │   └── package.json
│   └── api/              ← Cloudflare Worker (Hono)
│       ├── src/
│       │   ├── index.ts           ← Hono app entry
│       │   ├── routes/
│       │   │   ├── verse.ts       ← /api/verse/* routes
│       │   │   ├── search.ts      ← /api/search
│       │   │   ├── person.ts      ← /api/person/*
│       │   │   ├── place.ts       ← /api/place/*
│       │   │   ├── timeline.ts    ← /api/timeline/*
│       │   │   ├── concordance.ts ← /api/concordance/*
│       │   │   └── topics.ts      ← /api/topics/*
│       │   ├── db.ts              ← PostgreSQL connection helper
│       │   └── cascade.ts         ← The cascade query builder
│       ├── wrangler.toml          ← Worker config
│       └── package.json
├── FORGE_CLOUD_BUILD_SPEC.md
└── package.json                   ← Monorepo root (npm workspaces)
```

---

## BUILD STEPS (For Claude Code)

### Phase 1: API Worker (DO THIS FIRST)

1. Create `packages/api/` in the fork
2. Initialize Hono app with `wrangler.toml`
3. Implement PostgreSQL connection via `pg` (use environment variables for connection string)
4. Build the cascade endpoint: `GET /api/verse/:euid` — this is the proof of concept
5. Build navigation: `GET /api/books`, `GET /api/book/:code/:chapter`
6. Deploy to Cloudflare Workers
7. Test: `curl https://forge-api.davidokc28.workers.dev/api/verse/GN-001-001` should return 24+ cascade results
8. Add remaining routes incrementally

### Phase 2: Frontend (After API works)

1. Fork the existing `packages/web/` from Forge-v2-Monorepo (the React + TipTap app)
2. Create `src/api/client.ts` — replaces all Tauri IPC with fetch() to the Worker
3. Build `BibleView` component: book/chapter/verse navigation sidebar
4. Build `VersePanel` component: shows cascade results (commentary, interlinear, persons, etc.) in collapsible sections
5. Build `ParallelView`: side-by-side translations
6. Wire TipTap editor to load verse text — user can annotate, highlight, instruct AI
7. Deploy to Cloudflare Pages

### Phase 3: AI Layer

1. Add Anthropic API call from Worker (server-side, not browser)
2. Implement inline chat: user highlights text in editor → sends to Claude with cascade context
3. Claude has full grid awareness — knows the verse EUID, all attached data, can answer from the database
4. Response renders inline in Layer 1

### Phase 4: Multi-Database Router

1. Add domain → database routing in Worker
2. `bible.theophysics.pro` → theophysics PostgreSQL
3. `openintel.theophysics.pro` → conspiracy PostgreSQL (same schema pattern, different content)
4. Environment variable: `DATABASE_URL` set per route/domain

---

## DATABASE CONNECTION (For the Worker)

```typescript
// packages/api/src/db.ts
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(env: Env): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

// Usage in routes:
const pool = getPool(c.env);
const result = await pool.query(
  `SELECT * FROM bible.verses WHERE verse_euid = $1`, [euid]
);
```

**Environment variable (wrangler.toml or dashboard):**
```
DATABASE_URL = "postgresql://postgres:Moss9pep28$@192.168.1.97:5432/theophysics"
```

**NOTE:** For production, this NAS PostgreSQL needs to be reachable from the internet. Options:
- Cloudflare Tunnel (`cloudflared tunnel`) on the NAS — RECOMMENDED, zero port exposure
- Migrate to managed PG (Neon free tier works for 500MB, this DB is ~1GB so might need paid)
- Supabase or Railway managed PG

---

## OPENINTEL (CONSPIRACY RESEARCH PLATFORM)

Same Forge engine, different database. The OpenIntel PostgreSQL schema (22 tables, 4-layer scoring) follows the same EUID + cascade pattern:

- Claims have EUIDs → evidence attaches at claim level
- Sources have EUIDs → credibility scores attach
- Entities (people, orgs, events) have EUIDs → connections map between them
- Timeline spine works the same way — chronological navigation through conspiracy events

When the OpenIntel database is built, adding it to Forge Cloud is just:
1. Point a new domain at the Worker
2. Set `DATABASE_URL` for that domain
3. The frontend adapts — sidebar shows claims instead of books, cascade shows evidence instead of commentary

---

## WHAT NOT TO TOUCH

- Do NOT modify the TipTap/ProseMirror editor core. It works. Just wire it to the API.
- Do NOT change the EUID system. It's canonical. The grid addressing is locked.
- Do NOT build auth in Phase 1. Get the data flowing first.
- Do NOT try to load data. The database is already populated (2.94M rows). Just query it.
- Do NOT use Cloudflare D1 for this. The data is in PostgreSQL and stays there.

---

## EXISTING INFRASTRUCTURE (Reference)

| Asset | Location |
|-------|----------|
| Forge v2 Repo | github.com/YellowKidokc/Forge-v2-Monorepo |
| Forge Build Spec | FORGE_BUILD_SPEC_MASTER.md in repo root |
| Grid Spec | FORGE_DOCS/FORGE_GRID_SPEC.md |
| InlineAiBubble | packages/ (Layer 2b component, delivered) |
| Bible Database | 192.168.1.97:5432/theophysics (2.94M rows, 37 tables) |
| All Loaders | C:\Users\lowes\Desktop\Apologetics\tiktok_analysis\loaders\ |
| DDL Files | C:\Users\lowes\Desktop\Apologetics\tiktok_analysis\ddl\ |
| Cloudflare Account | davidokc28.workers.dev (50+ workers already deployed) |
| Domains | theophysics.pro, faiththruphysics.com |
| Comms Hub | theophysics-comms.davidokc28.workers.dev |
| Math Translation Layer | math-translation-layer repo (Hono + Workers scaffold exists) |

---

## SUCCESS CRITERIA

Phase 1 is DONE when:
```
curl https://forge-api.davidokc28.workers.dev/api/verse/GN-001-001
```
Returns JSON with MacArthur commentary, Matthew Henry commentary, YHVH (person), heaven + Earth (places), Creation event, and Hebrew interlinear — all from one request.

Phase 2 is DONE when a user can:
1. Open a browser
2. Navigate to Genesis 1:1
3. See the verse text
4. Click to expand commentary, interlinear, translations, persons, places
5. Search for "grace" and get results
6. Highlight text and get an AI response that knows the verse context

That's the app. Everything else is iteration.

---

*Written by Opus | April 18, 2026 | For Claude Code execution*
*Database built across two sessions: 885k → 2.94M rows*
*"The schema IS the app backend."*
