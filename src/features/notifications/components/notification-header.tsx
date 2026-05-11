import React, { useState } from 'react';
import { Bell, Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationFilters } from './notification-filter';
import {
  NotificationSearchFilters,
  type SearchFilters,
} from './notification-search-filters';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { type DateRange } from 'react-day-picker';

interface NotificationHeaderProps {
  hasUnreadNotifications: boolean;
  hasNewNotifications: boolean;
  currentPage: number;
  selectedFilter: 'live' | 'batch';
  batchCount: number;
  liveCount: number;
  videoIdFilter: string | null;
  onMarkAllAsRead: () => void;
  onFilterChange: (type: 'live' | 'batch') => void;
  onClearVideoFilter: () => void;
  onRefreshToLatest: () => void;
  onSearchFiltersChange: (filters: SearchFilters) => void;
  onClearSearchFilters: () => void;
  isLoading?: boolean;
  allLiveEventsMarkedAsRead: boolean;
  allBatchEventsMarkedAsRead: boolean;
  onMarkAsReadSearch?: () => Promise<void>;
  isMarkingAsReadSearch?: boolean;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = React.memo(
  ({
    hasNewNotifications,
    currentPage,
    selectedFilter,
    batchCount,
    liveCount,
    videoIdFilter,
    onFilterChange,
    onClearVideoFilter,
    onRefreshToLatest,
    onSearchFiltersChange,
    onClearSearchFilters,
    isLoading = false,
    onMarkAsReadSearch,
    isMarkingAsReadSearch = false,
  }) => {
    const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
    const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

    const handleDateRangeChange = (range: DateRange | undefined) => {
      setDateFrom(range?.from);
      setDateTo(range?.to);
      onSearchFiltersChange({
        field: 'eventTitle',
        searchText: '',
        dateFrom: range?.from,
        dateTo: range?.to,
      });
    };

    const handleResetDateRange = () => {
      setDateFrom(undefined);
      setDateTo(undefined);
      onSearchFiltersChange({
        field: 'eventTitle',
        searchText: '',
        dateFrom: undefined,
        dateTo: undefined,
      });
    };

    return (
      <div className="shrink-0 mb-4">
        {hasNewNotifications && currentPage > 1 && (
          <Alert className="mb-4 bg-blue-50 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/50">
            <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-blue-600 dark:text-blue-300">
                New alerts are available
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshToLatest}
                className="ml-4 border-blue-300 text-blue-600 hover:bg-blue-100 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500/20"
              >
                View Latest
              </Button>
            </AlertDescription>
          </Alert>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Alerts</h2>
            <p className="text-muted-foreground">
              Monitor system alerts and updates
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-shrink-0">
            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal flex-shrink-0',
                    !dateFrom && !dateTo && 'text-muted-foreground'
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? (
                    dateTo ? (
                      <>
                        {format(dateFrom, 'LLL dd, y')} -{' '}
                        {format(dateTo, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateFrom, 'LLL dd, y')
                    )
                  ) : (
                    <span>Select date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  defaultMonth={dateFrom}
                  selected={{
                    from: dateFrom,
                    to: dateTo,
                  }}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetDateRange}
                className="h-9 px-2"
                title="Clear date range"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <NotificationFilters
              selectedFilter={selectedFilter}
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="gap-4">
            <div className="w-full lg:w-auto">
              <NotificationSearchFilters
                onFiltersChange={onSearchFiltersChange}
                onClearFilters={onClearSearchFilters}
                disabled={isLoading}
                onMarkAsRead={onMarkAsReadSearch}
                isMarkingAsRead={isMarkingAsReadSearch}
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateRangeChange={handleDateRangeChange}
                selectedFilter={selectedFilter}
                batchCount={batchCount}
                liveCount={liveCount}
              />
            </div>
          </div>

          {videoIdFilter && (
            <div className="flex items-center gap-2 mt-4">
              <Badge variant="secondary" className="px-3 py-1.5 text-sm">
                Showing alerts for Event Title:
                <span className="font-semibold ml-1">{videoIdFilter}</span>
              </Badge>
              <Button variant="outline" size="sm" onClick={onClearVideoFilter}>
                Clear Filter
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

NotificationHeader.displayName = 'NotificationHeader';
