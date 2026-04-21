# Forge Cloud

Cloudflare Worker backend for the Forge editor. Implements the `StorageAdapter` interface from `@forge/core` — D1 for structured data (notes, annotations, layers, grid metadata), R2 for binary file storage.

## Setup

```bash
# 1. Install
npm install

# 2. Create D1 database
npx wrangler d1 create forge-cloud
# Copy the database_id into wrangler.toml

# 3. Create R2 bucket
npx wrangler r2 bucket create forge-vaults

# 4. Init schema (local dev)
npm run db:init:local

# 5. Dev server
npm run dev

# 6. Deploy to production
npm run deploy
npm run db:init   # init schema on remote D1
```

## API

All routes return JSON. CORS enabled for all origins.

### Vaults

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/vault` | `{ name }` | Create a new vault |
| GET | `/vaults` | — | List all vaults |
| GET | `/vault/:id/files` | — | Get file tree for a vault |

### Notes

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/notes/:vaultId/:path` | — | Read note content |
| PUT | `/notes/:vaultId/:path` | `{ content }` | Create or update note |
| POST | `/notes/:vaultId` | `{ path }` | Create empty note |
| DELETE | `/notes/:vaultId/:path` | — | Delete a note |

### Folders & Items

| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/folders/:vaultId` | `{ path }` | Create folder |
| POST | `/items/rename/:vaultId` | `{ oldPath, newPath }` | Rename file or folder |
| DELETE | `/items/:vaultId/:path` | — | Delete file or folder (recursive) |

### Annotations

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/annotations/:vaultId/:docId` | — | Load annotations for document |
| PUT | `/annotations/:vaultId/:docId` | `Annotation[]` | Save annotations (replace all) |

### Layers

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/layers/:vaultId` | — | Load layer config (returns defaults if none saved) |
| PUT | `/layers/:vaultId` | `LayerConfig` | Save layer config |

### Grid Metadata

| Method | Path | Body | Description |
|--------|------|------|-------------|
| GET | `/grid/:vaultId/:docId` | — | Load grid metadata for document |
| PUT | `/grid/:vaultId/:docId` | JSON | Save grid metadata |

### R2 File Storage

| Method | Path | Body | Description |
|--------|------|------|-------------|
| PUT | `/storage/:vaultId/:key` | Binary body | Upload file (set Content-Type header) |
| GET | `/storage/:vaultId/:key` | — | Download file |
| DELETE | `/storage/:vaultId/:key` | — | Delete file |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{ status: "ok", service: "forge-cloud", version: "0.1.0" }` |

## Architecture

```
Client (Tauri desktop / Web PWA)
    ↓ CloudStorageAdapter
Worker (src/index.ts)
    ├── Router → routes/vaults.ts    → D1 (vaults table)
    ├── Router → routes/notes.ts     → D1 (notes, folders tables)
    ├── Router → routes/annotations.ts → D1 (annotations, layer_configs, grid_meta)
    └── Router → routes/storage.ts   → R2 (binary files)
```

## D1 Schema

See `sql/schema.sql`. Tables: `vaults`, `notes`, `folders`, `annotations`, `layer_configs`, `grid_meta`.

## License

MIT — POF 2828
