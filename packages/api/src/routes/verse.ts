import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';
import { fetchCascade, fetchVerse } from '../cascade';
import { isValidVerseEuid } from '../euid';

const app = new Hono<AppBindings>();

app.get('/:euid', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) {
    return c.json({ error: 'invalid verse EUID' }, 400);
  }
  const cascade = await fetchCascade(c.env, euid);
  if (!cascade.verse) return c.json({ error: 'verse not found' }, 404);
  return c.json(cascade);
});

app.get('/:euid/text', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) {
    return c.json({ error: 'invalid verse EUID' }, 400);
  }
  const verse = await fetchVerse(c.env, euid);
  if (!verse) return c.json({ error: 'verse not found' }, 404);
  return c.json(verse);
});

app.get('/:euid/translations', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) {
    return c.json({ error: 'invalid verse EUID' }, 400);
  }
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
  const translations = [
    ...(kjv ? [{ code: 'KJV', text: kjv.text }] : []),
    ...others.rows.map((r) => ({ code: r.translation_code, text: r.verse_text })),
  ];
  return c.json({ euid, translations });
});

app.get('/:euid/interlinear', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) {
    return c.json({ error: 'invalid verse EUID' }, 400);
  }
  const res = await query(
    c.env,
    `SELECT word_euid, word_position, language, wlc_nestle_base,
            strongs_number, transliteration, bsb_english, morphology
       FROM bible.bsb_interlinear
      WHERE verse_euid = $1
      ORDER BY word_position`,
    [euid],
  );
  return c.json({ euid, words: res.rows });
});

app.get('/:euid/words', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) {
    return c.json({ error: 'invalid verse EUID' }, 400);
  }
  const res = await query(
    c.env,
    `SELECT word_euid, word_position, word_text, person_euid, place_euid, year
       FROM bible.word_index_kjv
      WHERE verse_euid = $1
      ORDER BY word_position`,
    [euid],
  );
  return c.json({ euid, words: res.rows });
});

app.get('/:euid/commentary', async (c) => {
  const euid = c.req.param('euid');
  if (!isValidVerseEuid(euid)) {
    return c.json({ error: 'invalid verse EUID' }, 400);
  }
  const res = await query<{ source: string; commentary_text: string }>(
    c.env,
    `SELECT source, commentary_text
       FROM bible.commentary
      WHERE verse_euid = $1
      ORDER BY source`,
    [euid],
  );
  return c.json({
    euid,
    commentary: res.rows.map((r) => ({ source: r.source, text: r.commentary_text })),
  });
});

export default app;
