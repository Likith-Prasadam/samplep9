import React, { useMemo } from 'react';
import { NotificationItem } from './notification-item';
import type { Notification } from '../types/notifications';

interface NotificationListProps {
  notifications: Notification[];
  viewedNotifications: string[];
  expandedNotificationId: string | null;
  highlightedId: string | null;
  allLiveEventsMarkedAsRead: boolean;
  allBatchEventsMarkedAsRead: boolean;
  allLiveEventsMarkedAsReadAt: number | null;
  allBatchEventsMarkedAsReadAt: number | null;
  onNotificationClick: (notification: Notification) => void;
}

export const NotificationList: React.FC<NotificationListProps> = React.memo(
  ({
    notifications,
    viewedNotifications,
    expandedNotificationId,
    highlightedId,
    allLiveEventsMarkedAsRead,
    allBatchEventsMarkedAsRead,
    allLiveEventsMarkedAsReadAt,
    allBatchEventsMarkedAsReadAt,
    onNotificationClick,
  }) => {
    const viewedSet = useMemo(
      () => new Set(viewedNotifications),
      [viewedNotifications]
    );

    return (
      <div className="space-y-3 p-3 md:p-4">
        {notifications.map((notification, index) => {
          const id =
            notification.event_id ??
            (notification.timestamp
              ? new Date(notification.timestamp).toISOString()
              : `notification-${index}`);

          // Determine if notification is unread
          // A notification is unread if:
          // 1. It's explicitly in the viewedSet (marked as read individually)
          // 2. Or it was created AFTER the "mark all as read" action
          const getIsUnread = (): boolean => {
            // If explicitly viewed, it's read
            if (viewedSet.has(id)) {
              return false;
            }

            // Check if notification was created after mark-as-read action
            const notificationTime = notification.timestamp
              ? new Date(notification.timestamp).getTime()
              : 0;

            if (notification.type === 'live') {
              // If no mark-as-read action has occurred, it's unread
              if (!allLiveEventsMarkedAsRead || !allLiveEventsMarkedAsReadAt) {
                return true;
              }
              // If notification was created AFTER mark-as-read, it's unread
              return notificationTime > allLiveEventsMarkedAsReadAt;
            } else if (notification.type === 'batch') {
              // If no mark-as-read action has occurred, it's unread
              if (
                !allBatchEventsMarkedAsRead ||
                !allBatchEventsMarkedAsReadAt
              ) {
                return true;
              }
              // If notification was created AFTER mark-as-read, it's unread
              return notificationTime > allBatchEventsMarkedAsReadAt;
            }

            return true;
          };

          const isUnread = getIsUnread();
          const isExpanded = expandedNotificationId === id;
          const isHighlighted = highlightedId === id;

          return (
            <NotificationItem
              key={id}
              notification={notification}
              isUnread={isUnread}
              isExpanded={isExpanded}
              isHighlighted={isHighlighted}
              onNotificationClick={onNotificationClick}
            />
          );
        })}
      </div>
    );
  }
);

NotificationList.displayName = 'NotificationList';
