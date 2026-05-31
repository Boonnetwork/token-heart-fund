// Lightweight client-side media + content library.
// Persists user-curated entries (blog posts, news, "how it works" media, etc.)
// in localStorage so the admin can publish without a backend.

export type MediaCategory = 'blog' | 'news' | 'how-it-works' | 'general';

export interface MediaItem {
  id: string;
  category: MediaCategory;
  title: string;
  body?: string;        // markdown / plain text
  mediaUrl?: string;    // Pinata / external URL (image or video)
  createdAt: number;
}

const KEY = 'chainfunder.media';

const read = (): MediaItem[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as MediaItem[]) : [];
  } catch {
    return [];
  }
};

const write = (items: MediaItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('media-library-updated'));
};

export const listMedia = (category?: MediaCategory): MediaItem[] => {
  const all = read().sort((a, b) => b.createdAt - a.createdAt);
  return category ? all.filter((m) => m.category === category) : all;
};

export const addMedia = (item: Omit<MediaItem, 'id' | 'createdAt'>): MediaItem => {
  const created: MediaItem = {
    ...item,
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  write([created, ...read()]);
  return created;
};

export const updateMedia = (id: string, patch: Partial<MediaItem>) => {
  write(read().map((m) => (m.id === id ? { ...m, ...patch } : m)));
};

export const deleteMedia = (id: string) => {
  write(read().filter((m) => m.id !== id));
};

/** Subscribe React components to library updates (returns unsubscribe). */
export const subscribeMedia = (cb: () => void): (() => void) => {
  const handler = () => cb();
  window.addEventListener('media-library-updated', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('media-library-updated', handler);
    window.removeEventListener('storage', handler);
  };
};

export const isVideoUrl = (url?: string) =>
  !!url && /\.(mp4|webm|mov|ogg)$/i.test(url);
