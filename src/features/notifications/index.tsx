import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  type ColumnDef,
  type PaginationState,
  type Updater,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { AlertCircle } from 'lucide-react';
import { useMutation } from '@apollo/client';
import type { Notification } from './types/notifications';
import { useNotifications } from '@/providers/notifications-provider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { NotificationHeader } from './components/notification-header';
import { NotificationList } from './components/notification-list';
import {
  LoadingSkeleton,
  NotificationListSkeleton,
} from './components/notification-skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { EmptyState } from './components/notification-empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchNotificationStatus } from '@/services/notification-api';
import { useAppDispatch } from '@/store/hooks';
import {
  fetchLiveEventsNew,
  fetchBatchEventsNew,
} from '@/store/slices/notifications-slice';
import type { SearchFilters } from './components/notification-search-filters';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { UPDATE_ALL_LIVE_EVENTS_READ_STATUS } from '@/graphql/live_queries';
import { UPDATE_ALL_BATCH_EVENTS_READ_STATUS } from '@/graphql/batch_mutations';
import { DataTablePagination } from '@/components/data-table';

const highlightAnimation = `@keyframes highlight-flash {
  from { background-color: rgba(59, 130, 246, 0.15); }
  to { background-color: transparent; }
}
.highlight-notification {
  animation: highlight-flash 2s ease-out forwards;
}`;

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    notifications,
    isLoading,
    error,
    totalBatchEvents,
    totalLiveEvents,
    isInitialized,
    viewedNotifications: viewedNotificationsSet,
    setViewedNotifications,
    markAllAsRead,
    totalItems,
    fetchNotificationCounts,
    loadNotificationData,
    hasNewNotifications,
    clearNewNotificationsFlag,
    allLiveEventsMarkedAsRead,
    allBatchEventsMarkedAsRead,
    allLiveEventsMarkedAsReadAt,
    allBatchEventsMarkedAsReadAt,
  } = useNotifications();

  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const eventTitleFilter = queryParams.get('eventTitle');
  const highlightIdFromUrl = queryParams.get('highlight');

  const [selectedFilter, setSelectedFilter] = useState<'live' | 'batch'>(
    'batch'
  );
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [expandedNotificationId, setExpandedNotificationId] = useState<
    string | null
  >(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(
    highlightIdFromUrl
  );
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    field: 'eventTitle',
    searchText: '',
    dateFrom: undefined,
    dateTo: undefined,
  });
  const itemsPerPage = pagination.pageSize;

  // Mutations for marking all events as read
  const [updateAllLiveEventsReadStatus, { loading: liveUpdateLoading }] =
    useMutation(UPDATE_ALL_LIVE_EVENTS_READ_STATUS);
  const [updateAllBatchEventsReadStatus, { loading: batchUpdateLoading }] =
    useMutation(UPDATE_ALL_BATCH_EVENTS_READ_STATUS);

  const isMarkingAsRead = liveUpdateLoading || batchUpdateLoading;

  const handleFetch = useCallback(
    (
      page: number,
      filter: 'live' | 'batch',
      eventTitle: string | null,
      filters?: SearchFilters,
      pageSize: number = itemsPerPage
    ) => {
      const queryFilters: Record<string, unknown> = {};
      if (eventTitle) {
        queryFilters.eventTitle = eventTitle;
      }

      // Add search filters for live events
      // Apply filters to both live and batch queries
      if (filters) {
        if (filters.dateFrom) {
          queryFilters.createdAtFrom = filters.dateFrom.toISOString();
        }
        if (filters.dateTo) {
          // Set to end of day
          const endOfDay = new Date(filters.dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          queryFilters.createdAtTo = endOfDay.toISOString();
        }
        if (filters.searchText && filters.searchText.trim() !== '') {
          // Apply search filter based on the selected field
          if (filters.field === 'eventTitle') {
            // For eventTitle, use both eventTitle (exact field) and eventSearch for flexibility
            queryFilters.eventTitle = filters.searchText.trim();
          } else if (filters.field === 'eventType') {
            // For eventType, use eventSearch which does partial matching across eventType, eventTitle, and description
            // This allows partial/fuzzy matching since the eventType field requires exact match
            queryFilters.eventSearch = filters.searchText.trim();
          }
        }
      }

      if (filter === 'live') {
        dispatch(
          fetchLiveEventsNew({
            filters: queryFilters,
            page,
            itemsPerPage: pageSize,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        );
      } else {
        dispatch(
          fetchBatchEventsNew({
            filters: queryFilters,
            page,
            itemsPerPage: pageSize,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        );
      }
    },
    [dispatch, itemsPerPage]
  );

  const handlePaginationChange = useCallback(
    (updater: Updater<PaginationState>) => {
      setPagination((previous) => {
        const next =
          typeof updater === 'function' ? updater(previous) : updater;
        const nextPage = next.pageIndex + 1;
        const nextPageSize = next.pageSize;
        handleFetch(
          nextPage,
          selectedFilter,
          eventTitleFilter,
          searchFilters,
          nextPageSize
        );
        return next;
      });
    },
    [eventTitleFilter, handleFetch, searchFilters, selectedFilter]
  );

  const fetchMetrics = useCallback(async () => {
    try {
      await fetchNotificationStatus();
    } catch {
      // Handle error silently
    }
  }, []);

  useEffect(() => {
    const initialPage = 1;
    const initialFilter = eventTitleFilter ? 'batch' : selectedFilter;

    if (eventTitleFilter) {
      setSelectedFilter('batch');
    }

    fetchNotificationCounts();
    loadNotificationData(); // Load notification data when component mounts
    handleFetch(
      initialPage,
      initialFilter,
      eventTitleFilter,
      initialFilter === 'live' ? searchFilters : undefined
    );
    fetchMetrics();

    const countsInterval = setInterval(() => {
      fetchNotificationCounts();
    }, 10000);

    const metricsInterval = setInterval(fetchMetrics, 30000);

    return () => {
      clearInterval(countsInterval);
      clearInterval(metricsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventTitleFilter]);

  useEffect(() => {
    if (highlightIdFromUrl) {
      setHighlightedId(highlightIdFromUrl);
      const timer = setTimeout(() => {
        setHighlightedId(null);
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete('highlight');
        navigate(`${location.pathname}?${newSearchParams.toString()}`, {
          replace: true,
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [highlightIdFromUrl, location.search, location.pathname, navigate]);

  const markAsRead = useCallback(
    (id: string) => {
      setViewedNotifications((prevSet) => {
        if (!prevSet.has(id)) {
          return new Set(prevSet).add(id);
        }
        return prevSet;
      });
    },
    [setViewedNotifications]
  );

  const hasUnreadNotifications = useMemo(() => {
    return notifications.some(
      (n) => !viewedNotificationsSet.has(n.event_id ?? n.timestamp)
    );
  }, [notifications, viewedNotificationsSet]);

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      const id = notification.event_id ?? notification.timestamp;
      markAsRead(id);
      setExpandedNotificationId((prevId) => (prevId === id ? null : id));
    },
    [markAsRead]
  );

  const clearEventTitleFilter = useCallback(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    handleFetch(1, selectedFilter, null, searchFilters, pagination.pageSize);
    navigate('/notifications', { replace: true });
  }, [
    navigate,
    selectedFilter,
    handleFetch,
    searchFilters,
    pagination.pageSize,
  ]);

  const handleFilterChange = (type: 'live' | 'batch') => {
    setSelectedFilter(type);
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));

    if (eventTitleFilter) {
      navigate('/notifications', { replace: true });
    }

    handleFetch(1, type, null, searchFilters, pagination.pageSize);
  };

  const handleRefreshToLatest = useCallback(() => {
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    clearNewNotificationsFlag();
    handleFetch(
      1,
      selectedFilter,
      eventTitleFilter,
      searchFilters,
      pagination.pageSize
    );
  }, [
    selectedFilter,
    eventTitleFilter,
    handleFetch,
    clearNewNotificationsFlag,
    searchFilters,
    pagination.pageSize,
  ]);

  const handleSearchFiltersChange = useCallback(
    (filters: SearchFilters) => {
      setSearchFilters(filters);
      setPagination((previous) => ({ ...previous, pageIndex: 0 }));
      handleFetch(
        1,
        selectedFilter,
        eventTitleFilter,
        filters,
        pagination.pageSize
      );
    },
    [selectedFilter, eventTitleFilter, handleFetch, pagination.pageSize]
  );

  const currentPage = pagination.pageIndex + 1;

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      if (selectedFilter === 'live') {
        await updateAllLiveEventsReadStatus({
          variables: {
            readStatus: false,
          },
        });
      } else {
        await updateAllBatchEventsReadStatus({
          variables: {
            readStatus: false,
          },
        });
      }

      // Mark all visible notifications as viewed in Redux
      markAllAsRead();

      // Refetch the current page to reflect the updated read status from backend
      const queryFilters: Record<string, unknown> = {};

      if (searchFilters.searchText) {
        queryFilters[searchFilters.field] = searchFilters.searchText;
      }
      if (searchFilters.dateFrom) {
        queryFilters.createdAtFrom = searchFilters.dateFrom.toISOString();
      }
      if (searchFilters.dateTo) {
        const endOfDay = new Date(searchFilters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        queryFilters.createdAtTo = endOfDay.toISOString();
      }

      if (selectedFilter === 'live') {
        dispatch(
          fetchLiveEventsNew({
            filters: queryFilters,
            page: currentPage,
            itemsPerPage,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        );
      } else {
        dispatch(
          fetchBatchEventsNew({
            filters: queryFilters,
            page: currentPage,
            itemsPerPage,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [
    updateAllLiveEventsReadStatus,
    updateAllBatchEventsReadStatus,
    selectedFilter,
    markAllAsRead,
    searchFilters,
    currentPage,
    itemsPerPage,
    dispatch,
  ]);

  const handleClearSearchFilters = useCallback(() => {
    const emptyFilters: SearchFilters = {
      field: 'eventTitle',
      searchText: '',
      dateFrom: undefined,
      dateTo: undefined,
    };
    setSearchFilters(emptyFilters);
    setPagination((previous) => ({ ...previous, pageIndex: 0 }));
    handleFetch(
      1,
      selectedFilter,
      eventTitleFilter,
      emptyFilters,
      pagination.pageSize
    );
  }, [selectedFilter, eventTitleFilter, handleFetch, pagination.pageSize]);

  const totalPages = Math.max(Math.ceil(totalItems / itemsPerPage), 1);
  const startItem =
    totalItems === 0 ? 0 : pagination.pageIndex * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);

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
    data: notifications,
    columns: paginationColumns,
    state: {
      pagination,
    },
    pageCount: totalPages,
    manualPagination: true,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!isInitialized) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col rounded-2xl h-full">
      <style>{highlightAnimation}</style>
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed className="flex-1 overflow-hidden pl-25 pr-25">
        <div className="flex flex-col h-full">
          <NotificationHeader
            hasUnreadNotifications={hasUnreadNotifications}
            hasNewNotifications={hasNewNotifications}
            currentPage={currentPage}
            selectedFilter={selectedFilter}
            batchCount={totalBatchEvents}
            liveCount={totalLiveEvents}
            videoIdFilter={eventTitleFilter}
            onMarkAllAsRead={markAllAsRead}
            onFilterChange={handleFilterChange}
            onClearVideoFilter={clearEventTitleFilter}
            onRefreshToLatest={handleRefreshToLatest}
            onSearchFiltersChange={handleSearchFiltersChange}
            onClearSearchFilters={handleClearSearchFilters}
            isLoading={isLoading}
            allLiveEventsMarkedAsRead={allLiveEventsMarkedAsRead}
            allBatchEventsMarkedAsRead={allBatchEventsMarkedAsRead}
            onMarkAsReadSearch={handleMarkAllAsRead}
            isMarkingAsReadSearch={isMarkingAsRead}
          />
          <ScrollArea className="flex-1 h-full w-full rounded-lg overflow-hidden">
            <div className="h-full flex flex-col">
              {error && (
                <div className="p-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}
              {isLoading ? (
                <NotificationListSkeleton count={itemsPerPage} />
              ) : notifications.length === 0 ? (
                <EmptyState
                  message={'Alerts will appear here when they arrive.'}
                />
              ) : (
                <div className="pb-4">
                  <NotificationList
                    notifications={notifications}
                    viewedNotifications={Array.from(viewedNotificationsSet)}
                    expandedNotificationId={expandedNotificationId}
                    highlightedId={highlightedId}
                    allLiveEventsMarkedAsRead={allLiveEventsMarkedAsRead}
                    allBatchEventsMarkedAsRead={allBatchEventsMarkedAsRead}
                    allLiveEventsMarkedAsReadAt={allLiveEventsMarkedAsReadAt}
                    allBatchEventsMarkedAsReadAt={allBatchEventsMarkedAsReadAt}
                    onNotificationClick={handleNotificationClick}
                  />
                </div>
              )}
              {/* Pagination */}
              <div className="border-t border-border bg-background px-2 pt-2 pb-1 md:px-3 md:pt-2 md:pb-1.5 mt-auto">
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
                  <DataTablePagination
                    table={paginationTable}
                    centerContent={
                      <p className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{startItem}</span>{' '}
                        to <span className="font-medium">{endItem}</span> of{' '}
                        <span className="font-medium">{totalItems}</span>{' '}
                        results
                      </p>
                    }
                  />
                )}
              </div>
            </div>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </div>
      </Main>
    </div>
  );
};

export default NotificationsPage;
