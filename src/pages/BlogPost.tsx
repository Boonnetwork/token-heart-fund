import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listMedia, subscribeMedia, isVideoUrl, MediaItem, MediaCategory } from '@/lib/mediaLibrary';
import { renderPostBody } from '@/lib/postRenderer';
import { ArrowLeft, Newspaper } from 'lucide-react';

const tagStyles: Record<MediaCategory, string> = {
  blog: 'bg-primary/15 text-primary border-primary/30',
  news: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  'how-it-works': 'bg-muted text-muted-foreground border-border',
  general: 'bg-muted text-muted-foreground border-border',
};

const BlogPost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<MediaItem | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      const found = listMedia().find((m) => m.id === id) || null;
      setPost(found);
      setLoaded(true);
    };
    load();
    return subscribeMedia(load);
  }, [id]);

  if (loaded && !post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <Newspaper className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="font-display text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-muted-foreground mb-6">It may have been removed.</p>
          <Button asChild variant="outline">
            <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20" />
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="container mx-auto px-4 py-10 max-w-3xl">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/blog"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog & News</Link>
        </Button>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${tagStyles[post.category]}`}>
            {post.category}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(post.createdAt).toLocaleString()}
          </span>
        </div>

        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mb-6 break-words">
          {post.title}
        </h1>

        {post.mediaUrl && (
          <div className="rounded-xl overflow-hidden border border-border mb-8 bg-muted">
            {isVideoUrl(post.mediaUrl) ? (
              <video src={post.mediaUrl} controls className="w-full" />
            ) : (
              <img src={post.mediaUrl} alt={post.title} className="w-full" />
            )}
          </div>
        )}

        {post.body && (
          <div className="prose prose-invert max-w-none">
            {renderPostBody(post.body)}
          </div>
        )}
      </article>
    </Layout>
  );
};

export default BlogPost;
