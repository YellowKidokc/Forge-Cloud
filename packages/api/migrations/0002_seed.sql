-- Forge Cloud — Genesis 1 seed data
-- Provides enough rows for /api/verse/GN-001-001 to return a full cascade.
-- Real ingestion replaces this once the NAS dump is available.

------------------------------------------------------------------------
-- Books / chapters
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_books (book_code, book_name, testament, book_order, chapter_count) VALUES
  ('GN', 'Genesis', 'OT', 1, 50);

INSERT OR REPLACE INTO bible_chapters (book_code, chapter_num, verse_count) VALUES
  ('GN', 1, 31);

------------------------------------------------------------------------
-- Genesis 1:1–10 (KJV)
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_verses (verse_euid, book_code, chapter_num, verse_num, verse_text) VALUES
  ('GN-001-001', 'GN', 1, 1,  'In the beginning God created the heaven and the earth.'),
  ('GN-001-002', 'GN', 1, 2,  'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.'),
  ('GN-001-003', 'GN', 1, 3,  'And God said, Let there be light: and there was light.'),
  ('GN-001-004', 'GN', 1, 4,  'And God saw the light, that it was good: and God divided the light from the darkness.'),
  ('GN-001-005', 'GN', 1, 5,  'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.'),
  ('GN-001-006', 'GN', 1, 6,  'And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.'),
  ('GN-001-007', 'GN', 1, 7,  'And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.'),
  ('GN-001-008', 'GN', 1, 8,  'And God called the firmament Heaven. And the evening and the morning were the second day.'),
  ('GN-001-009', 'GN', 1, 9,  'And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.'),
  ('GN-001-010', 'GN', 1, 10, 'And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.');

------------------------------------------------------------------------
-- Persons + place + event for Gen 1:1
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_persons (person_euid, display_name, canonical_name) VALUES
  ('PER-YHVH_1',   'YHVH (God)', 'YHVH'),
  ('PER-elohim_1', 'Elohim',     'Elohim');

INSERT OR REPLACE INTO bible_person_enrichment (person_euid, birth_year, death_year, family, occupations) VALUES
  ('PER-YHVH_1', NULL, NULL, NULL, 'Creator');

INSERT OR REPLACE INTO bible_person_verses (person_euid, verse_euid) VALUES
  ('PER-YHVH_1', 'GN-001-001'),
  ('PER-YHVH_1', 'GN-001-003'),
  ('PER-YHVH_1', 'GN-001-004'),
  ('PER-elohim_1', 'GN-001-001');

INSERT OR REPLACE INTO bible_places (place_euid, place_name) VALUES
  ('PLC-heaven_1', 'heaven'),
  ('PLC-earth_1',  'earth');

INSERT OR REPLACE INTO bible_place_verses (place_euid, verse_euid) VALUES
  ('PLC-heaven_1', 'GN-001-001'),
  ('PLC-earth_1',  'GN-001-001'),
  ('PLC-earth_1',  'GN-001-002');

INSERT OR REPLACE INTO timeline_periods (period_euid, period_name, start_year, end_year, epoch_euid) VALUES
  ('PRD-creation_week', 'Creation Week', NULL, NULL, NULL);

INSERT OR REPLACE INTO timeline_events (event_euid, event_name, event_year, period_euid) VALUES
  ('EVT-creation_1', 'Creation of the heavens and the earth', NULL, 'PRD-creation_week'),
  ('EVT-light_1',    'Creation of light',                     NULL, 'PRD-creation_week');

INSERT OR REPLACE INTO timeline_event_verses (event_euid, verse_euid) VALUES
  ('EVT-creation_1', 'GN-001-001'),
  ('EVT-light_1',    'GN-001-003');

------------------------------------------------------------------------
-- Commentary on Gen 1:1
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_commentary (id, verse_euid, source, commentary_text) VALUES
  (1, 'GN-001-001', 'macarthur',
   'In the beginning. The Bible begins with a presupposition: the existence of God. No attempt is made to prove the existence of God. He is presupposed in the opening words. God created. The Hebrew verb bara, used here, is reserved in Scripture for divine activity — bringing into existence that which had no prior existence. The heavens and the earth. This phrase is a Hebrew merism designating the totality of the universe.'),
  (2, 'GN-001-001', 'matthew_henry',
   'In these verses we have the work of creation in its embryo, and in its birth. The work of creation is so wonderfully great, that it is not at all strange that everyone speaks of it according to the impression it makes upon him.'),
  (3, 'GN-001-003', 'macarthur',
   'Let there be light. The first divine fiat. Before the sun (created on the fourth day), God established the principle of light itself.');

------------------------------------------------------------------------
-- Hebrew interlinear for Gen 1:1 (BSB)
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_bsb_interlinear
  (word_euid, verse_euid, word_position, language, wlc_nestle_base, strongs_number, transliteration, bsb_english, morphology) VALUES
  ('GN-001-001-W0001', 'GN-001-001', 1, 'Hebrew', 'בְּרֵאשִׁ֖ית',  'H7225', 'bereshit',     'In the beginning', 'Prep-b | N-fs'),
  ('GN-001-001-W0002', 'GN-001-001', 2, 'Hebrew', 'בָּרָ֣א',       'H1254', 'bara',         'created',          'V-Qal-Perf-3ms'),
  ('GN-001-001-W0003', 'GN-001-001', 3, 'Hebrew', 'אֱלֹהִ֑ים',     'H0430', 'Elohim',       'God',              'N-mp'),
  ('GN-001-001-W0004', 'GN-001-001', 4, 'Hebrew', 'אֵ֥ת',         'H0853', 'et',           '-',                'DirObjM'),
  ('GN-001-001-W0005', 'GN-001-001', 5, 'Hebrew', 'הַשָּׁמַ֖יִם',  'H8064', 'hashamayim',   'the heavens',      'Art | N-mp'),
  ('GN-001-001-W0006', 'GN-001-001', 6, 'Hebrew', 'וְאֵ֥ת',        'H0853', 've-et',        'and -',            'Conj | DirObjM'),
  ('GN-001-001-W0007', 'GN-001-001', 7, 'Hebrew', 'הָאָֽרֶץ׃',     'H0776', 'ha-aretz',     'the earth',        'Art | N-fs');

INSERT OR REPLACE INTO bible_strongs_dictionary
  (strongs_number, transliteration, pronunciation, short_definition, definition) VALUES
  ('H7225', 'reshith',  'ray-sheeth''',  'beginning, chief',
   'From the same as H7218; the first, in place, time, order or rank (specifically a firstfruit).'),
  ('H1254', 'bara',     'baw-raw''',     'to create',
   'A primitive root; (absolutely) to create; (qualified) to cut down (a wood), select, feed (as formative processes).'),
  ('H0430', 'elohim',   'el-o-heem''',   'gods, God',
   'Plural of H0433; gods in the ordinary sense; but specifically used (in the plural thus, especially with the article) of the supreme God.'),
  ('H8064', 'shamayim', 'shaw-mah''-yim','heaven, sky',
   'The sky (as aloft; the dual perhaps alluding to the visible arch in which the clouds move, as well as to the higher ether where the celestial bodies revolve).'),
  ('H0776', 'erets',    'eh''-rets',     'earth, land',
   'From an unused root probably meaning to be firm; the earth (at large, or partitively a land).');

------------------------------------------------------------------------
-- KJV word index for Gen 1:1
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_word_index_kjv
  (word_euid, verse_euid, word_position, word_text, person_euid, place_euid, year) VALUES
  ('GN-001-001-W0001', 'GN-001-001', 1, 'In',        NULL,         NULL,           NULL),
  ('GN-001-001-W0002', 'GN-001-001', 2, 'the',       NULL,         NULL,           NULL),
  ('GN-001-001-W0003', 'GN-001-001', 3, 'beginning', NULL,         NULL,           NULL),
  ('GN-001-001-W0004', 'GN-001-001', 4, 'God',       'PER-YHVH_1', NULL,           NULL),
  ('GN-001-001-W0005', 'GN-001-001', 5, 'created',   NULL,         NULL,           NULL),
  ('GN-001-001-W0006', 'GN-001-001', 6, 'the',       NULL,         NULL,           NULL),
  ('GN-001-001-W0007', 'GN-001-001', 7, 'heaven',    NULL,         'PLC-heaven_1', NULL),
  ('GN-001-001-W0008', 'GN-001-001', 8, 'and',       NULL,         NULL,           NULL),
  ('GN-001-001-W0009', 'GN-001-001', 9, 'the',       NULL,         NULL,           NULL),
  ('GN-001-001-W0010', 'GN-001-001',10, 'earth',     NULL,         'PLC-earth_1',  NULL);

------------------------------------------------------------------------
-- Concordance + topical index (light)
------------------------------------------------------------------------

INSERT OR REPLACE INTO bible_bsb_concordance (id, verse_euid, word_position, word_text) VALUES
  (1,  'GN-001-001', 4,  'God'),
  (2,  'GN-001-001', 7,  'heaven'),
  (3,  'GN-001-001', 10, 'earth'),
  (4,  'GN-001-002', 12, 'darkness'),
  (5,  'GN-001-003', 7,  'light'),
  (6,  'GN-001-004', 4,  'light'),
  (7,  'GN-001-005', 5,  'Day');

INSERT OR REPLACE INTO bible_bsb_topical_index (id, topic, verse_euid) VALUES
  (1, 'Creation',  'GN-001-001'),
  (2, 'God',       'GN-001-001'),
  (3, 'Beginning', 'GN-001-001'),
  (4, 'Creation',  'GN-001-002'),
  (5, 'Light',     'GN-001-003'),
  (6, 'Light',     'GN-001-004'),
  (7, 'Day',       'GN-001-005');

------------------------------------------------------------------------
-- Translations catalog + sample BSB verses
------------------------------------------------------------------------

INSERT OR REPLACE INTO translations_catalog
  (translation_code, translation_name, language, year_published, source) VALUES
  ('BSB', 'Berean Standard Bible', 'English', 2022, 'Bible Hub'),
  ('NIV', 'New International Version', 'English', 2011, 'Biblica'),
  ('ESV', 'English Standard Version', 'English', 2001, 'Crossway');

INSERT OR REPLACE INTO translations_verses (translation_code, verse_euid, verse_text) VALUES
  ('BSB', 'GN-001-001', 'In the beginning God created the heavens and the earth.'),
  ('BSB', 'GN-001-003', 'And God said, "Let there be light," and there was light.'),
  ('NIV', 'GN-001-001', 'In the beginning God created the heavens and the earth.'),
  ('ESV', 'GN-001-001', 'In the beginning, God created the heavens and the earth.');
