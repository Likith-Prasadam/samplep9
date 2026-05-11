import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { useNotifications } from '@/providers/notifications-provider';
import type { Notification } from '../types/notifications';
import { cn } from '@/lib/utils';

interface ToastNotification {
  id: string;
  alert: string;
  timestamp: string;
}

const NotificationToast: React.FC = () => {
  const { notifications, isInitialized } = useNotifications();
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const processedNotificationIds = useRef(new Set<string>());
  const initialLoadComplete = useRef(false);

  const formatRelativeTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  useEffect(() => {
    if (isInitialized && !initialLoadComplete.current) {
      notifications.forEach((n) => {
        const id = n.event_id ?? n.timestamp;
        processedNotificationIds.current.add(id);
      });
      initialLoadComplete.current = true;
      return;
    }

    if (!initialLoadComplete.current) {
      return;
    }

    const newNotifications = notifications.filter((n: Notification) => {
      const id = n.event_id ?? n.timestamp;
      return n.source === 'sse' && !processedNotificationIds.current.has(id);
    });

    newNotifications.forEach((notification) => {
      const id = notification.event_id ?? notification.timestamp;
      processedNotificationIds.current.add(id);

      setToasts((prev) => {
        const newToast = {
          id,
          alert: notification.alert,
          timestamp: notification.event_received_utc || notification.timestamp,
        };
        return [newToast, ...prev].slice(0, 3);
      });

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 6000);

      return () => clearTimeout(timer);
    });
  }, [notifications, isInitialized]);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-1000">
      <style>
        {`@keyframes slideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }`}
      </style>
      <div className="fixed bottom-4 right-4 space-y-2 z-1000">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'bg-gray-900/90 backdrop-blur-md text-white p-4 rounded-md shadow-lg',
              'w-80 max-w-sm border border-gray-500/50',
              'animate-slide-in-right'
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 truncate">
                <p className="text-sm font-medium truncate">{toast.alert}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(toast.timestamp)}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(toast.id)}
                className="text-gray-400 hover:text-teal-400 transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationToast;
