/** Annotation routes — CRUD for the 6-slot annotation layer */

import type { Env, Annotation } from '../types';
import { json, error, uid, now } from '../helpers';

// GET /annotations/:vaultId/:documentId — load all annotations for a document
export async function loadAnnotations(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, documentId } = params;

  const result = await env.DB.prepare(
    'SELECT * FROM annotations WHERE vault_id = ? AND document_id = ? ORDER BY created_at'
  ).bind(vaultId, documentId).all();

  const annotations: Annotation[] = (result.results || []).map(rowToAnnotation);
  return json(annotations);
}

// PUT /annotations/:vaultId/:documentId — save annotations (replace all)
export async function saveAnnotations(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, documentId } = params;
  const annotations = await req.json<Annotation[]>();
  const ts = now();

  // Delete existing
  await env.DB.prepare(
    'DELETE FROM annotations WHERE vault_id = ? AND document_id = ?'
  ).bind(vaultId, documentId).run();

  // Insert all new annotations
  for (const ann of annotations) {
    await env.DB.prepare(`
      INSERT INTO annotations
        (id, vault_id, document_id, layer_id, anchor_json, slots_json,
         marker_style, parent_id, child_ids_json, grid_row, grid_col,
         created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      ann.id || uid(),
      vaultId,
      documentId,
      ann.layerId,
      JSON.stringify(ann.anchor),
      JSON.stringify(ann.slots),
      ann.markerStyle,
      ann.parentId,
      JSON.stringify(ann.childIds),
      ann.gridAddress?.row ?? null,
      ann.gridAddress?.col ?? null,
      ann.createdAt || ts,
      ann.updatedAt || ts,
    ).run();
  }

  return json({ status: 'saved', count: annotations.length });
}

// GET /layers/:vaultId — load layer config
export async function loadLayerConfig(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId } = params;

  const result = await env.DB.prepare(
    'SELECT config_json FROM layer_configs WHERE vault_id = ?'
  ).bind(vaultId).first();

  if (!result) {
    // Return default config
    return json(defaultLayerConfig());
  }

  return json(JSON.parse((result as any).config_json));
}

// PUT /layers/:vaultId — save layer config
export async function saveLayerConfig(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId } = params;
  const config = await req.json();
  const ts = now();

  // Upsert
  const existing = await env.DB.prepare(
    'SELECT id FROM layer_configs WHERE vault_id = ?'
  ).bind(vaultId).first();

  if (existing) {
    await env.DB.prepare(
      'UPDATE layer_configs SET config_json = ?, updated_at = ? WHERE vault_id = ?'
    ).bind(JSON.stringify(config), ts, vaultId).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO layer_configs (id, vault_id, config_json, updated_at) VALUES (?, ?, ?, ?)'
    ).bind(uid(), vaultId, JSON.stringify(config), ts).run();
  }

  return json({ status: 'saved' });
}

// GET /grid/:vaultId/:documentId — load grid metadata
export async function loadGridMeta(_req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, documentId } = params;

  const result = await env.DB.prepare(
    'SELECT meta_json FROM grid_meta WHERE vault_id = ? AND document_id = ?'
  ).bind(vaultId, documentId).first();

  if (!result) return json(null);
  return json(JSON.parse((result as any).meta_json));
}

// PUT /grid/:vaultId/:documentId — save grid metadata
export async function saveGridMeta(req: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const { vaultId, documentId } = params;
  const meta = await req.json();
  const ts = now();

  const existing = await env.DB.prepare(
    'SELECT id FROM grid_meta WHERE vault_id = ? AND document_id = ?'
  ).bind(vaultId, documentId).first();

  if (existing) {
    await env.DB.prepare(
      'UPDATE grid_meta SET meta_json = ?, updated_at = ? WHERE vault_id = ? AND document_id = ?'
    ).bind(JSON.stringify(meta), ts, vaultId, documentId).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO grid_meta (id, vault_id, document_id, meta_json, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(uid(), vaultId, documentId, JSON.stringify(meta), ts).run();
  }

  return json({ status: 'saved' });
}

// --- Helpers ---

function rowToAnnotation(row: any): Annotation {
  return {
    id: row.id,
    documentId: row.document_id,
    anchor: JSON.parse(row.anchor_json),
    slots: JSON.parse(row.slots_json),
    layerId: row.layer_id,
    markerStyle: row.marker_style,
    parentId: row.parent_id,
    childIds: JSON.parse(row.child_ids_json || '[]'),
    gridAddress: row.grid_row != null ? { row: row.grid_row, col: row.grid_col } : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function defaultLayerConfig() {
  return {
    layers: [
      { id: 'commentary', name: 'Commentary', color: '#f59e0b', visible: true, markerStyle: 'chevron', defaultSlotLayout: '3-3', order: 0 },
      { id: 'definitions', name: 'Definitions', color: '#3b82f6', visible: true, markerStyle: 'dot', defaultSlotLayout: '3-3', order: 1 },
      { id: 'ai', name: 'AI Analysis', color: '#8b5cf6', visible: true, markerStyle: 'faint', defaultSlotLayout: '3-3', order: 2 },
      { id: 'concordance', name: 'Concordance', color: '#10b981', visible: false, markerStyle: 'superscript', defaultSlotLayout: '3-3', order: 3 },
      { id: 'calculations', name: 'Calculations', color: '#ef4444', visible: false, markerStyle: 'none', defaultSlotLayout: '3-3', order: 4 },
      { id: 'evidence', name: 'Evidence', color: '#ec4899', visible: false, markerStyle: 'underline', defaultSlotLayout: '3-3', order: 5 },
    ],
    markerOpacity: 0.7,
    defaultMarkerStyle: 'chevron',
    defaultLayout: '3-3',
  };
}
