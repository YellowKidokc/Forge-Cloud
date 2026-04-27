import type { SettingsTab } from './settingsTabStore';

interface Props {
  tab: SettingsTab | null;
}

export function SettingsContent({ tab }: Props) {
  if (!tab) {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        <div className="text-center">
          <p className="text-sm">Pick a tab from any edge.</p>
          <p className="text-xs mt-1 text-zinc-600">Drag tabs between edges. Right-click for actions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block h-3 w-3 rounded-sm" style={{ background: tab.color }} />
        <h2 className="text-lg font-semibold text-zinc-100">{tab.label}</h2>
      </div>
      <p className="text-sm text-zinc-400">{tab.placeholder}</p>
    </div>
  );
}
