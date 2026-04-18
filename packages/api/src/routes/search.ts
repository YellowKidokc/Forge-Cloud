import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

type Scope = 'kjv' | 'strongs' | 'topics';

function parseScope(v: string | undefined): Scope {
  if (v === 'strongs' || v === 'topics') return v;
  return 'kjv';
}

function parseLimit(v: string | undefined, def = 50, max = 200): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(max, Math.floor(n));
}

app.get('/', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  if (!q) return c.json({ error: 'missing query parameter `q`' }, 400);

  const scope = parseScope(c.req.query('scope'));
  const limit = parseLimit(c.req.query('limit'));
  const pattern = `%${q}%`;

  if (scope === 'kjv') {
    const res = await query(
      c.env,
      `SELECT verse_euid, book_code, chapter_num, verse_num, verse_text
         FROM bible.verses
        WHERE verse_text ILIKE $1
        ORDER BY book_code, chapter_num, verse_num
        LIMIT $2`,
      [pattern, limit],
    );
    return c.json({ scope, query: q, results: res.rows });
  }

  if (scope === 'strongs') {
    const res = await query(
      c.env,
      `SELECT strongs_number, transliteration, pronunciation, definition, short_definition
         FROM bible.strongs_dictionary
        WHERE definition ILIKE $1
           OR short_definition ILIKE $1
           OR transliteration ILIKE $1
        LIMIT $2`,
      [pattern, limit],
    );
    return c.json({ scope, query: q, results: res.rows });
  }

  // topics
  const res = await query(
    c.env,
    `SELECT DISTINCT topic
       FROM bible.bsb_topical_index
      WHERE topic ILIKE $1
      ORDER BY topic
      LIMIT $2`,
    [pattern, limit],
  );
  return c.json({ scope, query: q, results: res.rows });
});

export default app;
