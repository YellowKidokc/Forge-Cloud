/** Note routes — CRUD for markdown files */

import type { Env } from '../types';
import { json, error, uid, now } from '../helpers';

// GET /notes/:vaultId/:path+ — read a note
export async function readNote(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, path } = params;

  const result = await env.DB.prepare(
    'SELECT content FROM notes WHERE vault_id = ? AND path = ?'
  ).bind(vaultId, path).first();

  if (!result) return error('Note not found', 404);
  return json({ content: (result as any).content });
}

// PUT /notes/:vaultId/:path+ — create or update a note
export async function writeNote(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, path } = params;
  const body = await req.json<{ content: string }>();
  const ts = now();

  // Upsert
  const existing = await env.DB.prepare(
    'SELECT id FROM notes WHERE vault_id = ? AND path = ?'
  ).bind(vaultId, path).first();

  if (existing) {
    await env.DB.prepare(
      'UPDATE notes SET content = ?, updated_at = ? WHERE vault_id = ? AND path = ?'
    ).bind(body.content, ts, vaultId, path).run();
    return json({ status: 'updated', path });
  }

  const id = uid();
  await env.DB.prepare(
    'INSERT INTO notes (id, vault_id, path, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, vaultId, path, body.content, ts, ts).run();

  // Ensure parent folder exists
  const folderPath = path.split('/').slice(0, -1).join('/');
  if (folderPath) {
    await ensureFolder(env, vaultId, folderPath);
  }

  return json({ status: 'created', id, path });
}

// POST /notes/:vaultId — create a new note
export async function createNote(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId } = params;
  const body = await req.json<{ path: string }>();
  if (!body.path) return error('path required');

  const ts = now();
  const id = uid();

  // Check if already exists
  const existing = await env.DB.prepare(
    'SELECT id FROM notes WHERE vault_id = ? AND path = ?'
  ).bind(vaultId, body.path).first();

  if (existing) return error('Note already exists', 409);

  await env.DB.prepare(
    'INSERT INTO notes (id, vault_id, path, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, vaultId, body.path, '', ts, ts).run();

  // Ensure parent folder
  const folderPath = body.path.split('/').slice(0, -1).join('/');
  if (folderPath) await ensureFolder(env, vaultId, folderPath);

  return json({ status: 'created', id, path: body.path });
}

// DELETE /notes/:vaultId/:path+ — delete a note
export async function deleteNote(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, path } = params;

  await env.DB.prepare(
    'DELETE FROM notes WHERE vault_id = ? AND path = ?'
  ).bind(vaultId, path).run();

  return json({ status: 'deleted', path });
}

// POST /folders/:vaultId — create a folder
export async function createFolder(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId } = params;
  const body = await req.json<{ path: string }>();
  if (!body.path) return error('path required');

  await ensureFolder(env, vaultId, body.path);
  return json({ status: 'created', path: body.path });
}

// POST /items/rename/:vaultId — rename a file or folder
export async function renameItem(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId } = params;
  const body = await req.json<{ oldPath: string; newPath: string }>();
  if (!body.oldPath || !body.newPath) return error('oldPath and newPath required');

  const ts = now();

  // Try note first
  await env.DB.prepare(
    'UPDATE notes SET path = ?, updated_at = ? WHERE vault_id = ? AND path = ?'
  ).bind(body.newPath, ts, vaultId, body.oldPath).run();

  // Try folder — also update all children
  await env.DB.prepare(
    'UPDATE folders SET path = REPLACE(path, ?, ?) WHERE vault_id = ? AND (path = ? OR path LIKE ?)'
  ).bind(body.oldPath, body.newPath, vaultId, body.oldPath, body.oldPath + '/%').run();

  // Update child note paths too
  await env.DB.prepare(
    'UPDATE notes SET path = REPLACE(path, ?, ?), updated_at = ? WHERE vault_id = ? AND path LIKE ?'
  ).bind(body.oldPath, body.newPath, ts, vaultId, body.oldPath + '/%').run();

  return json({ status: 'renamed', oldPath: body.oldPath, newPath: body.newPath });
}

// DELETE /items/:vaultId/:path+ — delete a file or folder
export async function deleteItem(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, path } = params;

  // Delete the note
  await env.DB.prepare(
    'DELETE FROM notes WHERE vault_id = ? AND path = ?'
  ).bind(vaultId, path).run();

  // Delete folder and all children
  await env.DB.prepare(
    'DELETE FROM folders WHERE vault_id = ? AND (path = ? OR path LIKE ?)'
  ).bind(vaultId, path, path + '/%').run();

  await env.DB.prepare(
    'DELETE FROM notes WHERE vault_id = ? AND path LIKE ?'
  ).bind(vaultId, path + '/%').run();

  return json({ status: 'deleted', path });
}

// Helper: ensure folder exists (recursive parent creation)
async function ensureFolder(env: Env, vaultId: string, folderPath: string): Promise<void> {
  const parts = folderPath.split('/');
  let current = '';
  for (const part of parts) {
    current = current ? current + '/' + part : part;
    const exists = await env.DB.prepare(
      'SELECT id FROM folders WHERE vault_id = ? AND path = ?'
    ).bind(vaultId, current).first();
    if (!exists) {
      await env.DB.prepare(
        'INSERT INTO folders (id, vault_id, path, created_at) VALUES (?, ?, ?, ?)'
      ).bind(uid(), vaultId, current, now()).run();
    }
  }
}
