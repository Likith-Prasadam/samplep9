import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertCircle,
  X,
  ChevronDown,
  Play,
  Search,
  RotateCw,
  // ArrowRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import { useNotifications } from '@/providers/notifications-provider';
import { formatTimeInTimezone } from '@/utils/timeUtils';
import { useTimezone } from '@/hooks/use-timezone';
// import type { Notification as BaseNotification } from '@/features/notifications/types/notifications';
import {
  fetchLiveEventsNew,
  selectHasMoreNotifications,
  selectTotalItems,
  // markAllAsRead,
  selectAllLiveEventsMarkedAsRead,
  selectAllLiveEventsMarkedAsReadAt,
} from '@/store/slices/notifications-slice';
import type { AppDispatch, RootState } from '@/store';
import {
  type ColumnDef,
  type PaginationState,
  type Updater,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { DataTablePagination } from '@/components/data-table';
import type { Notification } from '@/features/notifications/types/notifications';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { type DateRange } from 'react-day-picker';
// import { UPDATE_ALL_LIVE_EVENTS_READ_STATUS } from '@/graphql/live_queries';
import type { FilterField } from '@/features/notifications/components/notification-search-filters';

// Custom scrollbar styles
const customScrollbarStyle = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(98, 126, 123, 0.5);
    border-radius: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(79, 98, 96, 0.7);
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(82, 90, 89, 0.5) rgba(31, 41, 55, 0.5);
  }
`;

// // Get icon for notification type
// const getNotificationIcon = (notification: BaseNotification) => {
//   if (notification.icon === 'radio-tower') {
//     return <CircleAlert className="w-5 h-5 text-primary" />;
//   }
//   if (notification.icon === 'file-video') {
//     return <CircleAlert className="w-5 h-5 text-blue-500" />;
//   }

//   const alertLower = notification.alert?.toLowerCase() || '';
//   if (
//     alertLower.includes('accident') ||
//     alertLower.includes('emergency') ||
//     alertLower.includes('collision')
//   ) {
//     return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
//   }
//   if (
//     alertLower.includes('robbery') ||
//     alertLower.includes('theft') ||
//     alertLower.includes('crime')
//   ) {
//     return <AlertCircle className="w-5 h-5 text-destructive" />;
//   }
//   if (alertLower.includes('safe') || alertLower.includes('clear')) {
//     return <CheckCircle className="w-5 h-5 text-green-500" />;
//   }

//   return <AlertCircle className="w-5 h-5 text-primary" />;
// };

// // Memoized icon component
// const NotificationIcon = React.memo(
//   ({ notification }: { notification: BaseNotification }) => {
//     return getNotificationIcon(notification);
//   }
// );

interface NotificationsPanelProps {
  cameraId: string;
  camera?: Camera;
}

const toIsoDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const buildUtcRangeBoundary = (
  date: Date,
  timezone: string,
  boundary: 'start' | 'end'
): string => {
  const day = toIsoDate(date);
  const localWallClock =
    boundary === 'start' ? `${day}T00:00:00.000` : `${day}T23:59:59.999`;
  return fromZonedTime(localWallClock, timezone).toISOString();
};

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({
  cameraId,
}) => {
  const normalizedCameraId = useMemo(
    () => (cameraId || '').trim().toLowerCase(),
    [cameraId]
  );

  const dispatch = useDispatch<AppDispatch>();
  const { selectedTimezone } = useTimezone();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const itemsPerPage = pagination.pageSize;
  const pageSizeRef = useRef(pagination.pageSize);
  pageSizeRef.current = pagination.pageSize;

  // Mutation for marking all events as read
  // const [updateAllLiveEventsReadStatus, { loading: updateLoading }] =
  //   useMutation(UPDATE_ALL_LIVE_EVENTS_READ_STATUS);

  // Separate input state from applied filters
  const [searchText, setSearchText] = useState<string>('');

  const [searchFilters, setSearchFilters] = useState<{
    field: FilterField;
    searchText: string;
    dateFrom: Date | undefined;
    dateTo: Date | undefined;
  }>({
    field: 'eventTitle',
    searchText: '',
    dateFrom: undefined,
    dateTo: undefined,
  });

  const handleSearchChange = (value: string) => {
    setSearchText(value);
  };

  const handleSearchClick = () => {
    setSearchFilters((prev) => ({
      ...prev,
      searchText,
      field: 'eventTitle',
    }));
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  // const handleMarkAllAsRead = useCallback(async () => {
  //   try {
  //     await updateAllLiveEventsReadStatus({
  //       variables: {
  //         readStatus: false,
  //       },
  //     });
  //     // Mark all visible notifications as viewed in Redux
  //     dispatch(markAllAsRead());

  //     // Refetch the current page to reflect the updated read status from backend
  //     if (cameraId) {
  //       const queryFilters: Record<string, unknown> = {
  //         camHash: cameraId,
  //       };

  //       if (searchFilters.searchText) {
  //         queryFilters[searchFilters.field] = searchFilters.searchText;
  //       }
  //       if (searchFilters.dateFrom) {
  //         queryFilters.createdAtFrom = searchFilters.dateFrom.toISOString();
  //       }
  //       if (searchFilters.dateTo) {
  //         const endOfDay = new Date(searchFilters.dateTo);
  //         endOfDay.setHours(23, 59, 59, 999);
  //         queryFilters.createdAtTo = endOfDay.toISOString();
  //       }

  //       dispatch(
  //         fetchLiveEventsNew({
  //           filters: queryFilters,
  //           page: currentPage,
  //           itemsPerPage,
  //           sortBy: 'createdAt',
  //           sortOrder: 'desc',
  //         })
  //       );
  //     }
  //   } catch (error) {
  //     console.error('Failed to mark all notifications as read:', error);
  //   }
  // }, [
  //   updateAllLiveEventsReadStatus,
  //   dispatch,
  //   cameraId,
  //   currentPage,
  //   itemsPerPage,
  //   searchFilters,
  // ]);

  // Get hasNext and totalItems from Redux
  const hasNext = useSelector((state: RootState) =>
    selectHasMoreNotifications(state)
  );
  const totalItems = useSelector((state: RootState) => selectTotalItems(state));
  const allLiveEventsMarkedAsRead = useSelector((state: RootState) =>
    selectAllLiveEventsMarkedAsRead(state)
  );
  const allLiveEventsMarkedAsReadAt = useSelector((state: RootState) =>
    selectAllLiveEventsMarkedAsReadAt(state)
  );

  const buildQueryFilters = useCallback((): Record<string, unknown> => {
    const queryFilters: Record<string, unknown> = {
      camHash: cameraId,
    };

    if (searchFilters.searchText) {
      queryFilters[searchFilters.field] = searchFilters.searchText;
    }
    if (searchFilters.dateFrom) {
      queryFilters.createdAtFrom = buildUtcRangeBoundary(
        searchFilters.dateFrom,
        selectedTimezone.iana,
        'start'
      );
    }
    if (searchFilters.dateTo) {
      queryFilters.createdAtTo = buildUtcRangeBoundary(
        searchFilters.dateTo,
        selectedTimezone.iana,
        'end'
      );
    }
    return queryFilters;
  }, [cameraId, searchFilters, selectedTimezone.iana]);

  // Refetch page 1 when camera or search filters change (not when only page/pageSize changes)
  useEffect(() => {
    if (!cameraId) {
      console.log('🔴 NO CAMERA HASH - skipping live events fetch');
      return;
    }

    setPagination((p) => ({ ...p, pageIndex: 0 }));

    const queryFilters = buildQueryFilters();
    console.log('🔄 Fetching live events with filters:', queryFilters);
    dispatch(
      fetchLiveEventsNew({
        filters: queryFilters,
        page: 1,
        itemsPerPage: pageSizeRef.current,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
    );
  }, [cameraId, buildQueryFilters, dispatch]);

  // Inject custom scrollbar styles
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = customScrollbarStyle;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  const {
    notifications,
    isLoading,
    error,
    viewedNotifications,
    setViewedNotifications,
  } = useNotifications();

  useEffect(() => {
    console.log('📦 NotificationsPanel State Snapshot:', {
      notificationsCount: notifications.length,
      isLoading,
      error,
      cameraId,
      cameraIdType: typeof cameraId,
      notificationsDetail: notifications.map((n) => ({
        event_id: n.event_id,
        type: n.type,
        camera_id: n.details?.camera_id,
        alert: n.alert,
        timestamp: n.timestamp,
      })),
    });
  }, [notifications, isLoading, error, cameraId]);

  const [expandedNotifications, setExpandedNotifications] = useState<
    Set<string>
  >(new Set());
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Filter notifications for current camera - LIVE ONLY
  const filteredNotifications = useMemo(() => {
    if (!cameraId) {
      console.log('🔴 NO CAMERA ID - cannot filter');
      return [];
    }

    console.log('🔍 Filtering notifications for camera:', cameraId);
    console.log('📊 Total notifications in state:', notifications.length);

    // Filter to only live notifications (not batch/playground)
    // The API should return only live events, but we add this safety filter
    const filtered = notifications.filter((notif) => {
      if (notif.type !== 'live') return false;
      const notifCamera = (notif.details?.camera_id || '').trim().toLowerCase();
      return !!notifCamera && notifCamera === normalizedCameraId;
    });

    console.log('📌 After type filter (live only):', filtered.length);
    console.log('✅ Final filtered notifications:', filtered.length);

    if (filtered.length > 0) {
      console.log(
        '📦 Sample notifications:',
        filtered.slice(0, 2).map((n) => ({
          alert: n.alert,
          type: n.type,
          cameraId: n.details?.camera_id,
        }))
      );
    }

    return filtered;
  }, [notifications, cameraId, normalizedCameraId]);

  const handleNotificationClick = useCallback(
    (id: string) => {
      // Mark as viewed
      setViewedNotifications((prev) => {
        const newSet = new Set(prev);
        newSet.add(id);
        return newSet;
      });
    },
    [setViewedNotifications]
  );

  const toggleExpandNotification = useCallback((id: string) => {
    setExpandedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const openVideoModal = useCallback((url: string) => {
    setSelectedVideo(url);
    setIsVideoModalOpen(true);
  }, []);

  const closeVideoModal = useCallback(() => {
    setSelectedVideo(null);
    setIsVideoModalOpen(false);
  }, []);

  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);

  const paginatedNotifications = useMemo(() => {
    return filteredNotifications;
  }, [filteredNotifications]);

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      if (!cameraId) return;
      setPagination((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        dispatch(
          fetchLiveEventsNew({
            filters: buildQueryFilters(),
            page: next.pageIndex + 1,
            itemsPerPage: next.pageSize,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        );
        return next;
      });
    },
    [cameraId, buildQueryFilters, dispatch]
  );

  // Sync: re-fetch the current page to pull in the latest alerts
  const [isSyncing, setIsSyncing] = useState(false);
  const handleSync = useCallback(async () => {
    if (!cameraId) return;
    setIsSyncing(true);
    try {
      await dispatch(
        fetchLiveEventsNew({
          filters: buildQueryFilters(),
          page: pagination.pageIndex + 1,
          itemsPerPage: pagination.pageSize,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      );
    } finally {
      setIsSyncing(false);
    }
  }, [
    cameraId,
    buildQueryFilters,
    dispatch,
    pagination.pageIndex,
    pagination.pageSize,
  ]);

  const hasActiveFilters =
    !!searchFilters.searchText ||
    !!searchFilters.dateFrom ||
    !!searchFilters.dateTo;

  const clearAllFilters = useCallback(() => {
    setSearchText('');
    setSearchFilters((prev) => ({
      ...prev,
      searchText: '',
      dateFrom: undefined,
      dateTo: undefined,
    }));
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, []);

  const paginationColumns = useMemo<ColumnDef<Notification>[]>(
    () => [
      {
        id: 'placeholder',
        header: 'placeholder',
        accessorFn: (_row, index) => index,
      },
    ],
    []
  );

  const paginationTable = useReactTable({
    data: filteredNotifications,
    columns: paginationColumns,
    state: { pagination },
    pageCount: totalPages,
    manualPagination: true,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!cameraId) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No camera selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <div className="space-y-3">
          {/* Title row with count badge + Sync button */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Alerts</CardTitle>
              {totalItems > 0 && (
                <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium tabular-nums">
                  {totalItems}
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isLoading || isSyncing || !cameraId}
              className="h-8 gap-1.5"
              title="Sync latest alerts"
            >
              <RotateCw
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  (isSyncing || isLoading) && 'animate-spin'
                )}
              />
              Sync
            </Button>
          </div>

          {/* Filter toolbar: Search + Date range + Clear */}
          <div
            className={cn(
              'flex items-center gap-1 rounded-lg border bg-muted/40 p-1',
              'transition-colors focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-sm'
            )}
          >
            {/* Search input (borderless, blends into toolbar) */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search event name"
                value={searchText}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                disabled={isLoading}
                className="pl-9 pr-8 h-8 text-sm border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {searchText && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSearchText('');
                    setSearchFilters((prev) => ({ ...prev, searchText: '' }));
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  disabled={isLoading}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-border/70 shrink-0" />

            {/* Date range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 gap-1.5 font-normal text-xs hover:bg-background',
                    !searchFilters.dateFrom &&
                      !searchFilters.dateTo &&
                      'text-muted-foreground'
                  )}
                  disabled={isLoading}
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {searchFilters.dateFrom ? (
                    searchFilters.dateTo ? (
                      <>
                        {format(searchFilters.dateFrom, 'LLL dd')} –{' '}
                        {format(searchFilters.dateTo, 'LLL dd, y')}
                      </>
                    ) : (
                      format(searchFilters.dateFrom, 'LLL dd, y')
                    )
                  ) : (
                    <span>Date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  defaultMonth={searchFilters.dateFrom}
                  selected={{
                    from: searchFilters.dateFrom,
                    to: searchFilters.dateTo,
                  }}
                  onSelect={(range: DateRange | undefined) => {
                    setSearchFilters((prev) => ({
                      ...prev,
                      dateFrom: range?.from,
                      dateTo: range?.to,
                    }));
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>

            {/* Global clear-all, shown only when filters are active */}
            {hasActiveFilters && (
              <>
                <div className="h-5 w-px bg-border/70 shrink-0" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  disabled={isLoading}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Clear all filters"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        {/* Alerts list */}
        <div className="flex-1 overflow-hidden w-full h-full flex flex-col">
          <div className="flex-1 overflow-y-auto rounded-xl bg-card/60 m-4 mb-0">
            {isLoading && paginatedNotifications.length === 0 ? (
              <div className="flex items-center justify-center text-muted-foreground h-full">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                  <span>Loading notifications...</span>
                </div>
              </div>
            ) : error && notifications.length === 0 ? (
              <div className="text-center py-10 text-destructive flex items-center justify-center h-full">
                <div>
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <span>{error}</span>
                </div>
              </div>
            ) : paginatedNotifications.length > 0 ? (
              (() => {
                console.log(
                  '🎉 RENDERING',
                  paginatedNotifications.length,
                  'notifications'
                );
                return (
                  <div>
                    {paginatedNotifications.map((notification) => {
                      if (!notification.event_id) return null;

                      // Determine if notification is unread
                      // A notification is unread if:
                      // 1. It's explicitly in the viewedNotifications set (marked as read individually)
                      // 2. Or it was created AFTER the "mark all as read" action
                      let isUnread = false;
                      if (!viewedNotifications.has(notification.event_id)) {
                        // If not explicitly viewed, check if it was created after mark-as-read
                        if (
                          !allLiveEventsMarkedAsRead ||
                          !allLiveEventsMarkedAsReadAt
                        ) {
                          isUnread = true;
                        } else {
                          const notificationTime = notification.timestamp
                            ? new Date(notification.timestamp).getTime()
                            : 0;
                          isUnread =
                            notificationTime > allLiveEventsMarkedAsReadAt;
                        }
                      }

                      const isExpanded = expandedNotifications.has(
                        notification.event_id
                      );
                      const hasVideoUrl = !!notification.details?.presigned_url;

                      return (
                        <div
                          key={notification.event_id}
                          className="p-3 border-b border-border/60 last:border-b-0 bg-card/80 hover:bg-card transition-colors cursor-pointer"
                          onClick={() => {
                            if (notification.event_id) {
                              handleNotificationClick(notification.event_id);
                              if (hasVideoUrl) {
                                toggleExpandNotification(notification.event_id);
                              }
                            }
                          }}
                        >
                          <div className="flex gap-3">
                            {/* Video thumbnail / clip preview */}
                            {hasVideoUrl && (
                              <div className="relative w-24 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                                <video
                                  className="w-full h-full object-cover"
                                  src={notification.details.presigned_url}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  onMouseEnter={(e) => {
                                    const el = e.currentTarget;
                                    el.currentTime = 0;
                                    const playPromise = el.play();
                                    if (
                                      playPromise &&
                                      typeof playPromise.catch === 'function'
                                    ) {
                                      playPromise.catch(() => {});
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.pause();
                                  }}
                                />
                                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                                <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] text-white/80">
                                  <PlayCircle className="w-3 h-3" />
                                  <span>Alert</span>
                                </div> */}
                              </div>
                            )}

                            {/* Notification content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2 pt-2.5">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {/* <NotificationIcon notification={notification} /> */}
                                  <p className="text-xs font-medium text-foreground line-clamp-2">
                                    {notification.alert}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {isUnread && (
                                    <span
                                      className="h-2 w-2 bg-primary rounded-full shrink-0"
                                      title="Unread"
                                    ></span>
                                  )}
                                  {hasVideoUrl && (
                                    <ChevronDown
                                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Timestamp */}
                              <div className="text-xs text-muted-foreground">
                                {formatTimeInTimezone(
                                  notification.event_received_utc ||
                                    notification.timestamp,
                                  selectedTimezone.iana,
                                  'datetime'
                                )}{' '}
                                <span className="font-medium">
                                  {selectedTimezone.value}
                                </span>
                              </div>

                              {/* Expandable content with description */}
                              {isExpanded && (
                                <div className="mt-2 pt-2 border-t border-border/50 space-y-2">
                                  {notification.details?.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {notification.details.description}
                                    </p>
                                  )}

                                  {notification.details?.timeline &&
                                    notification.details.timeline.duration !==
                                      '0s' && (
                                      <p className="text-xs text-muted-foreground">
                                        Duration:{' '}
                                        <span className="text-foreground font-medium">
                                          {
                                            notification.details.timeline
                                              .duration
                                          }
                                        </span>
                                      </p>
                                    )}

                                  {notification.details?.presigned_url && (
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openVideoModal(
                                          notification.details!.presigned_url!
                                        );
                                      }}
                                      className="w-full text-xs h-7 mt-1"
                                      size="sm"
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      View Video
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-10 text-muted-foreground flex items-center justify-center h-full">
                <div>
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No alerts for this camera</p>
                </div>
              </div>
            )}
          </div>

          {/* Pagination — same DataTablePagination as /notifications */}
          {(hasNext || totalPages > 1) && (
            <div className="shrink-0 border-t border-border bg-background px-2 pt-2 pb-1 md:px-3 md:pt-2 md:pb-1 mt-auto">
              {isLoading ? (
                <div className="flex justify-between items-center px-4 py-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-8 rounded-md" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <DataTablePagination table={paginationTable} />
              )}
            </div>
          )}
        </div>

        {/* Video Modal */}
        {isVideoModalOpen && selectedVideo && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative bg-background rounded-xl overflow-hidden max-w-4xl w-full border border-input">
              <div className="p-4 border-b border-muted flex justify-end">
                <button
                  onClick={closeVideoModal}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="aspect-video bg-black">
                <video
                  src={selectedVideo}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                  onLoadStart={(e) => (e.currentTarget.volume = 0.5)}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default React.memo(NotificationsPanel);
