import { useDroppable } from '@dnd-kit/core';
import type { SettingsTab, Edge } from './settingsTabStore';
import { tabsByEdge } from './settingsTabStore';
import { TabItem } from './TabItem';

interface Props {
  edge: Edge;
  tabs: SettingsTab[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRename: (id: string, label: string) => void;
  onColor: (id: string, color: string) => void;
  onMove: (id: string, edge: Edge) => void;
  onDelete: (id: string) => void;
}

const containerClass: Record<Edge, string> = {
  top:    'flex-row gap-1 px-3 pt-2 pb-1 border-b border-zinc-800 min-h-[40px]',
  bottom: 'flex-row gap-1 px-3 pb-2 pt-1 border-t border-zinc-800 min-h-[40px]',
  left:   'flex-col gap-1 py-3 pl-2 pr-1 border-r border-zinc-800 min-w-[44px]',
  right:  'flex-col gap-1 py-3 pr-2 pl-1 border-l border-zinc-800 min-w-[44px]',
};

export function TabBar({ edge, tabs, activeId, onSelect, onRename, onColor, onMove, onDelete }: Props) {
  const edgeTabs = tabsByEdge(tabs, edge);
  const { setNodeRef, isOver } = useDroppable({ id: `dropzone-${edge}`, data: { edge } });

  return (
    <div
      ref={setNodeRef}
      className={`flex ${containerClass[edge]} ${isOver ? 'bg-zinc-800/40 ring-1 ring-inset ring-zinc-600' : ''}`}
      data-edge={edge}
    >
      {edgeTabs.length === 0 && (
        <div className="text-[10px] uppercase tracking-wider text-zinc-600 self-center px-1">
          drop here
        </div>
      )}
      {edgeTabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          active={tab.id === activeId}
          onSelect={() => onSelect(tab.id)}
          onRename={(label) => onRename(tab.id, label)}
          onColor={(color) => onColor(tab.id, color)}
          onMove={(e) => onMove(tab.id, e)}
          onDelete={() => onDelete(tab.id)}
        />
      ))}
    </div>
  );
}
