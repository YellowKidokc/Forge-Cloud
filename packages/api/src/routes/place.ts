import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

// GET /api/places?q=jerusalem
app.get('/places', async (c) => {
  const q = (c.req.query('q') ?? '').trim();
  const limit = Math.min(200, Number(c.req.query('limit')) || 50);
  if (!q) return c.json({ error: 'missing query parameter `q`' }, 400);
  const res = await query(
    c.env,
    `SELECT place_euid, place_name
       FROM bible.places
      WHERE place_name ILIKE $1
      ORDER BY place_name
      LIMIT $2`,
    [`%${q}%`, limit],
  );
  return c.json({ query: q, results: res.rows });
});

// GET /api/place/:euid
app.get('/place/:euid', async (c) => {
  const euid = c.req.param('euid');
  const [place, verses] = await Promise.all([
    query(c.env, `SELECT * FROM bible.places WHERE place_euid = $1`, [euid]),
    query(
      c.env,
      `SELECT plv.verse_euid, v.verse_text
         FROM bible.place_verses plv
         LEFT JOIN bible.verses v ON v.verse_euid = plv.verse_euid
        WHERE plv.place_euid = $1
        ORDER BY plv.verse_euid`,
      [euid],
    ),
  ]);
  if (place.rows.length === 0) return c.json({ error: 'place not found' }, 404);
  return c.json({ place: place.rows[0], verses: verses.rows });
});

export default app;
