import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppBindings } from './env';

import verse from './routes/verse';
import books from './routes/books';
import search from './routes/search';
import person from './routes/person';
import place from './routes/place';
import timeline from './routes/timeline';
import concordance from './routes/concordance';
import topics from './routes/topics';
import translations from './routes/translations';

const app = new Hono<AppBindings>();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: (origin) => origin ?? '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86_400,
  }),
);

app.get('/', (c) =>
  c.json({
    name: 'forge-api',
    version: '0.1.0',
    description: 'Forge Cloud API — cascade query over Bible + research grid',
    docs: '/api',
  }),
);

app.get('/api', (c) =>
  c.json({
    routes: [
      'GET /api/verse/:euid',
      'GET /api/verse/:euid/text',
      'GET /api/verse/:euid/translations',
      'GET /api/verse/:euid/interlinear',
      'GET /api/verse/:euid/words',
      'GET /api/verse/:euid/commentary',
      'GET /api/books',
      'GET /api/book/:code',
      'GET /api/book/:code/:chapter',
      'GET /api/search?q=&scope=kjv|strongs|topics',
      'GET /api/person/:euid',
      'GET /api/persons?q=',
      'GET /api/place/:euid',
      'GET /api/places?q=',
      'GET /api/timeline/periods',
      'GET /api/timeline/events',
      'GET /api/timeline/year/:year',
      'GET /api/concordance/:word',
      'GET /api/topics',
      'GET /api/topics/:topic',
      'GET /api/translations',
      'GET /api/parallel/:euid',
    ],
  }),
);

app.get('/health', (c) => c.json({ ok: true, ts: Date.now() }));

app.route('/api/verse', verse);
app.route('/api/book', books);
app.route('/api/books', books);
app.route('/api/search', search);
app.route('/api', person);
app.route('/api', place);
app.route('/api/timeline', timeline);
app.route('/api/concordance', concordance);
app.route('/api/topics', topics);
app.route('/api', translations);

app.onError((err, c) => {
  console.error('[forge-api] unhandled error:', err);
  return c.json(
    { error: 'internal server error', message: err.message },
    500,
  );
});

app.notFound((c) => c.json({ error: 'not found', path: c.req.path }, 404));

export default app;
