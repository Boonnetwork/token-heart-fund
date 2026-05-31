import React, { useRef, useState } from 'react';
import { uploadToPinata, isPinataConfigured } from '@/lib/pinata';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MediaUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string; // e.g. "image/*,video/*"
  label?: string;
}

/**
 * Reusable Pinata IPFS uploader.
 * Supports either uploading a file (image/video) or pasting an external URL.
 */
export const MediaUpload: React.FC<MediaUploadProps> = ({
  value = '',
  onChange,
  accept = 'image/*,video/*',
  label = 'Media',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPinataConfigured()) {
      toast.error('Pinata is not configured.');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const res = await uploadToPinata(file, setProgress);
      onChange(res.url);
      toast.success('Uploaded to IPFS');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const isVideo = value && /\.(mp4|webm|mov|ogg)$/i.test(value);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Paste URL or upload →"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{progress}%</>
          ) : (
            <><Upload className="w-4 h-4 mr-2" />Upload</>
          )}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {value && (
        <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
          {isVideo ? (
            <video src={value} controls className="w-full max-h-48 object-contain" />
          ) : (
            <img src={value} alt="preview" className="w-full max-h-48 object-contain" />
          )}
        </div>
      )}
    </div>
  );
};
