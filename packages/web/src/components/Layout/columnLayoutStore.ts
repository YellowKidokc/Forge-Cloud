import { useSyncExternalStore } from 'react';

export interface ColumnState {
  id: string;
  size: number;       // percent
  collapsed: boolean;
  visible: boolean;
}

const KEY = 'forge.columns.v1';

const DEFAULT_STATE: ColumnState[] = [
  { id: 'col-1', size: 100, collapsed: false, visible: true },
  { id: 'col-2', size: 0,   collapsed: false, visible: false },
  { id: 'col-3', size: 0,   collapsed: false, visible: false },
];

function loadInitial(): ColumnState[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as ColumnState[];
    if (!Array.isArray(parsed) || parsed.length !== 3) return DEFAULT_STATE;
    return parsed;
  } catch {
    return DEFAULT_STATE;
  }
}

let state: ColumnState[] = loadInitial();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(KEY, JSON.stringify(state));
  for (const l of listeners) l();
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function getSnapshot() { return state; }

export function useColumnState() {
  const columns = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const toggleSecond = () => {
    const [c1, c2, c3] = state;
    if (c2.visible) {
      state = [
        { ...c1, size: 100 },
        { ...c2, visible: false, size: 0 },
        c3,
      ];
    } else {
      state = [
        { ...c1, size: 50 },
        { ...c2, visible: true, size: c3.visible ? 25 : 50, collapsed: false },
        c3.visible ? { ...c3, size: 25 } : c3,
      ];
    }
    emit();
  };

  const toggleThird = () => {
    const [c1, c2, c3] = state;
    if (c3.visible) {
      state = [
        c1,
        c2.visible ? { ...c2, size: 100 - c1.size } : c2,
        { ...c3, visible: false, size: 0 },
      ];
    } else if (!c2.visible) {
      state = [
        { ...c1, size: 50 },
        { ...c2, visible: true, size: 25, collapsed: false },
        { ...c3, visible: true, size: 25, collapsed: false },
      ];
    } else {
      state = [
        { ...c1, size: 40 },
        { ...c2, size: 30 },
        { ...c3, visible: true, size: 30, collapsed: false },
      ];
    }
    emit();
  };

  const toggleCollapsed = (id: string) => {
    state = state.map((c) => c.id === id ? { ...c, collapsed: !c.collapsed } : c);
    emit();
  };

  const setSizes = (sizes: number[]) => {
    let i = 0;
    let changed = false;
    const next = state.map((c) => {
      if (!c.visible) return c;
      const newSize = sizes[i++] ?? c.size;
      if (newSize !== c.size) changed = true;
      return { ...c, size: newSize };
    });
    if (changed) {
      state = next;
      emit();
    }
  };

  return { columns, toggleSecond, toggleThird, toggleCollapsed, setSizes };
}
