import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { X } from 'lucide-react';
import {
  useSettingsTabs,
  loadModalSize,
  saveModalSize,
  DEFAULT_SIZE,
  type Edge,
} from './settingsTabStore';
import { TabBar } from './TabBar';
import { SettingsContent } from './SettingsContent';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: Props) {
  const {
    tabs, activeId, setActive,
    moveTabToEdge, renameTab, colorTab, deleteTab,
  } = useSettingsTabs();

  const [size, setSize] = useState(() => loadModalSize());
  const modalRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Persist size after user-driven resize finishes (track via ResizeObserver).
  useEffect(() => {
    if (!open || !modalRef.current) return;
    const el = modalRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      if (w >= 600 && h >= 400) {
        const next = { width: w, height: h };
        setSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  useEffect(() => { saveModalSize(size); }, [size]);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const overData = over.data.current as { edge?: Edge } | undefined;
    if (!overData?.edge) return;
    moveTabToEdge(String(active.id), overData.edge);
  };

  const activeTab = tabs.find((t) => t.id === activeId) ?? null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="forge-settings-backdrop"
          className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            ref={modalRef}
            key="forge-settings-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Forge settings"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              width: size.width,
              height: size.height,
              minWidth: 600,
              minHeight: 400,
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
            className="resize overflow-hidden rounded-lg border border-zinc-800 bg-forge-bg shadow-2xl flex flex-col"
          >
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              {/* TOP edge */}
              <TabBar
                edge="top"
                tabs={tabs}
                activeId={activeId}
                onSelect={setActive}
                onRename={renameTab}
                onColor={colorTab}
                onMove={moveTabToEdge}
                onDelete={deleteTab}
              />

              <div className="flex flex-1 min-h-0">
                {/* LEFT edge */}
                <TabBar
                  edge="left"
                  tabs={tabs}
                  activeId={activeId}
                  onSelect={setActive}
                  onRename={renameTab}
                  onColor={colorTab}
                  onMove={moveTabToEdge}
                  onDelete={deleteTab}
                />

                {/* INNER CONTENT BOX */}
                <div className="flex-1 flex flex-col min-w-0">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                    <span className="text-xs uppercase tracking-widest text-zinc-500">Settings</span>
                    <button
                      onClick={onClose}
                      aria-label="Close settings"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 bg-forge-panel">
                    <SettingsContent tab={activeTab} />
                  </div>
                </div>

                {/* RIGHT edge */}
                <TabBar
                  edge="right"
                  tabs={tabs}
                  activeId={activeId}
                  onSelect={setActive}
                  onRename={renameTab}
                  onColor={colorTab}
                  onMove={moveTabToEdge}
                  onDelete={deleteTab}
                />
              </div>

              {/* BOTTOM edge */}
              <TabBar
                edge="bottom"
                tabs={tabs}
                activeId={activeId}
                onSelect={setActive}
                onRename={renameTab}
                onColor={colorTab}
                onMove={moveTabToEdge}
                onDelete={deleteTab}
              />
            </DndContext>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Re-export for convenience
export { DEFAULT_SIZE };
