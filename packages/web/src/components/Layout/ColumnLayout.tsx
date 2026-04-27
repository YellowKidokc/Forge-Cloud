import { useRef, type ReactNode } from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from 'react-resizable-panels';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useColumnState, type ColumnState } from './columnLayoutStore';

interface Props {
  renderColumn: (id: string, index: number) => ReactNode;
}

export function ColumnLayout({ renderColumn }: Props) {
  const { columns, setSizes, toggleCollapsed } = useColumnState();
  const panelRefs = useRef<Record<string, ImperativePanelHandle | null>>({});

  const visibleColumns = columns.filter((c) => c.visible);
  const visibleSizes = visibleColumns.map((c) => c.size);

  const handleResize = (sizes: number[]) => {
    const next = columns.map((c) => ({ ...c }));
    let i = 0;
    for (const c of next) {
      if (c.visible) c.size = sizes[i++] ?? c.size;
    }
    setSizes(next.map((c) => c.size));
  };

  return (
    <div className="h-full w-full">
      <PanelGroup
        direction="horizontal"
        onLayout={handleResize}
        autoSaveId="forge-column-group"
      >
        {visibleColumns.map((col, idx) => (
          <ColumnPanel
            key={col.id}
            col={col}
            isLast={idx === visibleColumns.length - 1}
            initialSize={visibleSizes[idx]}
            registerRef={(h) => (panelRefs.current[col.id] = h)}
            onToggleCollapse={() => toggleCollapsed(col.id)}
          >
            {renderColumn(col.id, idx)}
          </ColumnPanel>
        ))}
      </PanelGroup>
    </div>
  );
}

interface ColumnPanelProps {
  col: ColumnState;
  isLast: boolean;
  initialSize: number;
  registerRef: (h: ImperativePanelHandle | null) => void;
  onToggleCollapse: () => void;
  children: ReactNode;
}

function ColumnPanel({
  col, isLast, initialSize, registerRef, onToggleCollapse, children,
}: ColumnPanelProps) {
  return (
    <>
      <Panel
        id={col.id}
        ref={registerRef}
        defaultSize={initialSize}
        minSize={col.collapsed ? 1 : 15}
        collapsible
        collapsedSize={1}
        className="flex"
      >
        <div className="relative flex-1 flex h-full overflow-hidden bg-forge-panel">
          {col.collapsed ? (
            <button
              onClick={onToggleCollapse}
              className="flex h-full w-full items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Expand column"
            >
              <ChevronRight size={14} />
            </button>
          ) : (
            <div className="flex-1 min-w-0 overflow-auto">{children}</div>
          )}
          {!col.collapsed && (
            <button
              onClick={onToggleCollapse}
              className="absolute top-1 right-1 z-10 rounded p-1 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
              title="Collapse column"
              aria-label="Collapse column"
            >
              <ChevronLeft size={12} />
            </button>
          )}
        </div>
      </Panel>
      {!isLast && <ColumnDivider onDoubleClick={onToggleCollapse} />}
    </>
  );
}

function ColumnDivider({ onDoubleClick }: { onDoubleClick: () => void }) {
  return (
    <PanelResizeHandle className="group relative w-1 bg-zinc-800 hover:bg-zinc-600 data-[resize-handle-active]:bg-forge-ember transition-colors">
      <div
        onDoubleClick={onDoubleClick}
        className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize"
      />
    </PanelResizeHandle>
  );
}
