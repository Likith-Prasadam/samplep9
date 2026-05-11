import { getUserSession } from '@/lib/ssemanager';

const NOTIFICATION_STATUS_URL = import.meta.env.VITE_NOTIFICATIONS_STATUS_URL;

const getAuthToken = (): string | null => {
  try {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) return accessToken;

    const token = localStorage.getItem('token');
    if (token) return token;

    const session = getUserSession();
    if (session.token) return session.token;

    return null;
  } catch {
    return null;
  }
};

export interface NotificationStatusResponse {
  status: string;
  timestamp?: string;
  [key: string]: unknown;
}

export const fetchNotificationStatus =
  async (): Promise<NotificationStatusResponse> => {
    const token = getAuthToken();

    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(NOTIFICATION_STATUS_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch notification status: ${response.status}`
      );
    }

    const data: NotificationStatusResponse = await response.json();

    return data;
  };

export const fetchNotificationMetrics = async () => {
  const [status] = await Promise.all([fetchNotificationStatus()]);

  return {
    status,
    fetchedAt: new Date().toISOString(),
  };
};
