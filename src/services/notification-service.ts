import { store } from '@/store/index';
import {
  addNotification,
  setConnectionState,
  setConnectionId,
  setError,
  setIsInitialized,
} from '@/store/slices/notifications-slice';
import { updateVideoStatus } from '@/store/slices/playground-slice';
import type { Notification } from '@/features/notifications/types/notifications';
import {
  sseManager,
  MESSAGE_TYPES,
  CONNECTION_STATES,
  getUserSession,
  safeJSON,
  type SSEClientEvent,
} from '@/lib/ssemanager';

const calculateDuration = (start: string, end: string): string => {
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(durationMs / 1000);
  return seconds >= 0 ? `${seconds}s` : '0s';
};

let isInitialized = false;

export const initializeNotificationsSSE = () => {
  if (isInitialized) return;

  const session = getUserSession();
  if (session.token && session.cohortId) {
    sseManager.connect({
      token: session.token,
      cohortId: session.cohortId,
      userId: session.userId,
    });
    store.dispatch(setIsInitialized(true));
  } else {
    store.dispatch(setError('Cannot initialize SSE: Not authenticated'));
  }

  const handleIncomingEvent = (event: SSEClientEvent) => {
    console.log('SSE Service: Handling event:', event);
    if (event.type === 'open') {
      store.dispatch(setConnectionState(CONNECTION_STATES.CONNECTED));
      store.dispatch(setError(null));
      store.dispatch(setConnectionId(sseManager.getConnectionId() || null));
      return;
    }
    if (event.type === 'error') {
      store.dispatch(setConnectionState(CONNECTION_STATES.ERROR));
      return;
    }
    if (event.type !== 'message') return;

    const parsed = event.parsed ?? safeJSON(String(event.raw.data));
    if (!parsed) {
      console.warn('SSE Service: Failed to parse message');
      return;
    }

    // Fixed type for msgType: Compare directly to the values of MESSAGE_TYPES
    const msgType = parsed.type;

    if (msgType === MESSAGE_TYPES.CONNECTION) {
      store.dispatch(setConnectionId(parsed?.data?.connection_id ?? null));
      store.dispatch(setConnectionState(CONNECTION_STATES.CONNECTED));
      store.dispatch(setError(null));
      return;
    }

    if (msgType === MESSAGE_TYPES.HEARTBEAT) return;

    if (msgType === MESSAGE_TYPES.SYSTEM_ALERT) {
      store.dispatch(setError(parsed?.data?.message || 'System alert'));
      return;
    }

    if (msgType === MESSAGE_TYPES.EVENT_DETECTION) {
      const data = parsed;
      const presignedUrl =
        data.data?.blob_subsampled_video_uris?.[0]?.path ||
        data.data?.blob_source_file_uri;
      const alert =
        data.data?.event_title || data.data?.event_name || 'Real-time Event';
      let description = data.data?.event_description || 'No description.';
      if (
        typeof description === 'string' &&
        description.includes('Description:')
      ) {
        const descMatch = description.match(/Description:\s?(.*)/s);
        description = descMatch ? descMatch[1].trim() : description;
      }

      let notificationType: 'live' | 'batch' =
        data.data?.inference_modality === 'live' ? 'live' : 'batch';
      if (!data.data?.inference_modality) {
        notificationType = data.data?.batch_hash_name ? 'batch' : 'live';
      }

      const sseId =
        (event.raw.lastEventId && String(event.raw.lastEventId)) ||
        (parsed?.id != null ? String(parsed.id) : null);
      const uniqueEventId =
        sseId && sseId !== 'event_unknown'
          ? sseId
          : `sse_${data.data?.batch_hash_name ?? data.data?.camera_id ?? 'unknown'}_${data.event_received_utc}_${Math.random().toString(36).slice(2, 9)}`;

      const notification: Notification = {
        event_id: uniqueEventId,
        timestamp:
          data.event_received_utc ||
          new Date(data.timestamp * 1000).toISOString(),
        alert,
        details: {
          video_id:
            notificationType === 'batch' && data.data?.id != null
              ? String(data.data.id)
              : undefined,
          camera_id:
            notificationType === 'live'
              ? String(data.data?.camera_id)
              : undefined,
          chunk_id: data.data?.blob_source_file_uri,
          description,
          presigned_url: presignedUrl,
          timeline:
            data.data?.chunk_start_datetime && data.data?.chunk_end_datetime
              ? {
                  start: data.data.chunk_start_datetime,
                  end: data.data.chunk_end_datetime,
                  duration: calculateDuration(
                    data.data.chunk_start_datetime,
                    data.data.chunk_end_datetime
                  ),
                }
              : { start: '', end: '', duration: '0s' },
        },
        initials: data.data?.event_name?.substring(0, 2).toUpperCase() || 'RT',
        type: notificationType,
        icon: notificationType === 'live' ? 'radio-tower' : 'file-video',
        source: 'sse',
      };

      // Only add notification if the video is not currently processing
      // Check video status before adding notification
      if (notificationType === 'batch' && notification.details.video_id) {
        const state = store.getState() as {
          batchVideos?: {
            videoslist?: Array<{
              id: number;
              local_status?: string;
              batch_status?: string;
              progress?: number;
            }>;
          };
        };
        const videosList = state.batchVideos?.videoslist || [];
        const video = videosList.find(
          (v) => String(v.id) === notification.details.video_id
        );

        if (video) {
          const videoStatus =
            video.local_status || video.batch_status || 'pending';
          const isProcessing = videoStatus === 'processing';
          const progress = video.progress || 0;

          // If we receive a notification for a processing video, it likely means processing completed
          // Allow progress >= 95% to receive notifications (processing is essentially done)
          // This handles the case where backend completes but frontend progress is stuck
          if (isProcessing && progress < 95) {
            console.log(
              `[NOTIFICATION SERVICE] Skipping notification for video ${notification.details.video_id} - still processing (${progress}%)`
            );
            return;
          } else if (isProcessing && progress >= 95) {
            // If we're receiving notifications and progress is high, mark as completed
            // This ensures alerts can appear even if progress polling didn't catch completion
            console.log(
              `[NOTIFICATION SERVICE] Received notification for video ${notification.details.video_id} with high progress (${progress}%) - processing likely completed, marking as completed`
            );
            // Mark video as completed when we receive notifications with high progress
            store.dispatch(
              updateVideoStatus({
                id: Number(notification.details.video_id),
                batchStatus: 'completed',
                local_status: undefined,
                progress: 100,
              })
            );
          }
        }
      }

      store.dispatch(addNotification(notification));
    } else if (msgType === MESSAGE_TYPES.INCIDENT) {
      console.log('SSE Service: Processing incident:', parsed);
    } else {
      console.warn('SSE Service: Unhandled type:', msgType);
    }
  };

  const unsub = sseManager.subscribe(handleIncomingEvent);

  // Cleanup on unmount (call in app cleanup if needed)
  const cleanup = () => {
    unsub();
    sseManager.close('Service cleanup');
  };

  isInitialized = true;
  return cleanup;
};

export const connectSSE = () => {
  const session = getUserSession();
  if (session.token && session.cohortId && !sseManager.isConnected()) {
    sseManager.connect({
      token: session.token,
      cohortId: session.cohortId ?? 0,
      userId: session.userId,
    });
    store.dispatch(setConnectionState(sseManager.getState()));
    store.dispatch(setConnectionId(sseManager.getConnectionId()));
  }
};

export const disconnectSSE = () => {
  sseManager.close('Manual disconnect');
  store.dispatch(setConnectionState(CONNECTION_STATES.DISCONNECTED));
  store.dispatch(setConnectionId(null));
};
