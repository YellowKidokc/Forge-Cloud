import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import type { Env } from './env';

let pool: Pool | null = null;

export function getPool(env: Env): Pool {
  if (pool) return pool;

  const connectionString = env.HYPERDRIVE?.connectionString ?? env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL (or HYPERDRIVE binding) is not configured');
  }

  pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  env: Env,
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const p = getPool(env);
  return p.query<T>(text, params as never[]);
}
