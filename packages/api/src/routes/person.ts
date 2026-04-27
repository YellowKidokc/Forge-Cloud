import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

app.get('/persons', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  const limit = Math.min(200, Number(c.req.query('limit')) || 50);
  if (!q) return c.json({ error: 'missing query parameter `q`' }, 400);
  const res = await query(
    c.env,
    `SELECT person_euid, display_name, canonical_name
       FROM bible_persons
      WHERE display_name LIKE ? COLLATE NOCASE
         OR canonical_name LIKE ? COLLATE NOCASE
      ORDER BY display_name
      LIMIT ?`,
    [`%${q}%`, `%${q}%`, limit],
  );
  return c.json({ query: q, results: res.rows });
});

app.get('/person/:euid', async (c) => {
  const euid = c.req.param('euid');
  const [person, enrichment, verses] = await Promise.all([
    query(c.env, `SELECT * FROM bible_persons WHERE person_euid = ?`, [euid]),
    query(c.env, `SELECT * FROM bible_person_enrichment WHERE person_euid = ?`, [euid]),
    query(
      c.env,
      `SELECT pv.verse_euid, v.verse_text
         FROM bible_person_verses pv
         LEFT JOIN bible_verses v ON v.verse_euid = pv.verse_euid
        WHERE pv.person_euid = ?
        ORDER BY pv.verse_euid`,
      [euid],
    ),
  ]);
  if (person.rows.length === 0) return c.json({ error: 'person not found' }, 404);
  return c.json({
    person: person.rows[0],
    enrichment: enrichment.rows[0] ?? null,
    verses: verses.rows,
  });
});

export default app;
