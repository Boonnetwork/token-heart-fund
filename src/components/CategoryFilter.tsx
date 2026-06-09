import React, { useState, useMemo } from 'react';
import { Check, Tag, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CATEGORY_GROUPS, getCategoryBySlug } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface Props {
  selected: string[];
  onChange: (slugs: string[]) => void;
  className?: string;
}

export const CategoryFilter: React.FC<Props> = ({ selected, onChange, className }) => {
  const [open, setOpen] = useState(false);

  const toggle = (slug: string) => {
    if (selected.includes(slug)) onChange(selected.filter((s) => s !== slug));
    else onChange([...selected, slug]);
  };

  const chips = useMemo(
    () => selected.map((s) => getCategoryBySlug(s)).filter(Boolean),
    [selected],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full sm:w-52 justify-between font-normal">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {selected.length > 0 ? `${selected.length} categor${selected.length > 1 ? 'ies' : 'y'}` : 'Categories'}
            </span>
            <ChevronDown className="w-4 h-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories…" />
            <CommandList className="max-h-72">
              <CommandEmpty>No category found.</CommandEmpty>
              {CATEGORY_GROUPS.map(({ group, items }) => (
                <CommandGroup key={group} heading={group}>
                  {items.map((c) => (
                    <CommandItem
                      key={c.slug}
                      value={`${c.label} ${c.slug}`}
                      onSelect={() => toggle(c.slug)}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected.includes(c.slug) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {c.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <Badge
              key={c!.slug}
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 text-xs gap-1 pr-1"
            >
              {c!.label}
              <button
                onClick={() => toggle(c!.slug)}
                className="hover:bg-primary/20 rounded-sm p-0.5"
                aria-label={`Remove ${c!.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={() => onChange([])}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
