import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/Layout';
import { listMedia, subscribeMedia, isVideoUrl, MediaItem } from '@/lib/mediaLibrary';
import { Newspaper } from 'lucide-react';

const Blog: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const load = () =>
      setItems([...listMedia('blog'), ...listMedia('news')].sort((a, b) => b.createdAt - a.createdAt));
    load();
    return subscribeMedia(load);
  }, []);

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <span className="text-xs font-mono text-primary font-bold tracking-wider">BLOG & NEWS</span>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2 mb-3">
            Latest from ChainFunder
          </h1>
          <p className="text-muted-foreground">
            Platform updates, announcements, and ecosystem news.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {items.map((m) => (
              <article key={m.id} className="glass-card overflow-hidden flex flex-col">
                {m.mediaUrl && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    {isVideoUrl(m.mediaUrl) ? (
                      <video src={m.mediaUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.mediaUrl} alt={m.title} className="w-full h-full object-cover" loading="lazy" />
                    )}
                  </div>
                )}
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary font-mono">
                    <span>{m.category}</span>
                    <span className="text-muted-foreground">
                      · {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground">{m.title}</h2>
                  {m.body && (
                    <p className="text-muted-foreground text-sm whitespace-pre-wrap">{m.body}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Blog;
