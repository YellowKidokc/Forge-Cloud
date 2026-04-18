import type { Env } from './env';
import { query } from './db';

export interface CascadeRow {
  source: string;
  detail: string | null;
  content: string | null;
}

export interface CascadeResult {
  euid: string;
  verse: {
    euid: string;
    text: string;
    book: string;
    chapter: number;
    verse: number;
  } | null;
  commentary: Array<{ source: string; text: string }>;
  persons: Array<{ euid: string; name: string }>;
  places: Array<{ euid: string; name: string }>;
  events: Array<{ euid: string; name: string }>;
  interlinear: Array<{ language: string; lemma: string | null; strongs: string | null; english: string | null }>;
  translations: Array<{ code: string; text: string }>;
  counts: Record<string, number>;
}

const CASCADE_SQL = `
  SELECT 'commentary'::text  AS source, c.source      AS detail, c.commentary_text AS content
    FROM bible.commentary c
   WHERE c.verse_euid = $1
  UNION ALL
  SELECT 'person'::text      AS source, p.display_name AS detail, pv.person_euid   AS content
    FROM bible.person_verses pv
    JOIN bible.persons p ON p.person_euid = pv.person_euid
   WHERE pv.verse_euid = $1
  UNION ALL
  SELECT 'place'::text       AS source, pl.place_name  AS detail, plv.place_euid   AS content
    FROM bible.place_verses plv
    JOIN bible.places pl ON pl.place_euid = plv.place_euid
   WHERE plv.verse_euid = $1
  UNION ALL
  SELECT 'event'::text       AS source, e.event_name   AS detail, ev.event_euid    AS content
    FROM timeline.event_verses ev
    JOIN timeline.events e ON e.event_euid = ev.event_euid
   WHERE ev.verse_euid = $1
  UNION ALL
  SELECT 'interlinear'::text AS source,
         w.language          AS detail,
         COALESCE(w.wlc_nestle_base, '')
           || ' [' || COALESCE(w.strongs_number, '') || '] '
           || COALESCE(w.bsb_english, '') AS content
    FROM bible.bsb_interlinear w
   WHERE w.verse_euid = $1
  ORDER BY source
`;

export async function fetchVerse(env: Env, euid: string) {
  const verseRes = await query<{
    verse_euid: string;
    verse_text: string;
    book_code: string;
    chapter_num: number;
    verse_num: number;
  }>(
    env,
    `SELECT verse_euid, verse_text, book_code, chapter_num, verse_num
       FROM bible.verses
      WHERE verse_euid = $1`,
    [euid],
  );
  const row = verseRes.rows[0];
  if (!row) return null;
  return {
    euid: row.verse_euid,
    text: row.verse_text,
    book: row.book_code,
    chapter: row.chapter_num,
    verse: row.verse_num,
  };
}

export async function fetchCascade(env: Env, euid: string): Promise<CascadeResult> {
  const [verse, cascadeRes, translationsRes] = await Promise.all([
    fetchVerse(env, euid),
    query<CascadeRow>(env, CASCADE_SQL, [euid]),
    query<{ translation_code: string; verse_text: string }>(
      env,
      `SELECT translation_code, verse_text
         FROM translations.verses
        WHERE verse_euid = $1
        ORDER BY translation_code`,
      [euid],
    ),
  ]);

  const result: CascadeResult = {
    euid,
    verse,
    commentary: [],
    persons: [],
    places: [],
    events: [],
    interlinear: [],
    translations: translationsRes.rows.map((r) => ({
      code: r.translation_code,
      text: r.verse_text,
    })),
    counts: {},
  };

  for (const row of cascadeRes.rows) {
    switch (row.source) {
      case 'commentary':
        result.commentary.push({
          source: row.detail ?? 'unknown',
          text: row.content ?? '',
        });
        break;
      case 'person':
        result.persons.push({
          euid: row.content ?? '',
          name: row.detail ?? '',
        });
        break;
      case 'place':
        result.places.push({
          euid: row.content ?? '',
          name: row.detail ?? '',
        });
        break;
      case 'event':
        result.events.push({
          euid: row.content ?? '',
          name: row.detail ?? '',
        });
        break;
      case 'interlinear': {
        const parts = (row.content ?? '').split(/ \[|\] /);
        result.interlinear.push({
          language: row.detail ?? '',
          lemma: parts[0]?.trim() || null,
          strongs: parts[1]?.trim() || null,
          english: parts[2]?.trim() || null,
        });
        break;
      }
    }
  }

  result.counts = {
    commentary: result.commentary.length,
    persons: result.persons.length,
    places: result.places.length,
    events: result.events.length,
    interlinear: result.interlinear.length,
    translations: result.translations.length,
  };

  return result;
}
