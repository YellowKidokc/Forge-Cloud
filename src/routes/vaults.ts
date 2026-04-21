/** Vault routes */

import type { Env } from '../types';
import { json, error, uid, now } from '../helpers';

// POST /vault — create or set active vault
export async function createVault(req: Request, env: Env): Promise<Response> {
  const body = await req.json<{ name: string }>();
  if (!body.name) return error('name required');

  const id = uid();
  const ts = now();

  await env.DB.prepare(
    'INSERT INTO vaults (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).bind(id, body.name, ts, ts).run();

  return json({ id, name: body.name });
}

// GET /vaults — list all vaults
export async function listVaults(_req: Request, env: Env): Promise<Response> {
  const result = await env.DB.prepare(
    'SELECT * FROM vaults ORDER BY updated_at DESC'
  ).all();
  return json({ vaults: result.results });
}

// GET /vault/:id/files — list files in a vault
export async function getVaultFiles(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const vaultId = params.id;

  // Get notes
  const notes = await env.DB.prepare(
    'SELECT path FROM notes WHERE vault_id = ? ORDER BY path'
  ).bind(vaultId).all();

  // Get folders
  const folders = await env.DB.prepare(
    'SELECT path FROM folders WHERE vault_id = ? ORDER BY path'
  ).bind(vaultId).all();

  // Build tree structure
  const tree = buildFileTree(
    (notes.results || []).map((n: any) => n.path),
    (folders.results || []).map((f: any) => f.path)
  );

  return json(tree);
}

function buildFileTree(notePaths: string[], folderPaths: string[]): any[] {
  const root: any[] = [];
  const dirMap = new Map<string, any>();

  // Register all folders
  for (const fp of folderPaths) {
    const parts = fp.split('/');
    const name = parts[parts.length - 1];
    const entry = { name, path: fp, isDir: true, children: [] as any[] };
    dirMap.set(fp, entry);
  }

  // Place folders into their parents
  for (const fp of folderPaths) {
    const parentPath = fp.split('/').slice(0, -1).join('/');
    const parent = dirMap.get(parentPath);
    const entry = dirMap.get(fp)!;
    if (parent) {
      parent.children.push(entry);
    } else {
      root.push(entry);
    }
  }

  // Place notes into their parent folders
  for (const np of notePaths) {
    const parts = np.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');
    const entry = { name, path: np, isDir: false };
    const parent = dirMap.get(parentPath);
    if (parent) {
      parent.children.push(entry);
    } else {
      root.push(entry);
    }
  }

  return root;
}
