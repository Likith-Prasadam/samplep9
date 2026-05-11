import { useMemo, useState, useRef, useEffect } from 'react';
import { Globe2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useTimezone } from '@/hooks/use-timezone';
import { useRefreshToken } from '@/hooks/use-refresh-token';
import { cn } from '@/lib/utils';

export function TimezoneDropdown() {
  const { selectedTimezone, setSelectedTimezone, availableTimezones } =
    useTimezone();
  const { refreshTokenWithTimezone } = useRefreshToken();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const orderedTimezones = useMemo(() => {
    const rest = Array.from(availableTimezones).filter(
      (tz) => tz.iana !== selectedTimezone.iana
    );
    return [selectedTimezone, ...rest];
  }, [availableTimezones, selectedTimezone]);

  useEffect(() => {
    if (!search) return;
    const scrollToTop = () => listRef.current?.scrollTo({ top: 0 });
    const id = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(id);
  }, [search]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) setSearch('');
  };

  const handleSelect = (iana: string) => {
    const match = availableTimezones.find((tz) => tz.iana === iana);
    if (match) {
      setSelectedTimezone(match);
      // Sync new timezone with backend so the session uses it
      void refreshTokenWithTimezone(match.iana);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-muted-foreground shadow-sm transition-colors',
            'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            isOpen && 'ring-1 ring-ring text-foreground'
          )}
          aria-label="Change timezone"
          title={selectedTimezone.label}
        >
          <Globe2 className="h-4 w-4" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0" align="end" sideOffset={6}>
        <Command value={search} onValueChange={setSearch}>
          <CommandInput placeholder="Search timezones..." className="h-9" />
          <CommandList ref={listRef}>
            <CommandEmpty>No timezones found.</CommandEmpty>
            <CommandGroup>
              {orderedTimezones.map((tz) => (
                <CommandItem
                  key={tz.iana}
                  value={`${tz.label} ${tz.city} ${tz.value} ${tz.iana}`}
                  onSelect={() => handleSelect(tz.iana)}
                  className={cn(
                    'flex flex-col items-start px-3 py-2 text-sm',
                    selectedTimezone.iana === tz.iana &&
                      'bg-accent text-accent-foreground'
                  )}
                >
                  <span className="font-medium">{tz.label}</span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {tz.city}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
