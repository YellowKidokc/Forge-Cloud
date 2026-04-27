-- Forge Cloud — D1 schema
-- SQLite has no schemas, so PG namespaces become flat prefixes:
--   bible.verses     -> bible_verses
--   timeline.events  -> timeline_events
--   translations.*   -> translations_*

------------------------------------------------------------------------
-- bible.*  (KJV spine, persons, places, words, commentary)
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bible_books (
  book_code     TEXT PRIMARY KEY,        -- 'GN', 'EX', ...
  book_name     TEXT NOT NULL,
  testament     TEXT NOT NULL,           -- 'OT' | 'NT'
  book_order    INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_chapters (
  book_code   TEXT    NOT NULL REFERENCES bible_books(book_code),
  chapter_num INTEGER NOT NULL,
  verse_count INTEGER NOT NULL,
  PRIMARY KEY (book_code, chapter_num)
);

CREATE TABLE IF NOT EXISTS bible_verses (
  verse_euid  TEXT    PRIMARY KEY,       -- e.g., 'GN-001-001'
  book_code   TEXT    NOT NULL,
  chapter_num INTEGER NOT NULL,
  verse_num   INTEGER NOT NULL,
  verse_text  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_bible_verses_chapter
  ON bible_verses(book_code, chapter_num, verse_num);

CREATE TABLE IF NOT EXISTS bible_word_index_kjv (
  word_euid     TEXT    PRIMARY KEY,     -- e.g., 'GN-001-001-W0001'
  verse_euid    TEXT    NOT NULL REFERENCES bible_verses(verse_euid),
  word_position INTEGER NOT NULL,
  word_text     TEXT    NOT NULL,
  person_euid   TEXT,
  place_euid    TEXT,
  year          INTEGER
);
CREATE INDEX IF NOT EXISTS ix_word_index_verse
  ON bible_word_index_kjv(verse_euid, word_position);

CREATE TABLE IF NOT EXISTS bible_bsb_interlinear (
  word_euid       TEXT PRIMARY KEY,
  verse_euid      TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  word_position   INTEGER NOT NULL,
  language        TEXT,
  wlc_nestle_base TEXT,
  strongs_number  TEXT,
  transliteration TEXT,
  bsb_english     TEXT,
  morphology      TEXT
);
CREATE INDEX IF NOT EXISTS ix_interlinear_verse
  ON bible_bsb_interlinear(verse_euid, word_position);

CREATE TABLE IF NOT EXISTS bible_commentary (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  verse_euid      TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  source          TEXT NOT NULL,         -- 'macarthur' | 'matthew_henry' | ...
  commentary_text TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_commentary_verse ON bible_commentary(verse_euid);

CREATE TABLE IF NOT EXISTS bible_persons (
  person_euid    TEXT PRIMARY KEY,       -- 'PER-YHVH_1'
  display_name   TEXT NOT NULL,
  canonical_name TEXT
);

CREATE TABLE IF NOT EXISTS bible_person_enrichment (
  person_euid TEXT PRIMARY KEY REFERENCES bible_persons(person_euid),
  birth_year  INTEGER,
  death_year  INTEGER,
  family      TEXT,
  occupations TEXT
);

CREATE TABLE IF NOT EXISTS bible_person_verses (
  person_euid TEXT NOT NULL REFERENCES bible_persons(person_euid),
  verse_euid  TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  PRIMARY KEY (person_euid, verse_euid)
);
CREATE INDEX IF NOT EXISTS ix_person_verses_verse
  ON bible_person_verses(verse_euid);

CREATE TABLE IF NOT EXISTS bible_places (
  place_euid TEXT PRIMARY KEY,           -- 'PLC-heaven_1'
  place_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bible_place_verses (
  place_euid TEXT NOT NULL REFERENCES bible_places(place_euid),
  verse_euid TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  PRIMARY KEY (place_euid, verse_euid)
);
CREATE INDEX IF NOT EXISTS ix_place_verses_verse
  ON bible_place_verses(verse_euid);

CREATE TABLE IF NOT EXISTS bible_strongs_dictionary (
  strongs_number   TEXT PRIMARY KEY,     -- 'H0430' | 'G0001'
  transliteration  TEXT,
  pronunciation    TEXT,
  short_definition TEXT,
  definition       TEXT
);

CREATE TABLE IF NOT EXISTS bible_bsb_concordance (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  verse_euid    TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  word_position INTEGER NOT NULL,
  word_text     TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_concordance_word
  ON bible_bsb_concordance(word_text COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS bible_bsb_topical_index (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic      TEXT NOT NULL,
  verse_euid TEXT NOT NULL REFERENCES bible_verses(verse_euid)
);
CREATE INDEX IF NOT EXISTS ix_topical_topic ON bible_bsb_topical_index(topic);

------------------------------------------------------------------------
-- timeline.*
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS timeline_periods (
  period_euid TEXT PRIMARY KEY,
  period_name TEXT NOT NULL,
  start_year  INTEGER,
  end_year    INTEGER,
  epoch_euid  TEXT
);

CREATE TABLE IF NOT EXISTS timeline_events (
  event_euid  TEXT PRIMARY KEY,          -- 'EVT-creation_1'
  event_name  TEXT NOT NULL,
  event_year  INTEGER,
  period_euid TEXT
);

CREATE TABLE IF NOT EXISTS timeline_event_verses (
  event_euid TEXT NOT NULL REFERENCES timeline_events(event_euid),
  verse_euid TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  PRIMARY KEY (event_euid, verse_euid)
);
CREATE INDEX IF NOT EXISTS ix_event_verses_verse
  ON timeline_event_verses(verse_euid);

------------------------------------------------------------------------
-- translations.*
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS translations_catalog (
  translation_code TEXT PRIMARY KEY,     -- 'NIV', 'ESV', 'BSB', ...
  translation_name TEXT NOT NULL,
  language         TEXT,
  year_published   INTEGER,
  source           TEXT
);

CREATE TABLE IF NOT EXISTS translations_verses (
  translation_code TEXT NOT NULL REFERENCES translations_catalog(translation_code),
  verse_euid       TEXT NOT NULL REFERENCES bible_verses(verse_euid),
  verse_text       TEXT NOT NULL,
  PRIMARY KEY (translation_code, verse_euid)
);

------------------------------------------------------------------------
-- Forge document state (Layer 2 grid sidecar — replaces .forge.json files)
------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS forge_documents (
  doc_id     TEXT PRIMARY KEY,           -- UUID
  title      TEXT NOT NULL,
  body_md    TEXT NOT NULL DEFAULT '',
  forge_ids  TEXT NOT NULL DEFAULT '{}', -- JSON: { positionHash: nodeUuid }
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
