-- Forge Cloud D1 Schema
-- Run: npm run db:init

-- Vaults: a vault is a workspace (like an Obsidian vault)
CREATE TABLE IF NOT EXISTS vaults (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Notes: markdown files within a vault
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(vault_id, path)
);

-- Folders: directory structure within a vault
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(vault_id, path)
);

-- Annotations: the 6-slot annotation points on lines
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  layer_id TEXT NOT NULL,
  anchor_json TEXT NOT NULL,        -- JSON: AnnotationAnchor
  slots_json TEXT NOT NULL,         -- JSON: AnnotationSlot[]
  marker_style TEXT NOT NULL DEFAULT 'chevron',
  parent_id TEXT,
  child_ids_json TEXT DEFAULT '[]', -- JSON: string[]
  grid_row INTEGER,
  grid_col INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Layer configs: per-vault annotation layer settings
CREATE TABLE IF NOT EXISTS layer_configs (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  config_json TEXT NOT NULL,        -- JSON: LayerConfig
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(vault_id)
);

-- Grid metadata: per-document grid cell/row metadata
CREATE TABLE IF NOT EXISTS grid_meta (
  id TEXT PRIMARY KEY,
  vault_id TEXT NOT NULL REFERENCES vaults(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  meta_json TEXT NOT NULL,          -- JSON: serialized grid metadata
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(vault_id, document_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notes_vault ON notes(vault_id);
CREATE INDEX IF NOT EXISTS idx_notes_path ON notes(vault_id, path);
CREATE INDEX IF NOT EXISTS idx_folders_vault ON folders(vault_id);
CREATE INDEX IF NOT EXISTS idx_annotations_doc ON annotations(vault_id, document_id);
CREATE INDEX IF NOT EXISTS idx_annotations_layer ON annotations(vault_id, layer_id);
CREATE INDEX IF NOT EXISTS idx_grid_meta_doc ON grid_meta(vault_id, document_id);
