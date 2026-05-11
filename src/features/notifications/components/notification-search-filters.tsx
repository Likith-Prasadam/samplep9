import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type DateRange } from 'react-day-picker';

export type FilterField = 'eventTitle' | 'eventType';

export interface SearchFilters {
  field: FilterField;
  searchText: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface NotificationSearchFiltersProps {
  onFiltersChange: (filters: SearchFilters) => void;
  onClearFilters: () => void;
  disabled?: boolean;
  compact?: boolean;
  onMarkAsRead?: () => Promise<void>;
  isMarkingAsRead?: boolean;
  dateFrom?: Date | undefined;
  dateTo?: Date | undefined;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  selectedFilter?: 'live' | 'batch';
  batchCount?: number;
  liveCount?: number;
}

export const NotificationSearchFilters: React.FC<
  NotificationSearchFiltersProps
> = ({
  onFiltersChange,
  onClearFilters,
  disabled = false,
  compact = false,
  onMarkAsRead,
  isMarkingAsRead = false,
  dateFrom,
  dateTo,
  selectedFilter = 'batch',
  batchCount = 0,
  liveCount = 0,
}) => {
  const [selectedField, setSelectedField] = useState<FilterField>('eventTitle');
  const [searchText, setSearchText] = useState('');

  const handleSearchChange = (value: string) => {
    setSearchText(value);
    // Don't auto-trigger search on every keystroke
  };

  const handleSearchClick = () => {
    // Trigger search only when button is clicked or Enter is pressed
    onFiltersChange({
      field: selectedField,
      searchText,
      dateFrom,
      dateTo,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handleClearAll = () => {
    setSelectedField('eventTitle');
    setSearchText('');
    onClearFilters();
  };

  const hasActiveFilters = searchText;

  return (
    <div
      className={cn(
        'flex items-center gap-3 w-full',
        compact ? 'flex-col items-stretch' : 'flex-row'
      )}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Dropdown */}
        {/* <Select
          value={selectedField}
          onValueChange={(value) => setSelectedField(value as FilterField)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eventTitle">Event Title</SelectItem>
            <SelectItem value="eventType">Event Type</SelectItem>
          </SelectContent>
        </Select> */}

        {/* Search */}
        <div className="relative w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={`Search by ${
              selectedField === 'eventTitle' ? 'event name' : 'event type'
            }...`}
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="pl-9 pr-9"
          />

          {hasActiveFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearAll}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Clear
    {hasActiveFilters && (
      <Button variant="ghost" size="sm" onClick={handleClearAll}>
        <X className="mr-1 h-4 w-4" />
        Clear
      </Button>
    )} */}
      </div>

      {/* 🔥 FLEX SPACER */}
      <div className="flex-1 flex flex-col" />

      {/* RIGHT SIDE */}
      <Button variant="outline" size="sm" disabled className="px-3 py-1 h-9">
        Total Count: {selectedFilter === 'batch' ? batchCount : liveCount}
      </Button>
      {onMarkAsRead && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAsRead}
          disabled={disabled || isMarkingAsRead}
          className="text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          {isMarkingAsRead ? 'Marking...' : 'Mark All as Read'}
        </Button>
      )}
    </div>
  );
};
