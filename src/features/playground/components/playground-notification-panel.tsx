import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import { Bell, X, SquareArrowOutUpRight, Maximize2 } from 'lucide-react';
import { useMutation } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Notification } from '@/features/notifications/types/notifications';
import { useAppSelector, useAppDispatch } from '@/store/index';
import {
  fetchBatchEventsNew,
  markAsViewed,
  markAllAsRead,
  selectNotifications,
  selectViewedNotifications,
  selectIsLoading,
  selectHasMoreNotifications,
  selectCurrentPage,
  selectAllBatchEventsMarkedAsRead,
  selectAllBatchEventsMarkedAsReadAt,
} from '@/store/slices/notifications-slice';
import { UPDATE_ALL_BATCH_EVENTS_READ_STATUS } from '@/graphql/batch_mutations';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTimeInTimezone } from '@/utils/timeUtils';
import { useTimezone } from '@/hooks/use-timezone';

interface NotificationPanelProps {
  selectedDate?: Date | null;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({
  selectedDate,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const viewedNotifications = useAppSelector(selectViewedNotifications);
  const isLoading = useAppSelector(selectIsLoading);
  const hasMoreNotifications = useAppSelector(selectHasMoreNotifications);
  const currentPage = useAppSelector(selectCurrentPage);

  // Mutation for marking all events as read
  const [updateAllBatchEventsReadStatus, { loading: updateLoading }] =
    useMutation(UPDATE_ALL_BATCH_EVENTS_READ_STATUS);

  const viewedSet = useMemo(
    () => new Set(viewedNotifications),
    [viewedNotifications]
  );

  const viewedSetForBell = useMemo(
    () => new Set(viewedNotifications),
    [viewedNotifications]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [visibleNotifications, setVisibleNotifications] = useState<
    Notification[]
  >([]);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const [isMarkAllAsReadExecuted, setIsMarkAllAsReadExecuted] = useState(false);
  const [isAlertVideoOpen, setIsAlertVideoOpen] = useState(false);
  const [activeAlertVideo, setActiveAlertVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const prevUnreadCountRef = useRef(0);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const allBatchEventsMarkedAsRead = useAppSelector(
    selectAllBatchEventsMarkedAsRead
  );
  const allBatchEventsMarkedAsReadAt = useAppSelector(
    selectAllBatchEventsMarkedAsReadAt
  );

  // Unread count from Redux (available before panel is opened) – used for bell dot and ripple
  const batchNotificationsFromRedux = useMemo(
    () => (notifications || []).filter((n) => n.type === 'batch'),
    [notifications]
  );
  const bellUnreadCount = useMemo(
    () =>
      batchNotificationsFromRedux.filter((n) => {
        if (!n.event_id || viewedSetForBell.has(n.event_id)) {
          return false;
        }

        // Check if notification was created after mark-as-read action
        if (!allBatchEventsMarkedAsRead || !allBatchEventsMarkedAsReadAt) {
          return true;
        }

        const notificationTime = n.timestamp
          ? new Date(n.timestamp).getTime()
          : 0;
        return notificationTime > allBatchEventsMarkedAsReadAt;
      }).length,
    [
      batchNotificationsFromRedux,
      viewedSetForBell,
      allBatchEventsMarkedAsRead,
      allBatchEventsMarkedAsReadAt,
    ]
  );

  // Alerts API called for the bell icon (on mount and when date filter changes) so ripple can show when SSE delivers new alerts
  useEffect(() => {
    const filters: Record<string, unknown> = {};
    if (selectedDate) {
      const from = new Date(selectedDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(selectedDate);
      to.setHours(23, 59, 59, 999);
      filters.createdAtFrom = from.toISOString();
      filters.createdAtTo = to.toISOString();
    }
    dispatch(
      fetchBatchEventsNew({
        itemsPerPage: 10,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters,
      })
    );
  }, [dispatch, selectedDate]);

  // When dialog opens, show current list from Redux (initial fetch + any SSE) without calling the API again
  useEffect(() => {
    if (!isOpen) return;
    setPage(1);
    setVisibleNotifications(notifications ?? []);
  }, [isOpen, notifications]);

  // Infinite scroll: load next page when user scrolls near bottom
  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMoreNotifications) return;

    const nextPage = currentPage + 1;
    const filters: Record<string, unknown> = {};

    if (selectedDate) {
      const from = new Date(selectedDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(selectedDate);
      to.setHours(23, 59, 59, 999);
      filters.createdAtFrom = from.toISOString();
      filters.createdAtTo = to.toISOString();
    }

    setPage(nextPage);
    dispatch(
      fetchBatchEventsNew({
        itemsPerPage: 10,
        page: nextPage,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        filters,
      })
    );
  }, [dispatch, hasMoreNotifications, isLoading, currentPage, selectedDate]);

  // When a new page of notifications is fetched into Redux, merge into local list
  useEffect(() => {
    if (!isOpen) return;
    if (!notifications || notifications.length === 0) {
      if (page === 1) {
        setVisibleNotifications([]);
      }
      return;
    }

    setVisibleNotifications((prev) => {
      if (page === 1) {
        // First page replaces list
        return notifications;
      }

      // Subsequent pages append, avoiding duplicates by event_id/timestamp
      const existingIds = new Set(prev.map((n) => n.event_id ?? n.timestamp));
      const toAdd = notifications.filter(
        (n) => !existingIds.has(n.event_id ?? n.timestamp)
      );

      if (isMarkAllAsReadExecuted && toAdd.length > 0) {
        const notificationsToMark = toAdd.filter((n) => n.event_id);
        if (notificationsToMark.length > 0) {
          notificationsToMark.forEach((n) => {
            if (n.event_id) {
              dispatch(markAsViewed(n.event_id));
            }
          });
        }
      }

      return [...prev, ...toAdd];
    });
  }, [notifications, isOpen, page, isMarkAllAsReadExecuted, dispatch]);

  const { selectedTimezone } = useTimezone();

  const handleRedirect = useCallback(
    (notification: Notification, event: React.MouseEvent) => {
      event.stopPropagation();
      setIsOpen(false);
      const eventId =
        notification.event_id ??
        formatTimeInTimezone(notification.timestamp, selectedTimezone.iana);
      const eventTitle = notification.alert;
      if (notification.event_id && !viewedSet.has(notification.event_id)) {
        dispatch(markAsViewed(notification.event_id));
      }

      navigate(
        `/notifications?eventTitle=${encodeURIComponent(eventTitle)}&highlight=${eventId}`
      );
    },
    [navigate, dispatch, viewedSet, selectedTimezone]
  );

  const formatNotificationTime = (dateString: string): string => {
    return formatTimeInTimezone(dateString, selectedTimezone.iana, 'datetime');
  };

  const batchNotifications = useMemo(
    () => visibleNotifications.filter((n) => n.type === 'batch'),
    [visibleNotifications]
  );

  // Trigger ripple/animation only on new notifications after initial mount, not on refresh
  useEffect(() => {
    if (isInitialMountRef.current) {
      // Skip ripple on initial mount
      isInitialMountRef.current = false;
      prevUnreadCountRef.current = bellUnreadCount;
      return;
    }

    if (bellUnreadCount > prevUnreadCountRef.current && bellUnreadCount > 0) {
      setShouldAnimate(true);
      setShowRipple(true);

      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }

      const ringTimer = setTimeout(() => setShouldAnimate(false), 1000);
      rippleTimeoutRef.current = setTimeout(() => {
        setShowRipple(false);
      }, 20000); // 20 seconds

      return () => {
        clearTimeout(ringTimer);
        if (rippleTimeoutRef.current) {
          clearTimeout(rippleTimeoutRef.current);
        }
      };
    }
    prevUnreadCountRef.current = bellUnreadCount;
  }, [bellUnreadCount]);

  // If there are no unread notifications at all, ensure ripple/animation are fully cleared
  useEffect(() => {
    if (bellUnreadCount === 0) {
      setShowRipple(false);
      setShouldAnimate(false);
    }
  }, [bellUnreadCount]);

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    navigate('/notifications');
  }, [navigate]);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await updateAllBatchEventsReadStatus({
        variables: {
          readStatus: false,
        },
      });
      // Mark all visible notifications as viewed in Redux
      dispatch(markAllAsRead());

      // Refetch page 1 to reflect the updated read status from backend
      const filters: Record<string, unknown> = {};

      if (selectedDate) {
        const from = new Date(selectedDate);
        from.setHours(0, 0, 0, 0);
        const to = new Date(selectedDate);
        to.setHours(23, 59, 59, 999);
        filters.createdAtFrom = from.toISOString();
        filters.createdAtTo = to.toISOString();
      }

      dispatch(
        fetchBatchEventsNew({
          itemsPerPage: 10,
          page: 1,
          sortBy: 'createdAt',
          sortOrder: 'desc',
          filters,
        })
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [updateAllBatchEventsReadStatus, dispatch, selectedDate]);

  const NotificationListSkeleton = React.memo(() => (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg border bg-muted border-border"
        >
          <Skeleton className="h-4 w-4 rounded-full bg-muted mt-1" />
          <div className="grow space-y-2">
            <Skeleton className="h-4 w-3/4 bg-muted" />
            <Skeleton className="h-3 w-1/2 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  ));

  // Attach scroll listener to ScrollArea viewport for infinite scroll
  useEffect(() => {
    const scrollAreaElement = scrollAreaRef.current;
    if (!scrollAreaElement) return;

    // Find the viewport element inside ScrollArea (Radix UI creates this with data-slot="scroll-area-viewport")
    const viewportElement = scrollAreaElement.querySelector(
      '[data-slot="scroll-area-viewport"]'
    ) as HTMLElement | null;

    if (!viewportElement) return;

    const handleViewportScroll = () => {
      if (
        viewportElement.scrollTop + viewportElement.clientHeight >=
        viewportElement.scrollHeight - 40
      ) {
        handleLoadMore();
      }
    };

    viewportElement.addEventListener('scroll', handleViewportScroll);

    return () => {
      viewportElement.removeEventListener('scroll', handleViewportScroll);
    };
  }, [handleLoadMore]);

  return (
    <>
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-15deg); }
          20%, 40%, 60%, 80% { transform: rotate(15deg); }
        }
        
        .bell-animate {
          animation: bellRing 1s ease-in-out;
          transform-origin: top center;
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .ripple-effect {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--primary);
          animation: ripple 1.5s ease-out forwards;
          z-index: 0;
        }

        /* Fixed scrollbar thumb size for alerts panel */
        .alerts-scroll-area [data-slot="scroll-area-thumb"] {
          min-height: 120px !important;
          
          flex-basis: auto !important;
        }
      `}</style>

      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setIsMarkAllAsReadExecuted(false);
          } else {
            setShowRipple(false);
            setShouldAnimate(false); // Don't animate when user opens panel; only when new unread arrives
            if (rippleTimeoutRef.current) {
              clearTimeout(rippleTimeoutRef.current);
            }
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            variant="outline"
            size="icon"
            className="bg-background/50 border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors relative"
          >
            {showRipple && <span className="ripple-effect" />}
            <Bell
              className={cn('w-5 h-5 z-10', shouldAnimate && 'bell-animate')}
            />
            {bellUnreadCount > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full z-10" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[450px] max-h-[65vh] bg-background/95 backdrop-blur-xl border-border text-foreground p-0 mt-2 shadow-lg"
          align="center"
          sideOffset={5}
        >
          <div className="p-4 border-b border-border flex justify-between items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Alerts</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={updateLoading || batchNotifications.length === 0}
                className="text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
              >
                {updateLoading ? 'Marking...' : 'Mark All as Read'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <ScrollArea
            ref={scrollAreaRef}
            className="alerts-scroll-area h-[calc(65vh-180px)] overflow-hidden"
          >
            <div className="p-4 space-y-3 pr-4">
              {/* Initial load state */}
              {isLoading && batchNotifications.length === 0 ? (
                <NotificationListSkeleton />
              ) : batchNotifications.length > 0 ? (
                batchNotifications.map((notification) => {
                  const id = notification.event_id ?? notification.timestamp;

                  // Determine if notification is unread
                  // A notification is unread if:
                  // 1. It's explicitly in the viewedSet (marked as read individually)
                  // 2. Or it was created AFTER the "mark all as read" action
                  let isUnread = false;
                  if (
                    notification.event_id &&
                    !viewedSet.has(notification.event_id)
                  ) {
                    // If not explicitly viewed, check if it was created after mark-as-read
                    if (
                      !allBatchEventsMarkedAsRead ||
                      !allBatchEventsMarkedAsReadAt
                    ) {
                      isUnread = true;
                    } else {
                      const notificationTime = notification.timestamp
                        ? new Date(notification.timestamp).getTime()
                        : 0;
                      isUnread =
                        notificationTime > allBatchEventsMarkedAsReadAt;
                    }
                  }

                  const timestamp =
                    notification.event_received_utc || notification.timestamp;
                  const hasVideoUrl = !!notification.details?.presigned_url;

                  return (
                    <div
                      key={id}
                      className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all"
                    >
                      {/* Collapsed View */}
                      <div className="p-3">
                        <div className="flex gap-3">
                          {/* Video thumbnail with play circle overlay */}
                          {hasVideoUrl && (
                            <div className="relative w-28 h-14 rounded-md overflow-hidden bg-muted shrink-0">
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
                              {/* Gradient overlay */}
                              {/* <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                            <div className="absolute bottom-1 left-1 flex items-center gap-1 text-[10px] text-white/80">
                              <PlayCircle className="w-3 h-3" />
                              <span>Alert</span>
                            </div> */}
                              {/* Maximize button */}
                              {notification.details?.presigned_url && (
                                <button
                                  type="button"
                                  className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white p-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveAlertVideo({
                                      url: notification.details!.presigned_url!,
                                      title: notification.alert,
                                    });
                                    setIsAlertVideoOpen(true);
                                  }}
                                  aria-label="Open alert video fullscreen"
                                >
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}

                          {/* Notification content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-foreground line-clamp-2 flex-1">
                                {notification.alert}
                              </p>
                              <div className="flex items-center gap-1 shrink-0">
                                {isUnread && (
                                  <span
                                    className="h-2 w-2 bg-primary rounded-full shrink-0"
                                    title="Unread"
                                  />
                                )}
                                {/* Navigation Button */}
                                {notification.type === 'batch' &&
                                  notification.alert && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                      onClick={(e) =>
                                        handleRedirect(notification, e)
                                      }
                                    >
                                      <SquareArrowOutUpRight className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                              </div>
                            </div>

                            {/* Timestamp */}
                            <div className="text-xs text-muted-foreground">
                              {timestamp && (
                                <span>
                                  {formatNotificationTime(timestamp)}{' '}
                                  <span className="font-medium">
                                    {selectedTimezone.value}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  No alerts available
                </div>
              )}
              {/* Bottom loader for infinite scroll */}
              {isLoading && batchNotifications.length > 0 && (
                <div className="flex items-center justify-center py-2 text-xs text-muted-foreground">
                  <span className="mr-2 h-3 w-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading more alerts...
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border">
            <Button
              onClick={handleViewAll}
              className="w-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              variant="outline"
            >
              View All
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Fullscreen alert video dialog */}
      <Dialog
        open={isAlertVideoOpen && !!activeAlertVideo}
        onOpenChange={(open) => {
          setIsAlertVideoOpen(open);
          if (!open) {
            setActiveAlertVideo(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {activeAlertVideo?.title || 'Alert video'}
            </DialogTitle>
          </DialogHeader>
          {activeAlertVideo && (
            <div className="mt-2">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <video
                  src={activeAlertVideo.url}
                  controls
                  className="w-full h-full object-contain bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationPanel;
