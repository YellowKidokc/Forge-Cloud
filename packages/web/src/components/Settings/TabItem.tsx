import { useState, type CSSProperties } from 'react';
import { useDraggable } from '@dnd-kit/core';
import * as Lucide from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SettingsTab, Edge } from './settingsTabStore';
import { TabContextMenu } from './TabContextMenu';

interface Props {
  tab: SettingsTab;
  active: boolean;
  onSelect: () => void;
  onRename: (label: string) => void;
  onColor: (color: string) => void;
  onMove: (edge: Edge) => void;
  onDelete: () => void;
}

function getIcon(name: string): LucideIcon {
  const lib = Lucide as unknown as Record<string, LucideIcon>;
  return lib[name] ?? Lucide.Square;
}

export function TabItem({ tab, active, onSelect, onRename, onColor, onMove, onDelete }: Props) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const Icon = getIcon(tab.icon);
  const isVertical = tab.edge === 'left' || tab.edge === 'right';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: tab.id,
    data: { kind: 'tab', tab },
  });

  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    borderColor: tab.color,
  };

  const baseClass = isVertical
    ? `forge-tab ${tab.edge === 'right' ? 'forge-tab--vertical-right' : 'forge-tab--vertical'}`
    : `forge-tab ${tab.edge === 'bottom' ? 'forge-tab--horizontal-bottom' : 'forge-tab--horizontal'}`;

  const stateClass = active ? 'forge-tab--active' : 'forge-tab--inactive';
  const borderSide =
    tab.edge === 'top' ? 'border-t-2' :
    tab.edge === 'bottom' ? 'border-b-2' :
    tab.edge === 'left' ? 'border-l-2' :
    'border-r-2';

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`${baseClass} ${stateClass} ${borderSide} flex items-center gap-1.5`}
        onClick={onSelect}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        {...attributes}
        {...listeners}
        title={tab.label}
      >
        <Icon size={14} aria-hidden />
        <span>{tab.label}</span>
      </div>
      {menu && (
        <TabContextMenu
          tab={tab}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onRename={onRename}
          onColor={onColor}
          onMove={onMove}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
