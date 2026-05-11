import React from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Notification } from '../types/notifications';
import { formatTimeInTimezone } from '@/utils/timeUtils';
import { useTimezone } from '@/hooks/use-timezone';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NotificationItemProps {
  notification: Notification;
  isUnread: boolean;
  isExpanded: boolean;
  isHighlighted: boolean;
  onNotificationClick: (notification: Notification) => void;
}

const formatAlert = (alert: string) =>
  alert.charAt(0).toUpperCase() + alert.slice(1);

export const NotificationItem: React.FC<NotificationItemProps> = React.memo(
  ({
    notification,
    isUnread,
    isExpanded,
    isHighlighted,
    onNotificationClick,
  }) => {
    const { selectedTimezone } = useTimezone();
    const rawTimestamp =
      notification.event_received_utc || notification.timestamp || '';
    const timestampToDisplay = rawTimestamp
      ? formatTimeInTimezone(rawTimestamp, selectedTimezone.iana, 'datetime')
      : '';

    const chunkUrl = notification.details.presigned_url || '';
    const hasVideoUrl = !!chunkUrl;

    const handleRowClick = () => {
      onNotificationClick(notification);
    };

    return (
      <div
        className={cn(
          'rounded-lg border bg-card overflow-hidden transition-shadow relative',
          'hover:shadow-md',
          isHighlighted && 'highlight-notification'
        )}
      >
        <div className="p-3 cursor-pointer" onClick={handleRowClick}>
          <div className="flex gap-3">
            {hasVideoUrl && (
              <div className="relative w-26 h-14 rounded-md overflow-hidden bg-muted shrink-0">
                <video
                  className="w-full h-full object-cover"
                  src={chunkUrl}
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

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start justify-between gap-2 pt-2.5">
                <p className="text-xs font-medium text-foreground line-clamp-2 flex-1">
                  {formatAlert(notification.alert)}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  {hasVideoUrl && (
                    <Badge variant="outline" className="text-xs">
                      {notification.type === 'live'
                        ? notification.details.cam_name || 'Incident Clip'
                        : notification.details.batch_video_name ||
                          'Incident Clip'}
                    </Badge>
                  )}
                  {isUnread && (
                    <span
                      className="h-2 w-2 bg-primary rounded-full shrink-0"
                      title="Unread"
                    />
                  )}
                  {hasVideoUrl && (
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0',
                        isExpanded ? 'rotate-180' : ''
                      )}
                    />
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {timestampToDisplay && (
                  <span>
                    {timestampToDisplay}{' '}
                    <span className="font-medium">
                      {selectedTimezone.value}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {isExpanded && hasVideoUrl && (
          <div className="border-t border-border/50 p-3">
            <div className="grid grid-cols-7 gap-4">
              <div className="col-span-3 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">
                  Incident Clip
                </h4>
                <video
                  src={chunkUrl}
                  controls
                  className="w-full h-40 rounded-md bg-black"
                  preload="metadata"
                />
              </div>

              {/* Right side - Description */}
              <div className="col-span-4 space-y-4 pt-1">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">
                    Description
                  </h4>
                  {notification.details?.description ? (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notification.details.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No description available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

NotificationItem.displayName = 'NotificationItem';
