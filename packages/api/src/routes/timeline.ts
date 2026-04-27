import { Hono } from 'hono';
import type { AppBindings } from '../env';
import { query } from '../db';

const app = new Hono<AppBindings>();

app.get('/periods', async (c) => {
  const res = await query(
    c.env,
    `SELECT period_euid, period_name, start_year, end_year, epoch_euid
       FROM timeline_periods
      ORDER BY start_year, period_euid`,
  );
  return c.json({ periods: res.rows });
});

app.get('/events', async (c) => {
  const limit = Math.min(1000, Number(c.req.query('limit')) || 500);
  const res = await query(
    c.env,
    `SELECT e.event_euid, e.event_name, e.event_year, e.period_euid,
            COUNT(ev.verse_euid) AS verse_count
       FROM timeline_events e
       LEFT JOIN timeline_event_verses ev ON ev.event_euid = e.event_euid
      GROUP BY e.event_euid
      ORDER BY e.event_year, e.event_euid
      LIMIT ?`,
    [limit],
  );
  return c.json({ events: res.rows });
});

app.get('/year/:year', async (c) => {
  const year = Number(c.req.param('year'));
  if (!Number.isFinite(year)) return c.json({ error: 'invalid year' }, 400);
  const [events, persons] = await Promise.all([
    query(
      c.env,
      `SELECT event_euid, event_name, event_year, period_euid
         FROM timeline_events
        WHERE event_year = ?
        ORDER BY event_euid`,
      [year],
    ),
    query(
      c.env,
      `SELECT person_euid, birth_year, death_year
         FROM bible_person_enrichment
        WHERE birth_year = ? OR death_year = ?`,
      [year, year],
    ),
  ]);
  return c.json({ year, events: events.rows, persons: persons.rows });
});

export default app;
