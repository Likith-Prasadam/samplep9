import { useState, useRef, useMemo, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import type { RootState, AppDispatch } from '@/store';
import {
  addReadNotification,
  markAllAsRead,
} from '@/store/slices/demo-videos-slice';
import type { Event } from '@/features/demo-videos/types';

export function NotificationBell() {
  const dispatch = useDispatch<AppDispatch>();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { events, readNotifications } = useSelector(
    (state: RootState) => state.demoVideos
  );

  const formatRelativeTime = (dateString: string): string => {
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
    return 'just now';
  };

  const latestEvents = useMemo(() => {
    return [...events]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10);
  }, [events]);

  const hasUnreadNotifications = useMemo(() => {
    return events.some((event) => !readNotifications.includes(event.id));
  }, [events, readNotifications]);

  const handleNotificationClick = useCallback(
    (event: Event) => {
      if (!readNotifications.includes(event.id)) {
        dispatch(addReadNotification(event.id));
      }
    },
    [readNotifications, dispatch]
  );

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const getEventTitle = (event: Event) => {
    if (event.event_name) return event.event_name;
    try {
      const cleanDesc = event.event_description.replace(/^"|"$/g, '');
      const firstSentence = cleanDesc.split('.')[0];
      return firstSentence.length > 30
        ? firstSentence.substring(0, 30) + '...'
        : firstSentence;
    } catch {
      return 'Notification';
    }
  };

  const cleanDescription = (desc: string) => {
    return desc ? desc.replace(/^"|"$/g, '') : '';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="outline"
          size="icon"
          type="button"
          className="relative bg-transparent hover:bg-accent"
        >
          <Bell className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[450px] max-h-[65vh] bg-transparent backdrop-blur-xl border p-0 mt-2"
        align="center"
        sideOffset={5}
      >
        <div className="p-4 border-b border-border/50 flex justify-between items-center bg-card/80">
          <h2 className="text-lg font-semibold">Alerts</h2>
          <div className="flex items-center gap-2">
            {hasUnreadNotifications && (
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleMarkAllAsRead}
                className="bg-transparent hover:bg-accent/50"
              >
                Mark All as Read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              type="button"
              onClick={() => setIsOpen(false)}
              className="bg-transparent hover:bg-accent/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="max-h-[45vh] overflow-y-auto p-4 space-y-3 bg-card/60 backdrop-blur-sm">
          {latestEvents.length > 0 ? (
            latestEvents.map((event) => {
              const isUnread = !readNotifications.includes(event.id);
              return (
                <div
                  key={event.id}
                  className="p-2 rounded-md hover:bg-accent/50 cursor-pointer relative bg-card/40 backdrop-blur-sm border border-border/30"
                  onClick={() => handleNotificationClick(event)}
                >
                  {isUnread && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
                  )}
                  <p className="text-sm font-medium mb-2 pt-2 pl-2 pr-2 truncate">
                    {getEventTitle(event)}
                  </p>
                  <p className="text-xs text-muted-foreground px-2 line-clamp-2 mb-1">
                    {cleanDescription(event.event_description)}
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground px-2">
                    <div className="text-xs shrink-0">
                      {formatRelativeTime(event.created_at)}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-4">
              No alerts available.
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
