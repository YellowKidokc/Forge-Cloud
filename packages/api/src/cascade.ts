import type { Env } from './env';
import { query, queryOne } from './db';

export interface CascadeRow {
  source: string;
  detail: string | null;
  content: string | null;
}

export interface CascadeResult {
  euid: string;
  verse: VerseRow | null;
  commentary: Array<{ source: string; text: string }>;
  persons: Array<{ euid: string; name: string }>;
  places: Array<{ euid: string; name: string }>;
  events: Array<{ euid: string; name: string }>;
  interlinear: Array<{
    language: string;
    lemma: string | null;
    strongs: string | null;
    english: string | null;
  }>;
  translations: Array<{ code: string; text: string }>;
  counts: Record<string, number>;
}

export interface VerseRow {
  euid: string;
  text: string;
  book: string;
  chapter: number;
  verse: number;
}

const CASCADE_SQL = `
  SELECT 'commentary' AS source, c.source AS detail, c.commentary_text AS content
    FROM bible_commentary c
   WHERE c.verse_euid = ?
  UNION ALL
  SELECT 'person', p.display_name, pv.person_euid
    FROM bible_person_verses pv
    JOIN bible_persons p ON p.person_euid = pv.person_euid
   WHERE pv.verse_euid = ?
  UNION ALL
  SELECT 'place', pl.place_name, plv.place_euid
    FROM bible_place_verses plv
    JOIN bible_places pl ON pl.place_euid = plv.place_euid
   WHERE plv.verse_euid = ?
  UNION ALL
  SELECT 'event', e.event_name, ev.event_euid
    FROM timeline_event_verses ev
    JOIN timeline_events e ON e.event_euid = ev.event_euid
   WHERE ev.verse_euid = ?
  UNION ALL
  SELECT 'interlinear',
         w.language,
         COALESCE(w.wlc_nestle_base, '')
           || ' [' || COALESCE(w.strongs_number, '') || '] '
           || COALESCE(w.bsb_english, '')
    FROM bible_bsb_interlinear w
   WHERE w.verse_euid = ?
  ORDER BY source
`;

export async function fetchVerse(env: Env, euid: string): Promise<VerseRow | null> {
  const row = await queryOne<{
    verse_euid: string;
    verse_text: string;
    book_code: string;
    chapter_num: number;
    verse_num: number;
  }>(
    env,
    `SELECT verse_euid, verse_text, book_code, chapter_num, verse_num
       FROM bible_verses
      WHERE verse_euid = ?`,
    [euid],
  );
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
    query<CascadeRow>(env, CASCADE_SQL, [euid, euid, euid, euid, euid]),
    query<{ translation_code: string; verse_text: string }>(
      env,
      `SELECT translation_code, verse_text
         FROM translations_verses
        WHERE verse_euid = ?
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
        result.persons.push({ euid: row.content ?? '', name: row.detail ?? '' });
        break;
      case 'place':
        result.places.push({ euid: row.content ?? '', name: row.detail ?? '' });
        break;
      case 'event':
        result.events.push({ euid: row.content ?? '', name: row.detail ?? '' });
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
