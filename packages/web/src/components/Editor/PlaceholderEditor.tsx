import { useEffect, useState } from 'react';
import { api } from '../../api/client';

interface Props {
  columnId: string;
  index: number;
}

export function PlaceholderEditor({ columnId, index }: Props) {
  const [text, setText] = useState(() => {
    return localStorage.getItem(`forge.editor.${columnId}`) ?? defaultDoc(index);
  });
  const [verse, setVerse] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(`forge.editor.${columnId}`, text);
  }, [text, columnId]);

  const fetchSample = async () => {
    setError(null);
    try {
      const data = await api.verse('GN-001-001');
      setVerse(data);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-1.5 text-xs uppercase tracking-widest text-zinc-500">
        <span>Column {index + 1}</span>
        <button
          onClick={fetchSample}
          className="rounded border border-zinc-700 px-2 py-0.5 text-[10px] hover:bg-zinc-800"
        >
          Test API
        </button>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-1 resize-none bg-transparent p-4 font-mono text-sm text-zinc-200 outline-none"
        spellCheck={false}
      />
      {(verse || error) && (
        <div className="border-t border-zinc-800 bg-black/30 p-3 text-[11px]">
          {error ? (
            <pre className="text-red-400 whitespace-pre-wrap">{error}</pre>
          ) : (
            <pre className="text-zinc-300 whitespace-pre-wrap max-h-48 overflow-auto">
              {JSON.stringify(verse, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function defaultDoc(index: number): string {
  if (index === 0) {
    return `# Forge Cloud — Column 1

This is the writing surface. The TipTap editor and Layer 2 grid will replace this textarea in a later step.

For now: type freely. State persists per column to localStorage. Click "Test API" to fetch the cascade for Genesis 1:1 from the live worker.

Try:
- Ctrl+,        Open settings
- Ctrl+\\       Toggle second column
- Ctrl+Shift+\\ Toggle third column
- Drag any settings tab between edges
- Right-click a tab for rename / color / move / delete
- Double-click a column divider to collapse the right side`;
  }
  return `# Column ${index + 1}\n\nWrite anywhere.`;
}
