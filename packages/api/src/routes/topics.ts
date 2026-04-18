import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

app.get('/', async (c) => {
  const limit = Math.min(500, Number(c.req.query('limit')) || 100);
  const offset = Math.max(0, Number(c.req.query('offset')) || 0);
  const [rows, count] = await Promise.all([
    query(
      c.env,
      `SELECT topic, COUNT(*) AS verse_count
         FROM bible.bsb_topical_index
        GROUP BY topic
        ORDER BY topic
        LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    query(
      c.env,
      `SELECT COUNT(DISTINCT topic) AS total FROM bible.bsb_topical_index`,
    ),
  ]);
  return c.json({
    topics: rows.rows,
    total: Number((count.rows[0] as { total: string | number }).total),
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
       FROM bible.bsb_topical_index ti
       LEFT JOIN bible.verses v ON v.verse_euid = ti.verse_euid
      WHERE ti.topic = $1
      ORDER BY ti.verse_euid
      LIMIT $2`,
    [topic, limit],
  );
  return c.json({ topic, verses: res.rows });
});

export default app;
