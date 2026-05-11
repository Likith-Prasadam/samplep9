import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell, Clock } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
import type { Notification } from '@/features/notifications/types/notifications';
import {
  selectNotifications,
  selectViewedNotifications,
  selectAllLiveEventsMarkedAsRead,
  selectAllLiveEventsMarkedAsReadAt,
} from '@/store/slices/notifications-slice';
import { cn } from '@/lib/utils';

export type ActiveTab =
  | 'notifications'
  | 'chat'
  | 'configuration'
  | 'search'
  | 'timeline'; // 'clips' removed - Video Clips feature disabled for future use

interface TabButtonsProps {
  activeTab: ActiveTab;
  setActiveTab: React.Dispatch<React.SetStateAction<ActiveTab>>;
  /** Live stream camera hash; unread + animations are scoped to this camera */
  cameraHash?: string;
}

const normalizeCamId = (value?: string | null): string => {
  if (!value) return '';
  return value.trim().toLowerCase();
};

const parseNotificationTime = (notification: Notification): number | null => {
  const raw = notification.event_received_utc || notification.timestamp;
  if (!raw) return null;
  const parsed = new Date(raw).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

const isLiveNotificationUnreadForCamera = (
  notification: Notification,
  cameraKey: string,
  viewedSet: Set<string>,
  allLiveMarked: boolean,
  allLiveMarkedAt: number | null
): boolean => {
  if (notification.type !== 'live') return false;

  const notificationCam = normalizeCamId(notification.details?.camera_id);
  if (!notificationCam || notificationCam !== cameraKey) return false;

  if (notification.event_id && viewedSet.has(notification.event_id)) {
    return false;
  }

  if (allLiveMarked) {
    if (!allLiveMarkedAt) return false;
    const notificationTime = parseNotificationTime(notification);
    if (notificationTime && notificationTime <= allLiveMarkedAt) {
      return false;
    }
  }

  return true;
};

const TabButtons: React.FC<TabButtonsProps> = ({
  activeTab,
  setActiveTab,
  cameraHash = '',
}) => {
  const notifications = useSelector((state: RootState) =>
    selectNotifications(state)
  );
  const viewedIds = useSelector((state: RootState) =>
    selectViewedNotifications(state)
  );
  const allLiveMarked = useSelector((state: RootState) =>
    selectAllLiveEventsMarkedAsRead(state)
  );
  const allLiveMarkedAt = useSelector((state: RootState) =>
    selectAllLiveEventsMarkedAsReadAt(state)
  );

  const viewedSet = useMemo(() => new Set(viewedIds), [viewedIds]);

  const cameraKey = useMemo(() => normalizeCamId(cameraHash), [cameraHash]);

  const liveUnreadForCamera = useMemo(() => {
    if (!cameraKey) return 0;
    return notifications.reduce((acc, n) => {
      return isLiveNotificationUnreadForCamera(
        n,
        cameraKey,
        viewedSet,
        allLiveMarked,
        allLiveMarkedAt
      )
        ? acc + 1
        : acc;
    }, 0);
  }, [notifications, cameraKey, viewedSet, allLiveMarked, allLiveMarkedAt]);

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [showRipple, setShowRipple] = useState(false);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    if (activeTab === 'notifications') {
      setShowRipple(false);
      setShouldAnimate(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (liveUnreadForCamera === 0) {
      setShowRipple(false);
      setShouldAnimate(false);
    }
  }, [liveUnreadForCamera]);

  useEffect(() => {
    let ringTimer: ReturnType<typeof setTimeout> | undefined;
    let rippleTimer: ReturnType<typeof setTimeout> | undefined;

    if (
      liveUnreadForCamera > prevUnreadRef.current &&
      liveUnreadForCamera > 0
    ) {
      setShouldAnimate(true);
      setShowRipple(true);
      ringTimer = setTimeout(() => setShouldAnimate(false), 1000);
      rippleTimer = setTimeout(() => setShowRipple(false), 20000);
    }

    prevUnreadRef.current = liveUnreadForCamera;

    return () => {
      if (ringTimer) clearTimeout(ringTimer);
      if (rippleTimer) clearTimeout(rippleTimer);
    };
  }, [liveUnreadForCamera]);

  return (
    <>
      <style>{`
        @keyframes liveBellRing {
          0%, 100% { transform: rotate(0deg); }
          10%, 30%, 50%, 70%, 90% { transform: rotate(-15deg); }
          20%, 40%, 60%, 80% { transform: rotate(15deg); }
        }
        .live-bell-animate {
          animation: liveBellRing 1s ease-in-out;
          transform-origin: top center;
        }
        @keyframes liveAlertsRipple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        .live-alerts-ripple {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid var(--primary);
          animation: liveAlertsRipple 1.5s ease-out forwards;
          z-index: 0;
        }
      `}</style>
      <div className="shrink-0 rounded-lg border bg-muted px-2 py-2 flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          variant={activeTab === 'chat' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('chat')}
          aria-label="Chat"
          className="h-9 w-9"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border/60" />
        <Button
          type="button"
          size="icon"
          variant={activeTab === 'notifications' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('notifications')}
          aria-label="Alerts"
          className="relative h-9 w-9 overflow-visible"
        >
          {showRipple && <span className="live-alerts-ripple" aria-hidden />}
          <Bell
            className={cn(
              'h-4 w-4 z-10 relative',
              shouldAnimate && 'live-bell-animate'
            )}
          />
          {liveUnreadForCamera > 0 && cameraKey ? (
            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-primary z-10 ring-2 ring-background" />
          ) : null}
        </Button>
        <div className="h-6 w-px bg-border/60" />
        <Button
          type="button"
          size="icon"
          variant={activeTab === 'search' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('search')}
          aria-label="Search"
          className="h-9 w-9"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M22.3135 20.8994L20.8994 22.3134L18.0713 19.4853L19.4854 18.0712L22.3135 20.8994ZM11 1.99995C11.2639 1.99995 11.525 2.01379 11.7832 2.03608C11.4424 2.63463 11.202 3.2974 11.084 4.0019C11.056 4.00158 11.028 3.99995 11 3.99995C7.13256 3.99995 4.00011 7.13254 4 11C4 14.8675 7.1325 18 11 18C14.8675 18 18 14.8675 18 11C18 10.9716 17.9974 10.9432 17.9971 10.915C18.7018 10.7971 19.3642 10.5566 19.9629 10.2158C19.9852 10.4742 20 10.7357 20 11C20 15.968 15.968 20 11 20C6.032 20 2 15.968 2 11C2.00011 6.03204 6.03206 1.99995 11 1.99995ZM16.5293 1.31929C16.7058 0.893246 17.2943 0.893246 17.4707 1.31929L17.7236 1.93061C18.1556 2.97343 18.9615 3.80614 19.9746 4.25679L20.6924 4.57612C21.1026 4.75903 21.1027 5.35623 20.6924 5.53901L19.9326 5.8769C18.9448 6.31622 18.1534 7.11927 17.7139 8.12788L17.4668 8.69331C17.2864 9.10744 16.7137 9.10744 16.5332 8.69331L16.2871 8.12788C15.8476 7.11924 15.0552 6.31623 14.0674 5.8769L13.3076 5.53901C12.8974 5.35624 12.8975 4.75902 13.3076 4.57612L14.0254 4.25679C15.0385 3.80614 15.8445 2.97346 16.2764 1.93061L16.5293 1.31929Z"></path>
          </svg>
        </Button>
        <div className="h-6 w-px bg-border/60" />
        <Button
          type="button"
          size="icon"
          variant={activeTab === 'timeline' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('timeline')}
          aria-label="Timeline View"
          className="h-9 w-9"
        >
          <Clock className="h-4 w-4" />
        </Button>
        <div className="h-6 w-px bg-border/60" />
        <Button
          type="button"
          size="icon"
          variant={activeTab === 'configuration' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('configuration')}
          aria-label="Configuration"
          className="h-9 w-9"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M13 3.99982H11V8.99983C11 9.55212 10.5523 9.99983 10 9.99983H5V19.9999H19V9.99983H21V21.0077C21 21.5553 20.5552 21.9997 20.0068 21.9999H3.99316C3.44464 21.9997 3.00001 21.5498 3 20.993V7.99983L9 2.00275V1.99982H13V3.99982ZM5.8291 7.99983H9V4.83088L5.8291 7.99983ZM19.4707.329338C19.2943-.096459 18.7059-.0964476 18.5293.329338L18.2764.940667C17.8445 1.98348 17.0385 2.81618 16.0254 3.26684L15.3076 3.58618C14.8974 3.76899 14.8975 4.36621 15.3076 4.54907L16.0674 4.88696C17.0552 5.32629 17.8476 6.12931 18.2871 7.13794L18.5332 7.70337C18.7137 8.11751 19.2864 8.11751 19.4668 7.70337L19.7139 7.13794C20.1534 6.12947 20.945 5.32624 21.9326 4.88696L22.6924 4.54907C23.1026 4.3662 23.1027 3.769 22.6924 3.58618L21.9746 3.26684C20.9616 2.81618 20.1556 1.98346 19.7237.940667L19.4707.329338Z"></path>
          </svg>
        </Button>
      </div>
    </>
  );
};

export default TabButtons;
