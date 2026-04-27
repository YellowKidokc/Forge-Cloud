import { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { SettingsModal } from './components/Settings/SettingsModal';
import { ColumnLayout } from './components/Layout/ColumnLayout';
import { useColumnState } from './components/Layout/columnLayoutStore';
import { PlaceholderEditor } from './components/Editor/PlaceholderEditor';

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { toggleSecond, toggleThird } = useColumnState();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;

      if (e.key === ',') {
        e.preventDefault();
        setSettingsOpen((v) => !v);
        return;
      }
      if (e.key === '\\' && !e.shiftKey) {
        e.preventDefault();
        toggleSecond();
        return;
      }
      if (e.key === '\\' && e.shiftKey) {
        e.preventDefault();
        toggleThird();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSecond, toggleThird]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-forge-bg text-zinc-200">
      <Sidebar onOpenSettings={() => setSettingsOpen(true)} />
      <main className="flex-1 min-w-0">
        <ColumnLayout
          renderColumn={(id, idx) => <PlaceholderEditor columnId={id} index={idx} />}
        />
      </main>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
