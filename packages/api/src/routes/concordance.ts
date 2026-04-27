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
       FROM bible_bsb_concordance
      WHERE word_text = ? COLLATE NOCASE
      ORDER BY verse_euid, word_position
      LIMIT ?`,
    [word, limit],
  );
  return c.json({ word, occurrences: res.rows });
});

export default app;
