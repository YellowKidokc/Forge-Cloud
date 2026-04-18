import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';
import { isValidVerseEuid } from '../euid';
import { fetchVerse } from '../cascade';

const app = new Hono<AppBindings>();

// GET /api/translations
app.get('/translations', async (c) => {
  const res = await query(
    c.env,
    `SELECT translation_code, translation_name, language, year_published, source
       FROM translations.catalog
      ORDER BY translation_code`,
  );
  return c.json({ translations: res.rows });
});

// GET /api/parallel/:euid — side-by-side KJV + all translations
app.get('/parallel/:euid', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) return c.json({ error: 'invalid verse EUID' }, 400);
  const [kjv, others] = await Promise.all([
    fetchVerse(c.env, euid),
    query<{ translation_code: string; verse_text: string }>(
      c.env,
      `SELECT translation_code, verse_text
         FROM translations.verses
        WHERE verse_euid = $1
        ORDER BY translation_code`,
      [euid],
    ),
  ]);
  if (!kjv) return c.json({ error: 'verse not found' }, 404);
  return c.json({
    euid,
    translations: [
      { code: 'KJV', text: kjv.text },
      ...others.rows.map((r) => ({ code: r.translation_code, text: r.verse_text })),
    ],
  });
});

export default app;
