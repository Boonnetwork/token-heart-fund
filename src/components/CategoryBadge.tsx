import React from 'react';
import { Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface Props {
  category?: Category;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<Props> = ({ category, className, size = 'sm' }) => {
  if (!category) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        'bg-primary/10 text-primary border-primary/30 font-medium backdrop-blur-sm',
        size === 'sm' ? 'text-xs' : 'text-sm px-3 py-1',
        className,
      )}
    >
      <Tag className={cn(size === 'sm' ? 'w-3 h-3 mr-1' : 'w-3.5 h-3.5 mr-1.5')} />
      {category.label}
    </Badge>
  );
};
