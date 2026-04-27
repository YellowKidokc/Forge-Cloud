import { useEffect, useState, useCallback } from 'react';
import { v4 as uuid } from 'uuid';

export type Edge = 'top' | 'bottom' | 'left' | 'right';

export interface SettingsTab {
  id: string;
  label: string;
  color: string;
  edge: Edge;
  order: number;
  icon: string;
  placeholder: string;
}

const STORAGE_KEY = 'forge.settings.tabs.v1';
const ACTIVE_KEY = 'forge.settings.activeTab.v1';
const SIZE_KEY = 'forge.settings.modalSize.v1';

export const DEFAULT_TABS: SettingsTab[] = [
  { id: 't_general',    label: 'General',    color: '#ff6b35', edge: 'left',   order: 0, icon: 'Settings',  placeholder: 'General settings — coming soon' },
  { id: 't_editor',     label: 'Editor',     color: '#ff6b35', edge: 'left',   order: 1, icon: 'Type',      placeholder: 'Editor settings — coming soon' },
  { id: 't_appearance', label: 'Appearance', color: '#ff6b35', edge: 'left',   order: 2, icon: 'Palette',   placeholder: 'Appearance settings — coming soon' },
  { id: 't_ai',         label: 'AI',         color: '#3b82f6', edge: 'left',   order: 3, icon: 'Bot',       placeholder: 'AI configuration — coming soon' },
  { id: 't_hotkeys',    label: 'Hotkeys',    color: '#ff6b35', edge: 'left',   order: 4, icon: 'Keyboard',  placeholder: 'Hotkey configuration — coming soon' },
  { id: 't_plugins',    label: 'Plugins',    color: '#10b981', edge: 'bottom', order: 0, icon: 'Puzzle',    placeholder: 'Plugin management — coming soon' },
  { id: 't_documents',  label: 'Documents',  color: '#8b5cf6', edge: 'right',  order: 0, icon: 'FileText',  placeholder: 'Document settings — coming soon' },
];

interface ModalSize {
  width: number;
  height: number;
}

export const DEFAULT_SIZE: ModalSize = { width: 800, height: 550 };

function loadTabs(): SettingsTab[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TABS;
    const parsed = JSON.parse(raw) as SettingsTab[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TABS;
    return parsed;
  } catch {
    return DEFAULT_TABS;
  }
}

function saveTabs(tabs: SettingsTab[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
}

function loadActive(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActive(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_KEY, id);
  else localStorage.removeItem(ACTIVE_KEY);
}

export function loadModalSize(): ModalSize {
  try {
    const raw = localStorage.getItem(SIZE_KEY);
    if (!raw) return DEFAULT_SIZE;
    return JSON.parse(raw) as ModalSize;
  } catch {
    return DEFAULT_SIZE;
  }
}

export function saveModalSize(size: ModalSize) {
  localStorage.setItem(SIZE_KEY, JSON.stringify(size));
}

export function useSettingsTabs() {
  const [tabs, setTabsState] = useState<SettingsTab[]>(() => loadTabs());
  const [activeId, setActiveIdState] = useState<string | null>(() => loadActive());

  useEffect(() => { saveTabs(tabs); }, [tabs]);
  useEffect(() => { saveActive(activeId); }, [activeId]);

  const setActive = useCallback((id: string | null) => setActiveIdState(id), []);

  const moveTabToEdge = useCallback((tabId: string, edge: Edge, beforeId?: string) => {
    setTabsState((prev) => {
      const moving = prev.find((t) => t.id === tabId);
      if (!moving) return prev;
      const others = prev.filter((t) => t.id !== tabId);
      const targetEdge = others.filter((t) => t.edge === edge).sort((a, b) => a.order - b.order);
      let insertIndex = targetEdge.length;
      if (beforeId) {
        const i = targetEdge.findIndex((t) => t.id === beforeId);
        if (i >= 0) insertIndex = i;
      }
      const newTargetEdge = [
        ...targetEdge.slice(0, insertIndex),
        { ...moving, edge },
        ...targetEdge.slice(insertIndex),
      ].map((t, i) => ({ ...t, order: i }));
      const otherEdges = others.filter((t) => t.edge !== edge);
      return [...otherEdges, ...newTargetEdge];
    });
  }, []);

  const renameTab = useCallback((tabId: string, label: string) => {
    setTabsState((prev) => prev.map((t) => (t.id === tabId ? { ...t, label } : t)));
  }, []);

  const colorTab = useCallback((tabId: string, color: string) => {
    setTabsState((prev) => prev.map((t) => (t.id === tabId ? { ...t, color } : t)));
  }, []);

  const deleteTab = useCallback((tabId: string) => {
    setTabsState((prev) => {
      const remaining = prev.filter((t) => t.id !== tabId);
      const renumbered = remaining.map((t) => {
        const peers = remaining.filter((p) => p.edge === t.edge).sort((a, b) => a.order - b.order);
        return { ...t, order: peers.findIndex((p) => p.id === t.id) };
      });
      return renumbered;
    });
    if (activeId === tabId) setActiveIdState(null);
  }, [activeId]);

  const addTab = useCallback((tab: Omit<SettingsTab, 'id' | 'order'>) => {
    setTabsState((prev) => {
      const peers = prev.filter((t) => t.edge === tab.edge);
      const order = peers.length;
      return [...prev, { ...tab, id: uuid(), order }];
    });
  }, []);

  const resetTabs = useCallback(() => setTabsState(DEFAULT_TABS), []);

  return {
    tabs,
    activeId,
    setActive,
    moveTabToEdge,
    renameTab,
    colorTab,
    deleteTab,
    addTab,
    resetTabs,
  };
}

export function tabsByEdge(tabs: SettingsTab[], edge: Edge): SettingsTab[] {
  return tabs.filter((t) => t.edge === edge).sort((a, b) => a.order - b.order);
}
