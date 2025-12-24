import React from 'react';
import { Button } from '@/components/ui/button';
import { Twitter, Facebook, Link as LinkIcon, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ShareButtonsProps {
  title: string;
  url?: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({ 
  title, 
  url = typeof window !== 'undefined' ? window.location.href : '',
  className = ''
}) => {
  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground">Share:</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => window.open(shareLinks.twitter, '_blank', 'width=600,height=400')}
        title="Share on Twitter"
      >
        <Twitter className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => window.open(shareLinks.facebook, '_blank', 'width=600,height=400')}
        title="Share on Facebook"
      >
        <Facebook className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => window.open(shareLinks.telegram, '_blank', 'width=600,height=400')}
        title="Share on Telegram"
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={copyLink}
        title="Copy link"
      >
        <LinkIcon className="w-4 h-4" />
      </Button>
    </div>
  );
};
