const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<{ ok: boolean; ts: number }>('/health'),
  routes: () => request<{ routes: string[] }>('/api'),
  books:  () => request<{ books: Array<{ book_code: string; book_name: string }> }>('/api/books'),
  verse:  (euid: string) => request<unknown>(`/api/verse/${encodeURIComponent(euid)}`),
};
