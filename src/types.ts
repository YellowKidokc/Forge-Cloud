/**
 * Forge Cloud Types
 * Mirrors @forge/core types for standalone Cloudflare Worker deployment.
 */

export interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
  ENVIRONMENT: string;
}

// --- Storage ---

export interface FileEntry {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileEntry[];
}

// --- Annotations ---

export interface AnnotationAnchor {
  lineNumber: number;
  from?: number;
  to?: number;
  anchorText: string;
  grain: 'word' | 'phrase' | 'line' | 'block' | 'document';
}

export type SlotContentType =
  | 'commentary' | 'definition' | 'ai-chat' | 'concordance'
  | 'calculation' | 'evidence' | 'metadata' | 'links' | 'custom';

export type MarkerStyle = 'chevron' | 'superscript' | 'dot' | 'faint' | 'underline' | 'none';

export type SlotLayoutPreset = '3-3' | '2-4' | '1-5' | '6-full' | 'custom';

export interface AnnotationSlot {
  id: string;
  position: number;
  mergedWith: number[];
  contentType: SlotContentType;
  label: string;
  body: string;
  data?: Record<string, unknown>;
  source?: string;
  collapsed: boolean;
}

export interface Annotation {
  id: string;
  documentId: string;
  anchor: AnnotationAnchor;
  slots: AnnotationSlot[];
  layerId: string;
  markerStyle: MarkerStyle;
  parentId: string | null;
  childIds: string[];
  gridAddress?: { row: number; col: number };
  createdAt: number;
  updatedAt: number;
}

export interface AnnotationLayer {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  markerStyle: MarkerStyle;
  defaultSlotLayout: SlotLayoutPreset;
  order: number;
}

export interface LayerConfig {
  layers: AnnotationLayer[];
  markerOpacity: number;
  defaultMarkerStyle: MarkerStyle;
  defaultLayout: SlotLayoutPreset;
}

export interface ImportResult {
  success: boolean;
  rowsImported: number;
  errors: string[];
  layerId: string;
}
