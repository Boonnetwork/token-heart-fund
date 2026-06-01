import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MediaUpload } from './MediaUpload';
import {
  addMedia,
  deleteMedia,
  listMedia,
  subscribeMedia,
  isVideoUrl,
  MediaCategory,
  MediaItem,
} from '@/lib/mediaLibrary';
import { Trash2, Plus, ImagePlus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToPinata, isPinataConfigured } from '@/lib/pinata';

const CATEGORIES: { value: MediaCategory; label: string }[] = [
  { value: 'blog', label: 'Blog Post' },
  { value: 'news', label: 'News Update' },
  { value: 'how-it-works', label: 'How It Works (media)' },
  { value: 'general', label: 'General' },
];

export const MediaManager: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState({
    category: 'blog' as MediaCategory,
    title: '',
    body: '',
    mediaUrl: '',
  });
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const inlineFileRef = useRef<HTMLInputElement>(null);
  const [inlineUploading, setInlineUploading] = useState(false);

  useEffect(() => {
    const load = () => setItems(listMedia());
    load();
    return subscribeMedia(load);
  }, []);

  const insertAtCursor = (snippet: string) => {
    const ta = bodyRef.current;
    if (!ta) {
      setForm((f) => ({ ...f, body: f.body + snippet }));
      return;
    }
    const start = ta.selectionStart ?? form.body.length;
    const end = ta.selectionEnd ?? form.body.length;
    const next = form.body.slice(0, start) + snippet + form.body.slice(end);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + snippet.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleInlineImage = async (file: File) => {
    if (!isPinataConfigured()) {
      toast.error('Pinata is not configured.');
      return;
    }
    setInlineUploading(true);
    try {
      const { url } = await uploadToPinata(file);
      insertAtCursor(`\n\n![${file.name}](${url})\n\n`);
      toast.success('Image inserted');
    } catch (e: any) {
      toast.error(e?.message || 'Upload failed');
    } finally {
      setInlineUploading(false);
      if (inlineFileRef.current) inlineFileRef.current.value = '';
    }
  };

  const handleAdd = () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    addMedia({
      category: form.category,
      title: form.title.trim(),
      body: form.body.trim() || undefined,
      mediaUrl: form.mediaUrl.trim() || undefined,
    });
    setForm({ category: form.category, title: '', body: '', mediaUrl: '' });
    toast.success('Published');
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Media & Content Library</CardTitle>
        <CardDescription>
          Publish blog posts, news, and "How it works" media. Items appear automatically on the
          public pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as MediaCategory })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Post title…"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Body (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => inlineFileRef.current?.click()}
                disabled={inlineUploading}
              >
                {inlineUploading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Uploading…</>
                ) : (
                  <><ImagePlus className="w-3.5 h-3.5 mr-1.5" />Insert image</>
                )}
              </Button>
              <input
                ref={inlineFileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleInlineImage(f);
                }}
              />
            </div>
            <Textarea
              ref={bodyRef}
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your update… Use the Insert image button to embed images inside the post."
            />
            <p className="text-xs text-muted-foreground">
              Inline images use markdown syntax: <code>![alt](url)</code>
            </p>
          </div>
          <MediaUpload
            label="Image or Video (optional)"
            value={form.mediaUrl}
            onChange={(url) => setForm({ ...form, mediaUrl: url })}
          />
          <Button variant="gradient" onClick={handleAdd} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Publish
          </Button>
        </div>

        <div>
          <h4 className="font-display font-semibold text-foreground mb-3">
            Published ({items.length})
          </h4>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
                >
                  {it.mediaUrl && (
                    <div className="w-14 h-14 rounded overflow-hidden bg-muted shrink-0">
                      {isVideoUrl(it.mediaUrl) ? (
                        <video src={it.mediaUrl} className="w-full h-full object-cover" />
                      ) : (
                        <img src={it.mediaUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wider text-primary font-mono">
                      {it.category}
                    </div>
                    <div className="font-medium text-foreground truncate">{it.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(it.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { deleteMedia(it.id); toast.success('Deleted'); }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
