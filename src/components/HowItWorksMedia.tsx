import React, { useEffect, useState } from 'react';
import { listMedia, subscribeMedia, isVideoUrl, MediaItem } from '@/lib/mediaLibrary';

export const HowItWorksMedia: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const load = () => setItems(listMedia('how-it-works'));
    load();
    return subscribeMedia(load);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((m) => (
        <div key={m.id} className="glass-card overflow-hidden">
          {m.mediaUrl && (
            <div className="aspect-video bg-muted overflow-hidden">
              {isVideoUrl(m.mediaUrl) ? (
                <video src={m.mediaUrl} controls className="w-full h-full object-cover" />
              ) : (
                <img src={m.mediaUrl} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
              )}
            </div>
          )}
          <div className="p-5">
            <h4 className="font-display text-lg font-semibold text-foreground mb-2">{m.title}</h4>
            {m.body && <p className="text-muted-foreground text-sm whitespace-pre-wrap">{m.body}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};
