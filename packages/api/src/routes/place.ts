import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

app.get('/places', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  const limit = Math.min(200, Number(c.req.query('limit')) || 50);
  if (!q) return c.json({ error: 'missing query parameter `q`' }, 400);
  const res = await query(
    c.env,
    `SELECT place_euid, place_name
       FROM bible_places
      WHERE place_name LIKE ? COLLATE NOCASE
      ORDER BY place_name
      LIMIT ?`,
    [`%${q}%`, limit],
  );
  return c.json({ query: q, results: res.rows });
});

app.get('/place/:euid', async (c) => {
  const euid = c.req.param('euid');
  const [place, verses] = await Promise.all([
    query(c.env, `SELECT * FROM bible_places WHERE place_euid = ?`, [euid]),
    query(
      c.env,
      `SELECT plv.verse_euid, v.verse_text
         FROM bible_place_verses plv
         LEFT JOIN bible_verses v ON v.verse_euid = plv.verse_euid
        WHERE plv.place_euid = ?
        ORDER BY plv.verse_euid`,
      [euid],
    ),
  ]);
  if (place.rows.length === 0) return c.json({ error: 'place not found' }, 404);
  return c.json({ place: place.rows[0], verses: verses.rows });
});

export default app;
