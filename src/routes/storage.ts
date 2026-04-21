/** R2 Storage routes — binary file upload/download/delete */

import type { Env } from '../types';
import { json, error } from '../helpers';

// PUT /storage/:vaultId/*key — upload file to R2
export async function uploadFile(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, key } = params;
  const r2Key = `${vaultId}/${key}`;

  const contentType = req.headers.get('Content-Type') || 'application/octet-stream';
  const body = await req.arrayBuffer();

  if (!body || body.byteLength === 0) {
    return error('Empty body');
  }

  await env.STORAGE.put(r2Key, body, {
    httpMetadata: { contentType },
    customMetadata: { vaultId, originalKey: key },
  });

  return json({
    status: 'uploaded',
    key: r2Key,
    size: body.byteLength,
    contentType,
  });
}

// GET /storage/:vaultId/*key — download file from R2
export async function downloadFile(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, key } = params;
  const r2Key = `${vaultId}/${key}`;

  const object = await env.STORAGE.get(r2Key);
  if (!object) {
    return error('File not found', 404);
  }

  const headers = new Headers();
  headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  headers.set('Content-Length', String(object.size));
  headers.set('Access-Control-Allow-Origin', '*');

  // Cache for 1 hour
  headers.set('Cache-Control', 'public, max-age=3600');

  return new Response(object.body, { headers });
}

// DELETE /storage/:vaultId/*key — delete file from R2
export async function deleteFile(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, key } = params;
  const r2Key = `${vaultId}/${key}`;

  await env.STORAGE.delete(r2Key);
  return json({ status: 'deleted', key: r2Key });
}
