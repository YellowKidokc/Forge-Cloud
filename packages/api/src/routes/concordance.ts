import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

app.get('/:word', async (c) => {
  const word = c.req.param('word').toLowerCase();
  const limit = Math.min(500, Number(c.req.query('limit')) || 100);
  const res = await query(
    c.env,
    `SELECT verse_euid, word_position, word_text
       FROM bible.bsb_concordance
      WHERE LOWER(word_text) = $1
      ORDER BY verse_euid, word_position
      LIMIT $2`,
    [word, limit],
  );
  return c.json({ word, occurrences: res.rows });
});

export default app;
