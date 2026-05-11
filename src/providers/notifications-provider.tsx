import React, { useEffect, useCallback, useRef, useMemo } from 'react';
import type { Notification } from '@/features/notifications/types/notifications';
import {
  NotificationContext,
  type NotificationContextType,
} from '@/lib/notification-context';
import {
  sseManager,
  MESSAGE_TYPES,
  CONNECTION_STATES,
  getUserSession,
  safeJSON,
  type MessageType,
  type SSEClientEvent,
} from '@/lib/ssemanager';
import apolloClient from '@/lib/apollo-client';
import { GET_LIVE_EVENTS } from '@/graphql/events_queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addNotification,
  setError,
  setConnectionState,
  setConnectionId,
  setIsInitialized,
  setViewedNotifications,
  markAllAsRead as markAllAsReadAction,
  clearNotificationsForVideo as clearNotificationsForVideoAction,
  setCurrentPage,
  setCurrentFilter,
  clearNewNotificationsFlag as clearNewNotificationsFlagAction,
  fetchNotifications as fetchNotificationsThunk,
  fetchNotificationCounts as fetchNotificationCountsThunk,
  fetchBatchEventsNew as fetchBatchEventsNewThunk,
  selectAllLiveEventsMarkedAsRead,
  selectAllBatchEventsMarkedAsRead,
  selectAllLiveEventsMarkedAsReadAt,
  selectAllBatchEventsMarkedAsReadAt,
} from '@/store/slices/notifications-slice';

export const NotificationProvider: React.FC<{ children: React.ReactNode }> =
  React.memo(({ children }) => {
    const dispatch = useAppDispatch();

    const notifications = useAppSelector(
      (state) => state.notifications.notifications
    );
    const viewedNotifications = useAppSelector(
      (state) => state.notifications.viewedNotifications
    );
    const unreadCameraIds = useAppSelector(
      (state) => state.notifications.unreadCameraIds
    );
    const isLoading = useAppSelector((state) => state.notifications.isLoading);
    const error = useAppSelector((state) => state.notifications.error);
    const connectionState = useAppSelector(
      (state) => state.notifications.connectionState
    );
    const videosList = useAppSelector(
      (state) => state.batchVideos?.videoslist || []
    );
    const connectionId = useAppSelector(
      (state) => state.notifications.connectionId
    );
    const isInitialized = useAppSelector(
      (state) => state.notifications.isInitialized
    );
    const totalItems = useAppSelector(
      (state) => state.notifications.totalItems
    );
    const hasMoreNotifications = useAppSelector(
      (state) => state.notifications.hasMoreNotifications
    );
    const totalBatchEvents = useAppSelector(
      (state) => state.notifications.totalBatchEvents
    );
    const totalLiveEvents = useAppSelector(
      (state) => state.notifications.totalLiveEvents
    );
    const hasNewNotifications = useAppSelector(
      (state) => state.notifications.hasNewNotifications
    );
    const allLiveEventsMarkedAsRead = useAppSelector(
      selectAllLiveEventsMarkedAsRead
    );
    const allBatchEventsMarkedAsRead = useAppSelector(
      selectAllBatchEventsMarkedAsRead
    );
    const allLiveEventsMarkedAsReadAt = useAppSelector(
      selectAllLiveEventsMarkedAsReadAt
    );
    const allBatchEventsMarkedAsReadAt = useAppSelector(
      selectAllBatchEventsMarkedAsReadAt
    );

    const calculateDuration = useCallback(
      (start: string, end: string): string => {
        const durationMs = new Date(end).getTime() - new Date(start).getTime();
        const seconds = Math.floor(durationMs / 1000);
        return seconds >= 0 ? `${seconds}s` : '0s';
      },
      []
    );

    const [notificationDataNeeded, setNotificationDataNeeded] =
      React.useState(false);

    const fetchNotificationCounts = useCallback(async () => {
      if (!notificationDataNeeded) return;
      await dispatch(fetchNotificationCountsThunk());
    }, [dispatch, notificationDataNeeded]);

    const fetchNotificationCountsRef = useRef(fetchNotificationCounts);
    const lastSilentLiveSyncAtRef = useRef(0);

    useEffect(() => {
      fetchNotificationCountsRef.current = fetchNotificationCounts;
    }, [fetchNotificationCounts]);

    const silentSyncLatestLiveEvents = useCallback(async () => {
      const now = Date.now();
      if (now - lastSilentLiveSyncAtRef.current < 3000) {
        return;
      }
      lastSilentLiveSyncAtRef.current = now;

      const session = getUserSession();
      if (!session.token) {
        return;
      }

      try {
        const response = await apolloClient.query({
          query: GET_LIVE_EVENTS,
          variables: {
            filters: {},
            itemsPerPage: 10,
            page: 1,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          },
          context: {
            headers: { Authorization: `Bearer ${session.token}` },
          },
          fetchPolicy: 'network-only',
        });

        const events = response?.data?.getLiveEvents?.events || [];
        for (const event of events) {
          const eventTitle = String(event?.eventTitle || 'Live Event');
          const chunkStartTime = event?.chunkStartTime
            ? String(event.chunkStartTime)
            : '';
          const chunkEndTime = event?.chunkEndTime
            ? String(event.chunkEndTime)
            : '';

          const notification: Notification = {
            event_id: String(
              event?.eventHash ||
                `${event?.camHash || 'cam'}-${event?.createdAt || Date.now()}`
            ),
            timestamp: String(event?.createdAt || new Date().toISOString()),
            event_received_utc: String(
              event?.createdAt || new Date().toISOString()
            ),
            alert: eventTitle,
            details: {
              camera_id: event?.camHash ? String(event.camHash) : undefined,
              cam_name: event?.camName ? String(event.camName) : undefined,
              event_type: event?.eventType
                ? String(event.eventType)
                : undefined,
              description: event?.eventDescription
                ? String(event.eventDescription)
                : undefined,
              chunk_id: event?.liveChunkHash
                ? String(event.liveChunkHash)
                : undefined,
              presigned_url: event?.chunkPresignedUrl
                ? String(event.chunkPresignedUrl)
                : undefined,
              timeline:
                chunkStartTime && chunkEndTime
                  ? {
                      start: chunkStartTime,
                      end: chunkEndTime,
                      duration: calculateDuration(chunkStartTime, chunkEndTime),
                    }
                  : { start: '', end: '', duration: '0s' },
            },
            initials: eventTitle.substring(0, 2).toUpperCase(),
            type: 'live',
            icon: 'radio-tower',
            // Mark as SSE-like insert so reducer prepends immediately.
            source: 'sse',
          };

          dispatch(addNotification(notification));
        }
      } catch {
        // Silent fallback; swallow errors to avoid user-facing noise.
      }
    }, [calculateDuration, dispatch]);

    useEffect(() => {
      const session = getUserSession();
      if (!session.token || !session.cohortId) {
        return;
      }

      // Keep live alerts fresh in background regardless of active tab (chat/alerts/search).
      void silentSyncLatestLiveEvents();
      const intervalId = window.setInterval(() => {
        void silentSyncLatestLiveEvents();
      }, 6000);

      return () => {
        window.clearInterval(intervalId);
      };
    }, [silentSyncLatestLiveEvents]);

    const loadNotificationData = useCallback(() => {
      setNotificationDataNeeded(true);
      dispatch(fetchNotificationCountsThunk());
    }, [dispatch]);

    const videosListRef = useRef(videosList);

    useEffect(() => {
      videosListRef.current = videosList;
    }, [videosList]);

    const handleIncomingEvent = useCallback(
      (event: SSEClientEvent) => {
        const e = event as SSEClientEvent;

        if (e.type === 'open') {
          dispatch(setConnectionState(CONNECTION_STATES.CONNECTED));
          dispatch(setError(null));
          dispatch(setConnectionId(sseManager.getConnectionId()));
          return;
        }

        if (event.type === 'error') {
          dispatch(setConnectionState(CONNECTION_STATES.ERROR));
          return;
        }

        if (event.type !== 'message') {
          return;
        }

        const parsed = event.parsed ?? safeJSON(String(event.raw.data));

        if (!parsed) {
          void silentSyncLatestLiveEvents();
          return;
        }

        const normalizedMsgType = String(
          parsed?.type ?? parsed?.event_type ?? parsed?.data?.type ?? ''
        ).toLowerCase();
        const msgType = normalizedMsgType as MessageType | '';

        if (msgType === MESSAGE_TYPES.CONNECTION) {
          dispatch(setConnectionId(parsed?.data?.connection_id ?? null));
          dispatch(setConnectionState(CONNECTION_STATES.CONNECTED));
          dispatch(setError(null));
          return;
        }

        if (msgType === MESSAGE_TYPES.HEARTBEAT) {
          return;
        }

        if (msgType === MESSAGE_TYPES.SYSTEM_ALERT) {
          dispatch(setError(parsed?.data?.message || 'System alert received'));
          return;
        }

        const eventPayload =
          parsed?.data && typeof parsed.data === 'object'
            ? parsed.data
            : parsed;
        const hasEventDetectionShape = Boolean(
          eventPayload &&
            (eventPayload?.event_title ||
              eventPayload?.event_name ||
              eventPayload?.blob_source_file_uri ||
              eventPayload?.camera_id ||
              eventPayload?.batch_hash_name)
        );
        const hasDbEventShape = Boolean(
          eventPayload &&
            (eventPayload?.eventTitle ||
              eventPayload?.eventHash ||
              eventPayload?.camHash ||
              eventPayload?.createdAt)
        );

        if (
          msgType === MESSAGE_TYPES.EVENT_DETECTION ||
          hasEventDetectionShape ||
          hasDbEventShape
        ) {
          const data = parsed;
          const payload = eventPayload;
          const presignedUrl =
            payload?.blob_subsampled_video_uris?.[0]?.path ||
            payload?.blob_source_file_uri ||
            payload?.chunkPresignedUrl;

          const alert =
            payload?.event_title ||
            payload?.event_name ||
            payload?.eventTitle ||
            'Real-time Event';

          let description =
            payload?.event_description ||
            payload?.eventDescription ||
            'No description.';
          if (
            typeof description === 'string' &&
            description.includes('Description:')
          ) {
            const descMatch = description.match(/Description:\s?(.*)/s);
            description = descMatch ? descMatch[1].trim() : description;
          }

          let notificationType: 'live' | 'batch';
          if (
            payload?.inference_modality === 'live' ||
            payload?.camHash ||
            payload?.camName
          ) {
            notificationType = 'live';
          } else if (payload?.inference_modality === 'batch') {
            notificationType = 'batch';
          } else {
            if (payload?.batch_hash_name || payload?.batchHash) {
              notificationType = 'batch';
            } else {
              notificationType = 'live';
            }
          }

          const sseId =
            (event.raw.lastEventId && String(event.raw.lastEventId)) ||
            (parsed?.id != null ? String(parsed.id) : null);
          const eventTimestamp =
            data?.event_received_utc ||
            payload?.event_received_utc ||
            payload?.createdAt ||
            payload?.timestamp ||
            (data?.timestamp
              ? new Date(data.timestamp * 1000).toISOString()
              : undefined) ||
            new Date().toISOString();
          const eventEntityKey =
            payload?.eventHash ||
            payload?.event_hash ||
            payload?.batch_hash_name ||
            payload?.batchHash ||
            payload?.camera_id ||
            'unknown';

          const uniqueEventId =
            sseId && sseId !== 'event_unknown'
              ? `${sseId}_${eventEntityKey}_${eventTimestamp}`
              : `sse_${eventEntityKey}_${eventTimestamp}_${Math.random().toString(36).slice(2, 9)}`;

          const notification: Notification = {
            event_id: uniqueEventId,
            timestamp: eventTimestamp,
            alert,
            details: {
              video_id:
                notificationType === 'batch' && payload?.id != null
                  ? String(payload.id)
                  : undefined,
              batchHash:
                notificationType === 'batch' &&
                (payload?.batch_hash_name || payload?.batchHash)
                  ? String(payload?.batch_hash_name || payload?.batchHash)
                  : undefined,
              camera_id:
                notificationType === 'live'
                  ? String(
                      payload?.camera_id ??
                        payload?.camHash ??
                        payload?.cameraId ??
                        ''
                    )
                  : undefined,
              chunk_id: String(
                payload?.blob_source_file_uri ??
                  payload?.liveChunkHash ??
                  payload?.batchChunkHash ??
                  ''
              ),
              description: description,
              presigned_url: presignedUrl,
              timeline:
                payload?.chunk_start_datetime && payload?.chunk_end_datetime
                  ? {
                      start: payload.chunk_start_datetime,
                      end: payload.chunk_end_datetime,
                      duration: calculateDuration(
                        payload.chunk_start_datetime,
                        payload.chunk_end_datetime
                      ),
                    }
                  : { start: '', end: '', duration: '0s' },
            },
            initials: (
              payload?.event_name ||
              payload?.event_title ||
              payload?.eventTitle ||
              'RT'
            )
              .substring(0, 2)
              .toUpperCase(),
            type: notificationType,
            icon: notificationType === 'live' ? 'radio-tower' : 'file-video',
            source: 'sse',
          };

          console.log('🚀 SSE Notification Created:', {
            event_id: notification.event_id,
            type: notification.type,
            camera_id: notification.details.camera_id,
            camera_id_from_sse: payload?.camera_id,
            video_id: notification.details.video_id,
            alert: notification.alert,
            raw_sse_data: payload,
          });

          // For batch alerts, rely on separate processing_status SSE events
          // to update video completion/progress so we don't mark videos as
          // completed before backend reports 100% processing.

          console.log('✅ Dispatching Notification to Redux:', {
            event_id: notification.event_id,
            type: notification.type,
          });
          dispatch(addNotification(notification));
        } else if (msgType === MESSAGE_TYPES.INCIDENT) {
          // handler
        } else if (
          parsed.event_type === 'processing_status' &&
          (parsed.batch_hash || parsed.data?.batch_hash)
        ) {
          const status = (
            parsed.status ??
            parsed.data?.status ??
            ''
          ).toLowerCase();
          if (status && status !== 'processing') {
            dispatch(
              fetchBatchEventsNewThunk({
                itemsPerPage: 50,
                page: 1,
                sortBy: 'createdAt',
                sortOrder: 'desc',
                filters: {},
              })
            );
          }
        } else {
          void silentSyncLatestLiveEvents();
        }
      },
      [calculateDuration, dispatch, silentSyncLatestLiveEvents]
    );

    const fetchNotifications = useCallback(
      async (options: {
        itemsPerPage: number;
        page: number;
        type?: 'live' | 'batch';
        search?: string;
        videoId?: string | null;
      }) => {
        dispatch(setCurrentPage(options.page));
        dispatch(setCurrentFilter(options.type || null));
        if (options.page === 1) {
          dispatch(clearNewNotificationsFlagAction());
        }
        await dispatch(fetchNotificationsThunk(options));
      },
      [dispatch]
    );

    const clearNotificationsForVideo = useCallback(
      (videoId: string) => {
        dispatch(clearNotificationsForVideoAction(videoId));
      },
      [dispatch]
    );

    const loadMoreNotifications = useCallback(async () => {
      console.log(
        'loadMoreNotifications: Deprecated with server-side pagination'
      );
    }, []);

    const handleIncomingEventRef = useRef(handleIncomingEvent);

    useEffect(() => {
      handleIncomingEventRef.current = handleIncomingEvent;
    }, [handleIncomingEvent]);

    useEffect(() => {
      const session = getUserSession();
      if (!session.token || !session.cohortId) {
        dispatch(setIsInitialized(true));
        return;
      }

      sseManager.connect({
        token: session.token,
        cohortId: session.cohortId,
        userId: session.userId,
      });

      dispatch(setConnectionState(sseManager.getState()));
      dispatch(setConnectionId(sseManager.getConnectionId()));
      dispatch(setIsInitialized(true));

      const eventCallback = (event: SSEClientEvent) =>
        handleIncomingEventRef.current(event);
      const unsub = sseManager.subscribe(eventCallback);

      // Note: Notification data now loaded on-demand only

      return () => {
        unsub();
      };
    }, [dispatch, fetchNotificationCounts, fetchNotifications]);

    const connectSSE = useCallback(() => {
      const { token, cohortId, userId } = getUserSession();
      if (token && cohortId && !isNaN(cohortId)) {
        console.log('connectSSE: Initiating new SSE connection...');
        sseManager.connect({ token, cohortId: cohortId ?? 0, userId });
        dispatch(setConnectionState(sseManager.getState()));
        dispatch(setConnectionId(sseManager.getConnectionId()));
      }
    }, [dispatch]);

    const markAllAsRead = useCallback(() => {
      dispatch(markAllAsReadAction());
    }, [dispatch]);

    const handleSetViewedNotifications = useCallback(
      (value: React.SetStateAction<Set<string>>) => {
        const currentViewedSet = new Set(
          Array.isArray(viewedNotifications) ? viewedNotifications : []
        );
        const newViewedValue =
          typeof value === 'function' ? value(currentViewedSet) : value;

        dispatch(setViewedNotifications(Array.from(newViewedValue)));
      },
      [dispatch, viewedNotifications]
    );

    const clearNewNotificationsFlag = useCallback(() => {
      dispatch(clearNewNotificationsFlagAction());
    }, [dispatch]);

    return (
      <NotificationContext.Provider
        value={useMemo(
          () => ({
            unreadCameraIds: new Set(
              Array.isArray(unreadCameraIds) ? unreadCameraIds : []
            ),
            notifications,
            viewedNotifications: new Set(
              Array.isArray(viewedNotifications) ? viewedNotifications : []
            ),
            allLiveEventsMarkedAsRead,
            allBatchEventsMarkedAsRead,
            allLiveEventsMarkedAsReadAt,
            allBatchEventsMarkedAsReadAt,
            fetchNotifications,
            loadNotificationData,
            loadMoreNotifications,
            isLoading,
            error,
            connectionState,
            connectionId,
            connectSSE,
            hasMoreNotifications,
            totalBatchEvents,
            totalLiveEvents,
            setViewedNotifications: handleSetViewedNotifications,
            isInitialized,
            markAllAsRead,
            totalItems,
            fetchNotificationCounts,
            clearNotificationsForVideo,
            hasNewNotifications,
            clearNewNotificationsFlag,
          }),
          [
            unreadCameraIds,
            notifications,
            viewedNotifications,
            allLiveEventsMarkedAsRead,
            allBatchEventsMarkedAsRead,
            allLiveEventsMarkedAsReadAt,
            allBatchEventsMarkedAsReadAt,
            fetchNotifications,
            loadNotificationData,
            loadMoreNotifications,
            isLoading,
            error,
            connectionState,
            connectionId,
            connectSSE,
            hasMoreNotifications,
            totalBatchEvents,
            totalLiveEvents,
            handleSetViewedNotifications,
            isInitialized,
            markAllAsRead,
            totalItems,
            fetchNotificationCounts,
            clearNotificationsForVideo,
            hasNewNotifications,
            clearNewNotificationsFlag,
          ]
        )}
      >
        {children}
      </NotificationContext.Provider>
    );
  });

NotificationProvider.displayName = 'NotificationProvider';

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = (): NotificationContextType => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
