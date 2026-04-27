import { useEffect, useRef, useState } from 'react';
import type { SettingsTab, Edge } from './settingsTabStore';

interface Props {
  tab: SettingsTab;
  x: number;
  y: number;
  onClose: () => void;
  onRename: (label: string) => void;
  onColor: (color: string) => void;
  onMove: (edge: Edge) => void;
  onDelete: () => void;
}

const COLOR_PALETTE = [
  '#ff6b35', '#3b82f6', '#10b981', '#8b5cf6',
  '#ef4444', '#f59e0b', '#14b8a6', '#ec4899',
  '#a3a3a3',
];

export function TabContextMenu(props: Props) {
  const { tab, x, y, onClose, onRename, onColor, onMove, onDelete } = props;
  const ref = useRef<HTMLDivElement>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(tab.label);
  const [showColors, setShowColors] = useState(false);
  const [showMove, setShowMove] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [onClose]);

  const submitRename = () => {
    const v = renameValue.trim();
    if (v) onRename(v);
    onClose();
  };

  const confirmDelete = () => {
    if (window.confirm(`Delete tab "${tab.label}"?`)) {
      onDelete();
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      role="menu"
      style={{ left: x, top: y }}
      className="fixed z-[10000] min-w-[180px] rounded-md border border-zinc-700 bg-zinc-900 py-1 text-sm text-zinc-200 shadow-2xl"
    >
      {renaming ? (
        <div className="px-3 py-2">
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') onClose();
            }}
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm outline-none focus:border-zinc-500"
          />
        </div>
      ) : (
        <button
          className="block w-full px-3 py-1.5 text-left hover:bg-zinc-800"
          onClick={() => setRenaming(true)}
        >
          Rename
        </button>
      )}

      <div className="relative">
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-zinc-800"
          onClick={() => setShowColors((v) => !v)}
        >
          <span>Change color</span>
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: tab.color }} />
        </button>
        {showColors && (
          <div className="grid grid-cols-3 gap-1 px-3 pb-2">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => { onColor(c); onClose(); }}
                style={{ background: c }}
                className="h-6 w-6 rounded border border-zinc-700 hover:scale-110 transition-transform"
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          className="flex w-full items-center justify-between px-3 py-1.5 text-left hover:bg-zinc-800"
          onClick={() => setShowMove((v) => !v)}
        >
          <span>Move to →</span>
          <span className="text-xs uppercase text-zinc-500">{tab.edge}</span>
        </button>
        {showMove && (
          <div className="px-3 pb-2 pt-1 grid grid-cols-2 gap-1">
            {(['top', 'bottom', 'left', 'right'] as Edge[]).map((e) => (
              <button
                key={e}
                disabled={e === tab.edge}
                onClick={() => { onMove(e); onClose(); }}
                className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-xs uppercase tracking-wide hover:bg-zinc-800 disabled:opacity-40"
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="my-1 h-px bg-zinc-800" />
      <button
        className="block w-full px-3 py-1.5 text-left text-red-400 hover:bg-zinc-800"
        onClick={confirmDelete}
      >
        Delete
      </button>
    </div>
  );
}
