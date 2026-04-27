import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query, queryOne } from '../db';

const app = new Hono<AppBindings>();

app.get('/', async (c) => {
  const limit = Math.min(500, Number(c.req.query('limit')) || 100);
  const offset = Math.max(0, Number(c.req.query('offset')) || 0);
  const [rows, count] = await Promise.all([
    query(
      c.env,
      `SELECT topic, COUNT(*) AS verse_count
         FROM bible_bsb_topical_index
        GROUP BY topic
        ORDER BY topic
        LIMIT ? OFFSET ?`,
      [limit, offset],
    ),
    queryOne<{ total: number }>(
      c.env,
      `SELECT COUNT(DISTINCT topic) AS total FROM bible_bsb_topical_index`,
    ),
  ]);
  return c.json({
    topics: rows.rows,
    total: count?.total ?? 0,
    limit,
    offset,
  });
});

app.get('/:topic', async (c) => {
  const topic = decodeURIComponent(c.req.param('topic'));
  const limit = Math.min(500, Number(c.req.query('limit')) || 100);
  const res = await query(
    c.env,
    `SELECT ti.verse_euid, v.verse_text
       FROM bible_bsb_topical_index ti
       LEFT JOIN bible_verses v ON v.verse_euid = ti.verse_euid
      WHERE ti.topic = ?
      ORDER BY ti.verse_euid
      LIMIT ?`,
    [topic, limit],
  );
  return c.json({ topic, verses: res.rows });
});

export default app;
