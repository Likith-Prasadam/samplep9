import { useMemo, useState, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GET_LIVE_EVENTS } from '@/graphql/events_queries';
import { cn } from '@/lib/utils';

interface Event {
  createdAt: string;
  eventDescription: string;
  eventHash: string;
  eventRead: boolean;
  eventTitle: string;
  eventType: string;
  liveChunkHash: string;
  chunkPresignedUrlExpiry?: string;
  chunkPresignedUrl?: string;
  chunkDuration?: number;
  chunkEndTime?: string;
  chunkOffset?: number;
  chunkStartTime?: string;
}

interface GetLiveEventsResponse {
  getLiveEvents: {
    events: Event[];
    hasNext: boolean;
    itemsPerPage: number;
    page: number;
    totalCount: number;
    sort: {
      order: string;
      by: string;
    };
  };
}

interface EventsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Filters {
  eventHash?: string;
  eventRead?: boolean | null;
  eventTitle?: string;
  eventType?: string;
  liveChunkHash?: string;
  searchTerm?: string;
}

const getSeverityConfig = (eventType: string) => {
  const type = eventType?.toLowerCase() || '';

  if (
    type.includes('alert') ||
    type.includes('warning') ||
    type.includes('critical')
  ) {
    return {
      icon: AlertTriangle,
      color: 'text-red-600 dark:text-red-400',
      borderColor: 'border-l-red-500',
      bgColor: 'hover:bg-red-50 dark:hover:bg-red-500/10',
      badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
  }

  if (type.includes('info') || type.includes('notice')) {
    return {
      icon: Info,
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-l-blue-500',
      bgColor: 'hover:bg-blue-50 dark:hover:bg-blue-500/10',
      badgeClass:
        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    };
  }

  return {
    icon: Info,
    color: 'text-gray-600 dark:text-gray-400',
    borderColor: 'border-l-gray-500',
    bgColor: 'hover:bg-gray-50 dark:hover:bg-gray-500/10',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
};

export function EventsModal({ open, onOpenChange }: EventsModalProps) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedEventHash, setExpandedEventHash] = useState<string | null>(
    null
  );
  const [filters, setFilters] = useState<Filters>({
    eventRead: null,
    eventType: '',
  });

  const itemsPerPage = 10;

  const { data, loading, error, refetch } = useQuery<GetLiveEventsResponse>(
    GET_LIVE_EVENTS,
    {
      variables: {
        itemsPerPage,
        page,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters: {
          camHash: '',
          camCity: '',
          camAddress1: '',
          camSearch: '',
          eventHash: filters.eventHash || '',
          eventRead: filters.eventRead,
          eventSearch: searchTerm || '',
          eventTitle: filters.eventTitle || '',
          eventType: filters.eventType || '',
          liveChunkHash: filters.liveChunkHash || '',
          camZipcode: '',
        },
      },
      skip: !open,
    }
  );

  const events = useMemo(() => data?.getLiveEvents?.events || [], [data]);
  const totalCount = data?.getLiveEvents?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasNext = data?.getLiveEvents?.hasNext || false;

  const handleNextPage = useCallback(() => {
    if (hasNext && page < totalPages) {
      setPage((prev) => prev + 1);
    }
  }, [hasNext, page, totalPages]);

  const handlePreviousPage = useCallback(() => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  }, [page]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setPage(1);
  }, []);

  const handleFilterChange = useCallback(
    (key: keyof Filters, value: string | boolean | null) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
      setPage(1);
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters({
      eventRead: null,
      eventType: '',
    });
    setSearchTerm('');
    setPage(1);
  }, []);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + 'y ago';
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + 'mo ago';
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + 'd ago';
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + 'h ago';
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + 'm ago';
      return Math.floor(seconds) + 's ago';
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col gap-0 p-0">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-xl font-semibold">Live Events</h2>
            <p className="text-xs text-muted-foreground mt-1">
              View and manage live event notifications
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-border/50 space-y-3">
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 text-sm"
          />

          <div className="pt-1 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {/* Event Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Event Type</label>
                <Input
                  placeholder="Filter..."
                  value={filters.eventType}
                  onChange={(e) =>
                    handleFilterChange('eventType', e.target.value)
                  }
                  className="h-8 text-xs"
                />
              </div>

              {/* Read Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Status</label>
                <select
                  value={
                    filters.eventRead === null
                      ? ''
                      : filters.eventRead
                        ? 'read'
                        : 'unread'
                  }
                  onChange={(e) => {
                    if (e.target.value === '') {
                      handleFilterChange('eventRead', null);
                    } else {
                      handleFilterChange(
                        'eventRead',
                        e.target.value === 'read'
                      );
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-md border border-input bg-background text-xs"
                >
                  <option value="">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>

              {/* Clear Button */}
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full h-8 text-xs"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground mr-2" />
              <span className="text-xs text-muted-foreground">
                Loading events...
              </span>
            </div>
          )}

          {error && (
            <div className="m-4 flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold">Failed to load events</p>
                <p className="text-xs mt-1">{error.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2 h-7 text-xs"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <AlertCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchTerm || filters.eventType || filters.eventRead !== null
                  ? 'No events match your search'
                  : 'No live events available'}
              </p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="p-2 md:p-3 space-y-2">
              {events.map((event, index) => {
                const severity = getSeverityConfig(event.eventType);
                const IconComponent = severity.icon;
                const isExpanded = expandedEventHash === event.eventHash;

                return (
                  <div
                    key={`${event.eventHash}-${index}`}
                    className={cn(
                      'border border-border/50 rounded-lg overflow-hidden transition-all duration-200',
                      severity.borderColor,
                      isExpanded ? 'ring-2 ring-primary/30' : '',
                      'bg-card/50 hover:bg-card'
                    )}
                  >
                    {/* Event Header - Always Visible */}
                    <div
                      onClick={() =>
                        setExpandedEventHash(
                          isExpanded ? null : event.eventHash
                        )
                      }
                      className={cn(
                        'group flex items-start gap-3 p-3 border-l-4 transition-all duration-200 cursor-pointer',
                        severity.borderColor,
                        severity.bgColor,
                        'hover:shadow-sm'
                      )}
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 pt-0.5">
                        <IconComponent
                          className={cn('w-4 h-4', severity.color)}
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-medium text-foreground truncate">
                            {event.eventTitle || 'Untitled Event'}
                          </h4>
                          {!event.eventRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5" />
                          )}
                        </div>

                        {/* Description - lighter */}
                        {event.eventDescription && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                            {event.eventDescription}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge
                            variant="secondary"
                            className={cn(
                              severity.badgeClass,
                              'text-xs py-0 px-2'
                            )}
                          >
                            {event.eventType || 'Unknown'}
                          </Badge>
                          <span>{formatDate(event.createdAt)}</span>
                          {event.eventRead && (
                            <Badge
                              variant="outline"
                              className="text-xs py-0 px-2 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                            >
                              Read
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0',
                          isExpanded ? 'rotate-180' : ''
                        )}
                      />
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="p-4 bg-muted/30 border-t border-border/50 space-y-4">
                        {/* Video Section */}
                        {event.chunkPresignedUrl && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Event Video
                            </h4>
                            <video
                              src={event.chunkPresignedUrl}
                              controls
                              className="w-full max-h-56 rounded-md border border-border bg-black object-contain"
                              preload="metadata"
                            >
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        )}

                        {/* Description Section */}
                        {event.eventDescription && (
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-2">
                              Description
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {event.eventDescription}
                            </p>
                          </div>
                        )}

                        {/* Timeline Section */}
                        <div>
                          <h4 className="text-sm font-semibold text-foreground mb-2">
                            Event Timeline
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {event.chunkStartTime && (
                              <div className="p-2 rounded border border-border/50 bg-background">
                                <p className="text-muted-foreground font-medium mb-1">
                                  Start Time
                                </p>
                                <p className="text-foreground font-mono">
                                  {new Date(
                                    event.chunkStartTime
                                  ).toLocaleString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                  })}
                                </p>
                              </div>
                            )}
                            {event.chunkEndTime && (
                              <div className="p-2 rounded border border-border/50 bg-background">
                                <p className="text-muted-foreground font-medium mb-1">
                                  End Time
                                </p>
                                <p className="text-foreground font-mono">
                                  {new Date(event.chunkEndTime).toLocaleString(
                                    undefined,
                                    {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit',
                                    }
                                  )}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - Pagination */}
        {!loading && !error && totalCount > 0 && (
          <div className="flex-shrink-0 px-6 py-3 border-t border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Page {page} of {totalPages} • {events.length} of {totalCount}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={page === 1 || loading}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="w-3 h-3" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!hasNext || page >= totalPages || loading}
                className="h-8 gap-1 text-xs"
              >
                Next
                <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
