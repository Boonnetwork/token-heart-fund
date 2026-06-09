import React, { useState } from 'react';
import { Check, ChevronsUpDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  value: string;
  onChange: (slug: string) => void;
  error?: boolean;
}

export const CategorySelect: React.FC<Props> = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const selected = getCategoryBySlug(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal h-10',
            !selected && 'text-muted-foreground',
            error && 'border-destructive',
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Tag className="w-4 h-4 text-primary shrink-0" />
            {selected ? selected.label : 'Select a category'}
          </span>
          <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
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
                    onSelect={() => {
                      onChange(c.slug);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === c.slug ? 'opacity-100' : 'opacity-0',
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
  );
};
