/**
 * FORGE CLOUD — Cloudflare Worker
 *
 * Implements the StorageAdapter interface from @forge/core
 * backed by D1 (structured data) + R2 (file storage).
 *
 * API Surface:
 *   POST   /vault                          — create vault
 *   GET    /vaults                          — list vaults
 *   GET    /vault/:id/files                 — file tree
 *   GET    /notes/:vaultId/*path            — read note
 *   PUT    /notes/:vaultId/*path            — write note
 *   POST   /notes/:vaultId                  — create note
 *   DELETE /notes/:vaultId/*path            — delete note
 *   POST   /folders/:vaultId               — create folder
 *   POST   /items/rename/:vaultId          — rename item
 *   DELETE /items/:vaultId/*path            — delete item
 *   GET    /annotations/:vaultId/:docId     — load annotations
 *   PUT    /annotations/:vaultId/:docId     — save annotations
 *   GET    /layers/:vaultId                 — load layer config
 *   PUT    /layers/:vaultId                 — save layer config
 *   GET    /grid/:vaultId/:docId            — load grid meta
 *   PUT    /grid/:vaultId/:docId            — save grid meta
 *   PUT    /storage/:vaultId/*key           — upload to R2
 *   GET    /storage/:vaultId/*key           — download from R2
 *   DELETE /storage/:vaultId/*key           — delete from R2
 *   GET    /health                          — health check
 */

import type { Env } from './types';
import { Router } from './router';
import { json } from './helpers';

import { createVault, listVaults, getVaultFiles } from './routes/vaults';
import {
  readNote, writeNote, createNote, deleteNote,
  createFolder, renameItem, deleteItem,
} from './routes/notes';
import {
  loadAnnotations, saveAnnotations,
  loadLayerConfig, saveLayerConfig,
  loadGridMeta, saveGridMeta,
} from './routes/annotations';
import {
  uploadFile, downloadFile, deleteFile,
} from './routes/storage';

const router = new Router();

// Health
router.get('/health', async () => json({ status: 'ok', service: 'forge-cloud', version: '0.1.0' }));

// Vaults
router.post('/vault', createVault);
router.get('/vaults', listVaults);
router.get('/vault/:id/files', getVaultFiles);

// Notes — *path captures nested paths like folder/sub/note.md
router.get('/notes/:vaultId/*path', readNote);
router.put('/notes/:vaultId/*path', writeNote);
router.post('/notes/:vaultId', createNote);
router.delete('/notes/:vaultId/*path', deleteNote);

// Folders & Items
router.post('/folders/:vaultId', createFolder);
router.post('/items/rename/:vaultId', renameItem);
router.delete('/items/:vaultId/*path', deleteItem);

// Annotations
router.get('/annotations/:vaultId/:documentId', loadAnnotations);
router.put('/annotations/:vaultId/:documentId', saveAnnotations);

// Layer Config
router.get('/layers/:vaultId', loadLayerConfig);
router.put('/layers/:vaultId', saveLayerConfig);

// Grid Meta
router.get('/grid/:vaultId/:documentId', loadGridMeta);
router.put('/grid/:vaultId/:documentId', saveGridMeta);

// R2 File Storage
router.put('/storage/:vaultId/*key', uploadFile);
router.get('/storage/:vaultId/*key', downloadFile);
router.delete('/storage/:vaultId/*key', deleteFile);

// --- Worker Export ---

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      return await router.handle(request, env);
    } catch (err: any) {
      return json({ error: err.message || 'Internal error' }, 500);
    }
  },
};
