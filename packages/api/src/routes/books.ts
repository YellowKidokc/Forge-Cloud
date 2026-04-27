import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';
import { isValidBookCode } from '../euid';

const app = new Hono<AppBindings>();

app.get('/', async (c) => {
  const res = await query(
    c.env,
    `SELECT book_code, book_name, testament, book_order, chapter_count
       FROM bible_books
      ORDER BY book_order`,
  );
  return c.json({ books: res.rows });
});

app.get('/:code', async (c) => {
  const code = c.req.param('code').toUpperCase();
  if (!isValidBookCode(code)) return c.json({ error: 'invalid book code' }, 400);

  const [book, chapters] = await Promise.all([
    query(
      c.env,
      `SELECT book_code, book_name, testament, book_order, chapter_count
         FROM bible_books
        WHERE book_code = ?`,
      [code],
    ),
    query(
      c.env,
      `SELECT chapter_num, verse_count
         FROM bible_chapters
        WHERE book_code = ?
        ORDER BY chapter_num`,
      [code],
    ),
  ]);

  if (book.rows.length === 0) return c.json({ error: 'book not found' }, 404);
  return c.json({ book: book.rows[0], chapters: chapters.rows });
});

app.get('/:code/:chapter', async (c) => {
  const code = c.req.param('code').toUpperCase();
  const chapter = Number(c.req.param('chapter'));
  if (!isValidBookCode(code)) return c.json({ error: 'invalid book code' }, 400);
  if (!Number.isInteger(chapter) || chapter <= 0) {
    return c.json({ error: 'invalid chapter number' }, 400);
  }
  const res = await query(
    c.env,
    `SELECT verse_euid, verse_num, verse_text
       FROM bible_verses
      WHERE book_code = ? AND chapter_num = ?
      ORDER BY verse_num`,
    [code, chapter],
  );
  return c.json({ book: code, chapter, verses: res.rows });
});

export default app;
