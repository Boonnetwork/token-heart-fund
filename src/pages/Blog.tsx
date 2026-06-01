import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { listMedia, subscribeMedia, isVideoUrl, MediaItem, MediaCategory } from '@/lib/mediaLibrary';
import { excerpt } from '@/lib/postRenderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, ArrowRight } from 'lucide-react';

type Filter = 'all' | 'blog' | 'news';

const Blog: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    const load = () =>
      setItems(
        [...listMedia('blog'), ...listMedia('news')].sort((a, b) => b.createdAt - a.createdAt),
      );
    load();
    return subscribeMedia(load);
  }, []);

  const visible = useMemo(
    () => (filter === 'all' ? items : items.filter((i) => i.category === filter)),
    [items, filter],
  );

  const tagStyles: Record<MediaCategory, string> = {
    blog: 'bg-primary/15 text-primary border-primary/30',
    news: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    'how-it-works': 'bg-muted text-muted-foreground border-border',
    general: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <Layout>
      <section className="container mx-auto px-4 py-12 sm:py-20">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <span className="text-xs font-mono text-primary font-bold tracking-wider">BLOG & NEWS</span>
          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-2 mb-3">
            Latest from ChainFunder
          </h1>
          <p className="text-muted-foreground">
            Platform updates, announcements, and ecosystem news.
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-2 mb-10">
          {(['all', 'blog', 'news'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {visible.map((m) => (
              <Link
                to={`/blog/${m.id}`}
                key={m.id}
                className="glass-card overflow-hidden flex flex-col group hover:border-primary/40 transition-colors"
              >
                {m.mediaUrl && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    {isVideoUrl(m.mediaUrl) ? (
                      <video src={m.mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img
                        src={m.mediaUrl}
                        alt={m.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                )}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${tagStyles[m.category]}`}>
                      {m.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {m.title}
                  </h2>
                  {m.body && (
                    <p className="text-muted-foreground text-sm line-clamp-3">{excerpt(m.body)}</p>
                  )}
                  <span className="mt-auto text-primary text-sm font-medium inline-flex items-center gap-1">
                    Read more <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Blog;
