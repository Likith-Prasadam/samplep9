import { createContext } from 'react';
import type { Notification } from '@/features/notifications/types/notifications';

export interface NotificationContextType {
  unreadCameraIds: Set<string>;
  notifications: Notification[];
  viewedNotifications: Set<string>;
  allLiveEventsMarkedAsRead: boolean;
  allBatchEventsMarkedAsRead: boolean;
  allLiveEventsMarkedAsReadAt: number | null;
  allBatchEventsMarkedAsReadAt: number | null;
  clearNotificationsForVideo: (videoId: string) => void;
  fetchNotificationCounts: () => Promise<void>;
  loadNotificationData: () => void;
  fetchNotifications: (options: {
    itemsPerPage: number;
    page: number;
    type?: 'live' | 'batch';
    search?: string;
    videoId?: string | null;
  }) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  connectionState: string;
  connectionId: string | null;
  connectSSE: () => void;
  hasMoreNotifications: boolean;
  totalBatchEvents: number;
  totalLiveEvents: number;
  setViewedNotifications: React.Dispatch<React.SetStateAction<Set<string>>>;
  isInitialized: boolean;
  markAllAsRead: () => void;
  totalItems: number;
  hasNewNotifications: boolean;
  clearNewNotificationsFlag: () => void;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);
