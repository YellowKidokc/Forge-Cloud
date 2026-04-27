import type { Env } from './env';

export interface QueryResult<T> {
  rows: T[];
  meta: D1Meta | null;
}

export async function query<T = Record<string, unknown>>(
  env: Env,
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const stmt = env.DB.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  const res = await bound.all<T>();
  return { rows: res.results ?? [], meta: res.meta ?? null };
}

export async function queryOne<T = Record<string, unknown>>(
  env: Env,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const stmt = env.DB.prepare(sql);
  const bound = params.length > 0 ? stmt.bind(...params) : stmt;
  return (await bound.first<T>()) ?? null;
}

interface D1Meta {
  duration?: number;
  rows_read?: number;
  rows_written?: number;
}
