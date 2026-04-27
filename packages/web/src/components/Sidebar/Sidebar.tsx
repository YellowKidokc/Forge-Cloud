import type { ReactNode } from 'react';
import { Settings, FileText, BookOpen, Bot } from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
}

export function Sidebar({ onOpenSettings }: Props) {
  return (
    <aside className="flex w-12 flex-col items-center justify-between border-r border-zinc-800 bg-forge-bg py-3">
      <div className="flex flex-col items-center gap-1">
        <SidebarButton icon={<FileText size={18} />} label="Files" />
        <SidebarButton icon={<BookOpen size={18} />} label="Bible" />
        <SidebarButton icon={<Bot size={18} />} label="AI" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <SidebarButton
          icon={<Settings size={18} />}
          label="Settings (Ctrl+,)"
          onClick={onOpenSettings}
        />
      </div>
    </aside>
  );
}

function SidebarButton(props: { icon: ReactNode; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={props.onClick}
      title={props.label}
      aria-label={props.label}
      className="rounded-md p-2 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
    >
      {props.icon}
    </button>
  );
}
