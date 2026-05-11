import {
  createSlice,
  createAsyncThunk,
  createSelector,
  type PayloadAction,
} from '@reduxjs/toolkit';
import { ApolloClient } from '@apollo/client';
import type { NormalizedCacheObject } from '@apollo/client';
import { GET_LIVE_EVENTS, GET_BATCH_EVENTS } from '@/graphql/events_queries';
import type {
  Notification,
  FetchOptions,
} from '@/features/notifications/types/notifications';
import type { ConnectionState } from '@/lib/ssemanager';
import { formatTime } from '@/utils/timeUtils';

// Helper function to format duration from seconds to a clean display format
const formatDuration = (durationInSeconds: number | undefined): string => {
  if (!durationInSeconds || durationInSeconds <= 0) return '0s';

  const roundedSeconds = Math.round(durationInSeconds);
  if (roundedSeconds < 60) {
    return `${roundedSeconds}s`;
  }

  const minutes = Math.floor(roundedSeconds / 60);
  const seconds = roundedSeconds % 60;

  if (minutes < 60) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let result = `${hours}h`;
  if (remainingMinutes > 0) result += ` ${remainingMinutes}m`;
  if (seconds > 0) result += ` ${seconds}s`;

  return result;
};

interface NotificationsState {
  notifications: Notification[];
  viewedNotifications: string[];
  unreadCameraIds: string[];
  isLoading: boolean;
  error: string | null;
  connectionState: ConnectionState;
  connectionId: string | null;
  isInitialized: boolean;
  totalItems: number;
  hasMoreNotifications: boolean;
  totalBatchEvents: number;
  totalLiveEvents: number;
  currentPage: number;
  currentFilter: 'live' | 'batch' | null;
  hasNewNotifications: boolean;
  /** After reprocess, card/chat show only notifications after this time (per batch). Bell still shows all. */
  clearedAtByBatchHash: Record<string, number>;
  /** Flag to track if all live events have been marked as read */
  allLiveEventsMarkedAsRead: boolean;
  /** Flag to track if all batch events have been marked as read */
  allBatchEventsMarkedAsRead: boolean;
  /** Timestamp when all live events were marked as read */
  allLiveEventsMarkedAsReadAt: number | null;
  /** Timestamp when all batch events were marked as read */
  allBatchEventsMarkedAsReadAt: number | null;
}

const VIEWED_NOTIFICATIONS_KEY = 'viewedNotifications';
const ALL_LIVE_EVENTS_MARKED_AS_READ_KEY = 'allLiveEventsMarkedAsRead';
const ALL_BATCH_EVENTS_MARKED_AS_READ_KEY = 'allBatchEventsMarkedAsRead';
const ALL_LIVE_EVENTS_MARKED_AS_READ_AT_KEY = 'allLiveEventsMarkedAsReadAt';
const ALL_BATCH_EVENTS_MARKED_AS_READ_AT_KEY = 'allBatchEventsMarkedAsReadAt';

const getViewedNotificationsFromStorage = (): string[] => {
  const stored = localStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const getAllLiveEventsMarkedAsReadFromStorage = (): boolean => {
  const stored = localStorage.getItem(ALL_LIVE_EVENTS_MARKED_AS_READ_KEY);
  return stored ? JSON.parse(stored) : false;
};

const getAllBatchEventsMarkedAsReadFromStorage = (): boolean => {
  const stored = localStorage.getItem(ALL_BATCH_EVENTS_MARKED_AS_READ_KEY);
  return stored ? JSON.parse(stored) : false;
};

const getAllLiveEventsMarkedAsReadAtFromStorage = (): number | null => {
  const stored = localStorage.getItem(ALL_LIVE_EVENTS_MARKED_AS_READ_AT_KEY);
  return stored ? JSON.parse(stored) : null;
};

const getAllBatchEventsMarkedAsReadAtFromStorage = (): number | null => {
  const stored = localStorage.getItem(ALL_BATCH_EVENTS_MARKED_AS_READ_AT_KEY);
  return stored ? JSON.parse(stored) : null;
};

const initialState: NotificationsState = {
  notifications: [],
  viewedNotifications: getViewedNotificationsFromStorage(),
  unreadCameraIds: [],
  isLoading: false,
  error: null,
  connectionState: 'disconnected' as ConnectionState,
  connectionId: null,
  isInitialized: false,
  totalItems: 0,
  hasMoreNotifications: true,
  totalBatchEvents: 0,
  totalLiveEvents: 0,
  currentPage: 1,
  currentFilter: null,
  hasNewNotifications: false,
  clearedAtByBatchHash: {},
  allLiveEventsMarkedAsRead: getAllLiveEventsMarkedAsReadFromStorage(),
  allBatchEventsMarkedAsRead: getAllBatchEventsMarkedAsReadFromStorage(),
  allLiveEventsMarkedAsReadAt: getAllLiveEventsMarkedAsReadAtFromStorage(),
  allBatchEventsMarkedAsReadAt: getAllBatchEventsMarkedAsReadAtFromStorage(),
};

const saveAllEventsMarkedAsReadToStorage = (
  liveMarked: boolean,
  batchMarked: boolean,
  liveMarkedAt: number | null,
  batchMarkedAt: number | null
): void => {
  localStorage.setItem(
    ALL_LIVE_EVENTS_MARKED_AS_READ_KEY,
    JSON.stringify(liveMarked)
  );
  localStorage.setItem(
    ALL_BATCH_EVENTS_MARKED_AS_READ_KEY,
    JSON.stringify(batchMarked)
  );
  localStorage.setItem(
    ALL_LIVE_EVENTS_MARKED_AS_READ_AT_KEY,
    JSON.stringify(liveMarkedAt)
  );
  localStorage.setItem(
    ALL_BATCH_EVENTS_MARKED_AS_READ_AT_KEY,
    JSON.stringify(batchMarkedAt)
  );
};

const recalculateUnreadCameraIds = (state: NotificationsState): void => {
  const viewedSet = new Set(state.viewedNotifications);
  const unreadIds = state.notifications
    .filter((n) => n.event_id && !viewedSet.has(n.event_id))
    .map((n) => n.details.camera_id)
    .filter((id): id is string => !!id);
  state.unreadCameraIds = [...new Set(unreadIds)];
};

const saveViewedToStorage = (viewed: string[]): void => {
  localStorage.setItem(VIEWED_NOTIFICATIONS_KEY, JSON.stringify(viewed));
};

export const fetchLiveEventsNew = createAsyncThunk(
  'notifications/fetchLiveEventsNew',
  async (
    options: {
      filters: Record<string, unknown>;
      page: number;
      itemsPerPage: number;
      sortBy: string;
      sortOrder: string;
    },
    thunkAPI
  ) => {
    const { apolloClient } = thunkAPI.extra as {
      apolloClient: ApolloClient<NormalizedCacheObject>;
    };
    const token =
      localStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      return thunkAPI.rejectWithValue('No authentication token');
    }

    try {
      const response = await apolloClient.query({
        query: GET_LIVE_EVENTS,
        variables: {
          filters: options.filters,
          itemsPerPage: options.itemsPerPage,
          page: options.page,
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc',
        },
        context: { headers: { Authorization: `Bearer ${token}` } },
        fetchPolicy: 'network-only',
      });

      const { events, hasNext, totalCount, page, itemsPerPage } =
        response.data.getLiveEvents;

      const convertedEvents = events.map((event: Record<string, unknown>) => {
        const chunkStartTime = event.chunkStartTime as string | undefined;
        const chunkEndTime = event.chunkEndTime as string | undefined;

        const formattedStart = chunkStartTime
          ? formatTime.card(chunkStartTime)
          : '';
        const formattedEnd = chunkEndTime ? formatTime.card(chunkEndTime) : '';
        const formattedDuration = formatDuration(event.chunkDuration as number);

        return {
          event_id:
            (event.eventHash as string) || `live-${page}-${Math.random()}`,
          timestamp: event.createdAt as string,
          event_received_utc: event.createdAt as string,
          alert: (event.eventTitle as string) || 'Live Event',
          details: {
            camera_id: event.camHash ? String(event.camHash) : undefined,
            cam_name: (event.camName as string) || undefined,
            event_type: event.eventType as string | undefined,
            description: event.eventDescription as string | undefined,
            timeline: {
              start: formattedStart,
              end: formattedEnd,
              duration: formattedDuration,
            },
            presigned_url: event.chunkPresignedUrl as string | undefined,
          },
          initials:
            (event.eventTitle as string)?.substring(0, 2).toUpperCase() || 'LE',
          type: 'live' as const,
          icon: 'radio-tower' as const,
          source: 'db' as const,
        } as Notification;
      });

      return {
        events: convertedEvents,
        totalCount,
        hasNext,
        page,
        itemsPerPage,
        type: 'live',
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch live events'
      );
    }
  }
);

export const fetchBatchEventsNew = createAsyncThunk(
  'notifications/fetchBatchEventsNew',
  async (
    options: {
      filters: Record<string, unknown>;
      page: number;
      itemsPerPage: number;
      sortBy: string;
      sortOrder: string;
    },
    thunkAPI
  ) => {
    const { apolloClient } = thunkAPI.extra as {
      apolloClient: ApolloClient<NormalizedCacheObject>;
    };
    const token =
      localStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      return thunkAPI.rejectWithValue('No authentication token');
    }

    try {
      const response = await apolloClient.query({
        query: GET_BATCH_EVENTS,
        variables: {
          filters: options.filters,
          itemsPerPage: options.itemsPerPage,
          page: options.page,
          sortBy: options.sortBy || 'createdAt',
          sortOrder: options.sortOrder || 'desc',
        },
        context: { headers: { Authorization: `Bearer ${token}` } },
        fetchPolicy: 'network-only',
      });

      const { events, hasNext, totalCount, page, itemsPerPage } =
        response.data.getBatchEvents;

      const convertedEvents = events.map((event: Record<string, unknown>) => {
        const chunkStartTime = event.chunkStartTime as string | undefined;
        const chunkEndTime = event.chunkEndTime as string | undefined;

        const formattedStart = chunkStartTime
          ? formatTime.card(chunkStartTime)
          : '';
        const formattedEnd = chunkEndTime ? formatTime.card(chunkEndTime) : '';

        return {
          event_id:
            (event.eventHash as string) || `batch-${page}-${Math.random()}`,
          timestamp: event.createdAt as string,
          event_received_utc: event.createdAt as string,
          alert: (event.eventTitle as string) || 'Batch Event',
          details: {
            batchHash: event.batchHash as string | undefined,
            batch_video_name: (event.batchName as string) || undefined,
            event_type: event.eventType as string | undefined,
            description: event.eventDescription as string | undefined,
            timeline: {
              start: formattedStart,
              end: formattedEnd,
              duration: '',
            },
            presigned_url: event.chunkPresignedUrl as string | undefined,
          },
          initials:
            (event.eventTitle as string)?.substring(0, 2).toUpperCase() || 'BE',
          type: 'batch' as const,
          icon: 'file-video' as const,
          source: 'db' as const,
        } as Notification;
      });

      return {
        events: convertedEvents,
        totalCount,
        hasNext,
        page,
        itemsPerPage,
        type: 'batch',
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch batch events'
      );
    }
  }
);

export const fetchNotificationCounts = createAsyncThunk(
  'notifications/fetchNotificationCounts',
  async (_, thunkAPI) => {
    const { apolloClient } = thunkAPI.extra as {
      apolloClient: ApolloClient<NormalizedCacheObject>;
    };
    const token =
      localStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      return thunkAPI.rejectWithValue('No authentication token');
    }

    try {
      const [liveResult, batchResult] = await Promise.all([
        apolloClient.query({
          query: GET_LIVE_EVENTS,
          variables: {
            filters: {},
            itemsPerPage: 1,
            page: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          context: { headers: { Authorization: `Bearer ${token}` } },
          fetchPolicy: 'cache-first',
        }),
        apolloClient.query({
          query: GET_BATCH_EVENTS,
          variables: {
            filters: {},
            itemsPerPage: 1,
            page: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          context: { headers: { Authorization: `Bearer ${token}` } },
          fetchPolicy: 'cache-first',
        }),
      ]);

      const liveTotal = liveResult.data?.getLiveEvents?.totalCount || 0;
      const batchTotal = batchResult.data?.getBatchEvents?.totalCount || 0;

      return { totalBatchEvents: batchTotal, totalLiveEvents: liveTotal };
    } catch {
      return thunkAPI.rejectWithValue('Failed to fetch counts');
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (options: FetchOptions, thunkAPI) => {
    const { apolloClient } = thunkAPI.extra as {
      apolloClient: ApolloClient<NormalizedCacheObject>;
    };
    const token =
      localStorage.getItem('access_token') || localStorage.getItem('token');

    if (!token) {
      return thunkAPI.rejectWithValue('No authentication token');
    }

    const storedViewed = localStorage.getItem(VIEWED_NOTIFICATIONS_KEY);
    if (storedViewed) {
      thunkAPI.dispatch(setViewedNotifications(JSON.parse(storedViewed)));
    }

    const effectiveType = options.videoId ? 'batch' : options.type;

    try {
      const filters: Record<string, unknown> = {};
      if (options.search) filters.searchQuery = options.search;
      if (options.videoId) filters.batchHash = options.videoId;

      const response =
        effectiveType === 'batch'
          ? await apolloClient.query({
              query: GET_BATCH_EVENTS,
              variables: {
                filters,
                itemsPerPage: options.itemsPerPage,
                page: options.page,
                sortBy: 'createdAt',
                sortOrder: 'desc',
              },
              context: { headers: { Authorization: `Bearer ${token}` } },
              fetchPolicy: 'network-only',
            })
          : await apolloClient.query({
              query: GET_LIVE_EVENTS,
              variables: {
                filters,
                itemsPerPage: options.itemsPerPage,
                page: options.page,
                sortBy: 'createdAt',
                sortOrder: 'desc',
              },
              context: { headers: { Authorization: `Bearer ${token}` } },
              fetchPolicy: 'network-only',
            });

      const events =
        effectiveType === 'batch'
          ? response.data.getBatchEvents?.events || []
          : response.data.getLiveEvents?.events || [];
      const total =
        effectiveType === 'batch'
          ? response.data.getBatchEvents?.totalCount || 0
          : response.data.getLiveEvents?.totalCount || 0;
      const hasMore =
        effectiveType === 'batch'
          ? response.data.getBatchEvents?.hasNext || false
          : response.data.getLiveEvents?.hasNext || false;

      const notifications: Notification[] = events.map(
        (event: Record<string, unknown>) => {
          const eventTitle = (event.eventTitle as string) || 'Event';
          const chunkStartTime = event.chunkStartTime as string | undefined;
          const chunkEndTime = event.chunkEndTime as string | undefined;

          const formattedStart = chunkStartTime
            ? formatTime.card(chunkStartTime)
            : '';
          const formattedEnd = chunkEndTime
            ? formatTime.card(chunkEndTime)
            : '';
          const formattedDuration = formatDuration(
            event.chunkDuration as number
          );

          return {
            event_id: String(event.eventHash || Math.random()),
            timestamp: (event.createdAt as string) || new Date().toISOString(),
            event_received_utc:
              (event.createdAt as string) || new Date().toISOString(),
            alert: eventTitle,
            details: {
              video_id:
                effectiveType === 'batch' ? String(event.batchHash) : undefined,
              batchHash:
                effectiveType === 'batch' ? String(event.batchHash) : undefined,
              camera_id: undefined,
              chunk_id:
                effectiveType === 'batch'
                  ? String(event.batchChunkHash)
                  : String(event.liveChunkHash),
              description: (event.eventDescription as string) || '',
              presigned_url: (event.chunkPresignedUrl as string) || '',
              batch_video_name:
                effectiveType === 'batch'
                  ? (event.batchName as string) || undefined
                  : undefined,
              cam_name:
                effectiveType === 'live'
                  ? (event.camName as string) || undefined
                  : undefined,
              timeline: {
                start: formattedStart,
                end: formattedEnd,
                duration: formattedDuration,
              },
            },
            initials: eventTitle.substring(0, 2).toUpperCase(),
            type: effectiveType,
            icon: effectiveType === 'live' ? 'radio-tower' : 'file-video',
            source: 'db',
          } as Notification;
        }
      );

      const sortedNotifications = notifications.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return {
        notifications: sortedNotifications,
        totalItems: total,
        hasMoreNotifications: hasMore,
        type: effectiveType,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch notifications'
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      const notification = action.payload;

      if (!notification.event_id) {
        return;
      }

      const viewedSet = new Set(state.viewedNotifications);
      if (
        viewedSet.has(notification.event_id) ||
        state.notifications.some((n) => n.event_id === notification.event_id)
      ) {
        return;
      }

      if (notification.type === 'batch') {
        state.totalBatchEvents += 1;
      } else if (notification.type === 'live') {
        state.totalLiveEvents += 1;
      }

      // Batch notifications from SSE: always add so they show immediately on playground and bell
      const isBatchFromSse =
        notification.type === 'batch' && notification.source === 'sse';
      const filterMatches =
        !state.currentFilter || state.currentFilter === notification.type;

      if (isBatchFromSse || (filterMatches && state.currentPage === 1)) {
        state.notifications.unshift(notification);
        state.notifications.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      } else if (filterMatches && state.currentPage !== 1) {
        state.hasNewNotifications = true;
      }

      // Reset the "all marked as read" flag if a new notification of the same type arrives
      if (notification.type === 'live') {
        state.allLiveEventsMarkedAsRead = false;
        state.allLiveEventsMarkedAsReadAt = null;
      } else if (notification.type === 'batch') {
        state.allBatchEventsMarkedAsRead = false;
        state.allBatchEventsMarkedAsReadAt = null;
      }
      // Save the updated flags to localStorage
      saveAllEventsMarkedAsReadToStorage(
        state.allLiveEventsMarkedAsRead,
        state.allBatchEventsMarkedAsRead,
        state.allLiveEventsMarkedAsReadAt,
        state.allBatchEventsMarkedAsReadAt
      );

      recalculateUnreadCameraIds(state);
    },

    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      recalculateUnreadCameraIds(state);
    },

    clearNotificationsForVideo: (
      state,
      action: PayloadAction<string | { videoId: string; batchHash?: string }>
    ) => {
      const { videoId, batchHash } =
        typeof action.payload === 'string'
          ? { videoId: action.payload, batchHash: undefined }
          : action.payload;
      const key = batchHash || videoId || '';
      if (key) {
        state.clearedAtByBatchHash[key] = Date.now();
      }
      recalculateUnreadCameraIds(state);
    },

    markAsViewed: (state, action: PayloadAction<string>) => {
      const viewedSet = new Set(state.viewedNotifications);
      viewedSet.add(action.payload);
      state.viewedNotifications = Array.from(viewedSet);
      saveViewedToStorage(state.viewedNotifications);
      recalculateUnreadCameraIds(state);
    },

    setViewedNotifications: (state, action: PayloadAction<string[]>) => {
      state.viewedNotifications = Array.isArray(action.payload)
        ? action.payload
        : Array.from(action.payload);

      saveViewedToStorage(state.viewedNotifications);
      recalculateUnreadCameraIds(state);
    },

    markAllAsRead: (state) => {
      const viewedSet = new Set(state.viewedNotifications);
      state.notifications.forEach(
        (n) => n.event_id && viewedSet.add(n.event_id)
      );
      state.viewedNotifications = Array.from(viewedSet);
      saveViewedToStorage(state.viewedNotifications);

      // Get current timestamp
      const now = Date.now();

      // Set the appropriate flag and timestamp based on current filter
      if (state.currentFilter === 'live') {
        state.allLiveEventsMarkedAsRead = true;
        state.allLiveEventsMarkedAsReadAt = now;
      } else if (state.currentFilter === 'batch') {
        state.allBatchEventsMarkedAsRead = true;
        state.allBatchEventsMarkedAsReadAt = now;
      }
      // Save flags and timestamps to localStorage
      saveAllEventsMarkedAsReadToStorage(
        state.allLiveEventsMarkedAsRead,
        state.allBatchEventsMarkedAsRead,
        state.allLiveEventsMarkedAsReadAt,
        state.allBatchEventsMarkedAsReadAt
      );
      recalculateUnreadCameraIds(state);
    },

    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    setConnectionState: (state, action: PayloadAction<ConnectionState>) => {
      state.connectionState = action.payload;
    },

    setConnectionId: (state, action: PayloadAction<string | null>) => {
      state.connectionId = action.payload;
    },

    setIsInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    setTotalItems: (state, action: PayloadAction<number>) => {
      state.totalItems = action.payload;
    },

    setHasMoreNotifications: (state, action: PayloadAction<boolean>) => {
      state.hasMoreNotifications = action.payload;
    },

    setTotalBatchEvents: (state, action: PayloadAction<number>) => {
      state.totalBatchEvents = action.payload;
    },

    setTotalLiveEvents: (state, action: PayloadAction<number>) => {
      state.totalLiveEvents = action.payload;
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },

    setCurrentFilter: (
      state,
      action: PayloadAction<'live' | 'batch' | null>
    ) => {
      state.currentFilter = action.payload;
    },

    clearNewNotificationsFlag: (state) => {
      state.hasNewNotifications = false;
    },

    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveEventsNew.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveEventsNew.fulfilled, (state, action) => {
        const apiEvents = action.payload.events;
        const apiEventIds = new Set(
          apiEvents.map((n: Notification) => n.event_id).filter(Boolean)
        );
        const existingSseLive = (state.notifications || []).filter(
          (n) =>
            n.type === 'live' &&
            n.source === 'sse' &&
            n.event_id &&
            !apiEventIds.has(n.event_id)
        );

        state.notifications = [...existingSseLive, ...apiEvents].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        state.totalItems = action.payload.totalCount;
        state.hasMoreNotifications = action.payload.hasNext;
        state.totalLiveEvents = action.payload.totalCount;
        state.currentPage = action.payload.page;
        state.currentFilter = 'live';
        state.isLoading = false;
        state.isInitialized = true;
        state.error = null;
        recalculateUnreadCameraIds(state);
      })
      .addCase(fetchLiveEventsNew.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.notifications = [];
      })

      .addCase(fetchBatchEventsNew.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBatchEventsNew.fulfilled, (state, action) => {
        const apiEvents = action.payload.events;
        const page = action.payload.page;

        if (page === 1) {
          const apiEventIds = new Set(
            apiEvents.map((n: Notification) => n.event_id).filter(Boolean)
          );
          const existingSseBatch = (state.notifications || []).filter(
            (n) =>
              n.type === 'batch' &&
              n.source === 'sse' &&
              n.event_id &&
              !apiEventIds.has(n.event_id)
          );
          const merged = [...existingSseBatch, ...apiEvents].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          state.notifications = merged;
        } else {
          const existingIds = new Set(
            state.notifications.map((n) => n.event_id).filter(Boolean)
          );
          const newEvents = apiEvents.filter(
            (n: Notification) => n.event_id && !existingIds.has(n.event_id)
          );
          state.notifications = [...state.notifications, ...newEvents];
        }

        state.totalItems = action.payload.totalCount;
        state.hasMoreNotifications = action.payload.hasNext;
        state.totalBatchEvents = Math.max(
          action.payload.totalCount,
          state.notifications.filter((n) => n.type === 'batch').length
        );
        state.currentPage = action.payload.page;
        state.currentFilter = 'batch';
        state.isLoading = false;
        state.isInitialized = true;
        state.error = null;
        recalculateUnreadCameraIds(state);
      })
      .addCase(fetchBatchEventsNew.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.notifications = [];
      })

      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const apiNotifications = action.payload.notifications;
        const { type: eventType } = action.payload;
        if (eventType === 'batch') {
          const apiEventIds = new Set(
            apiNotifications
              .map((n: Notification) => n.event_id)
              .filter(Boolean)
          );
          const existingSseBatch = (state.notifications || []).filter(
            (n) =>
              n.type === 'batch' &&
              n.source === 'sse' &&
              n.event_id &&
              !apiEventIds.has(n.event_id)
          );
          state.notifications = [...existingSseBatch, ...apiNotifications].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        } else {
          state.notifications = apiNotifications;
        }
        state.totalItems = action.payload.totalItems;
        state.hasMoreNotifications = action.payload.hasMoreNotifications;
        if (eventType === 'batch') {
          state.totalBatchEvents = Math.max(
            action.payload.totalItems,
            state.notifications.filter((n) => n.type === 'batch').length
          );
        }
        if (eventType === 'live') {
          state.totalLiveEvents = action.payload.totalItems;
        }
        state.isLoading = false;
        state.isInitialized = true;
        recalculateUnreadCameraIds(state);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchNotificationCounts.fulfilled, (state, action) => {
        state.totalBatchEvents = action.payload.totalBatchEvents;
        state.totalLiveEvents = action.payload.totalLiveEvents;
      });
  },
});

export const {
  addNotification,
  setNotifications,
  clearNotificationsForVideo,
  markAsViewed,
  setViewedNotifications,
  markAllAsRead,
  setIsLoading,
  setError,
  setConnectionState,
  setConnectionId,
  setIsInitialized,
  setTotalItems,
  setHasMoreNotifications,
  setTotalBatchEvents,
  setTotalLiveEvents,
  setCurrentPage,
  setCurrentFilter,
  clearNewNotificationsFlag,
  resetNotifications,
} = notificationsSlice.actions;

interface AppState {
  notifications: NotificationsState;
}

const EMPTY_NOTIFICATIONS: Notification[] = [];
const selectEmptyNotifications = () => EMPTY_NOTIFICATIONS;
const notificationsForVideoSelectorCache = new Map<
  string,
  (state: AppState) => Notification[]
>();

export const selectNotifications = (state: AppState) =>
  state.notifications.notifications;
export const selectViewedNotifications = (state: AppState) =>
  state.notifications.viewedNotifications;
export const selectUnreadCameraIds = (state: AppState) =>
  state.notifications.unreadCameraIds;
export const selectIsLoading = (state: AppState) =>
  state.notifications.isLoading;
export const selectError = (state: AppState) => state.notifications.error;
export const selectConnectionState = (state: AppState) =>
  state.notifications.connectionState;
export const selectConnectionId = (state: AppState) =>
  state.notifications.connectionId;
export const selectIsInitialized = (state: AppState) =>
  state.notifications.isInitialized;
export const selectTotalItems = (state: AppState) =>
  state.notifications.totalItems;
export const selectHasMoreNotifications = (state: AppState) =>
  state.notifications.hasMoreNotifications;
export const selectTotalBatchEvents = (state: AppState) =>
  state.notifications.totalBatchEvents;
export const selectTotalLiveEvents = (state: AppState) =>
  state.notifications.totalLiveEvents;
export const selectCurrentPage = (state: AppState) =>
  state.notifications.currentPage;
export const selectCurrentFilter = (state: AppState) =>
  state.notifications.currentFilter;
export const selectHasNewNotifications = (state: AppState) =>
  state.notifications.hasNewNotifications;
export const selectNotificationsState = (state: AppState) =>
  state.notifications;
export const selectAllLiveEventsMarkedAsRead = (state: AppState) =>
  state.notifications.allLiveEventsMarkedAsRead;
export const selectAllBatchEventsMarkedAsRead = (state: AppState) =>
  state.notifications.allBatchEventsMarkedAsRead;
export const selectAllLiveEventsMarkedAsReadAt = (state: AppState) =>
  state.notifications.allLiveEventsMarkedAsReadAt;
export const selectAllBatchEventsMarkedAsReadAt = (state: AppState) =>
  state.notifications.allBatchEventsMarkedAsReadAt;
export const selectClearedAtByBatchHash = (state: AppState) =>
  state.notifications.clearedAtByBatchHash;

/** For card/chat: only notifications for this video that are after the "cleared at" time (reprocess). Bell uses selectNotifications (all). */
export const selectNotificationsForVideo = (batchHash: string | undefined) => {
  const key = batchHash?.trim().toLowerCase();

  if (!key) {
    return selectEmptyNotifications;
  }

  const cached = notificationsForVideoSelectorCache.get(key);
  if (cached) {
    return cached;
  }

  const selector = createSelector(
    [
      (state: AppState) => state.notifications.notifications,
      (state: AppState) => state.notifications.clearedAtByBatchHash[key] ?? 0,
    ],
    (list, clearedAt) =>
      list.filter((n) => {
        if (n.type !== 'batch') return false;
        const nBatch = String(n.details?.batchHash ?? '')
          .trim()
          .toLowerCase();
        const nVideoId = String(n.details?.video_id ?? '')
          .trim()
          .toLowerCase();
        if (!nBatch && !nVideoId) return false;
        const matches = nBatch === key || nVideoId === key;
        if (!matches) return false;
        const ts = new Date(n.timestamp || 0).getTime();
        return ts > clearedAt;
      })
  );

  notificationsForVideoSelectorCache.set(key, selector);
  return selector;
};

export default notificationsSlice.reducer;
