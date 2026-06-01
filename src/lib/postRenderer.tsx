import React from 'react';
import { isVideoUrl } from './mediaLibrary';

/**
 * Minimal renderer for post bodies. Supports:
 *   ![alt](url)       → inline image
 *   ![video](url.mp4) → inline video
 * Everything else is rendered as paragraphs with line-break preservation.
 */
export const renderPostBody = (body: string): React.ReactNode => {
  if (!body) return null;
  const regex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(body)) !== null) {
    const [full, alt, url] = match;
    if (match.index > lastIndex) {
      nodes.push(
        <p key={key++} className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
          {body.slice(lastIndex, match.index)}
        </p>,
      );
    }
    if (isVideoUrl(url)) {
      nodes.push(
        <video
          key={key++}
          src={url}
          controls
          className="my-4 w-full rounded-lg border border-border"
        />,
      );
    } else {
      nodes.push(
        <img
          key={key++}
          src={url}
          alt={alt || ''}
          loading="lazy"
          className="my-4 w-full rounded-lg border border-border"
        />,
      );
    }
    lastIndex = match.index + full.length;
  }

  if (lastIndex < body.length) {
    nodes.push(
      <p key={key++} className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
        {body.slice(lastIndex)}
      </p>,
    );
  }

  return <div className="space-y-2">{nodes}</div>;
};

/** Strip markdown image tokens for excerpts. */
export const excerpt = (body: string, max = 180): string => {
  const stripped = body.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
  return stripped.length > max ? stripped.slice(0, max).trim() + '…' : stripped;
};
