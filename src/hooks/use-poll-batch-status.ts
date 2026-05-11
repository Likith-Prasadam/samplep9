import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { BatchVideo } from '@/features/playground/types/batch-analysis';
import type { AppDispatch } from '@/store/index';
import type { LazyQueryExecFunction } from '@apollo/client';

type GetVideosFn = LazyQueryExecFunction<
  { getBatchVideos: { batches: BatchVideo[] } },
  { input_json: { id: number } }
>;

export const usePollBatchStatus = (
  video: BatchVideo | null,
  getVideos: GetVideosFn,
  dispatch: AppDispatch,
  clearNotificationsForVideo?: (id: string) => void
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pollStatus = useCallback(async () => {
    if (!video) return;

    const { data } = await getVideos({
      variables: { input_json: { id: video.id } },
      fetchPolicy: 'network-only',
    });

    const updatedVideo = data?.getBatchVideos?.batches?.[0];
    if (!updatedVideo) return;

    const status = updatedVideo.batchStatus;
    const progress = updatedVideo.progress || 0; // Use actual progress from server if available

    // Always update status and progress to keep UI in sync
    dispatch({
      type: 'batchVideos/updateVideoStatus',
      payload: {
        id: video.id,
        batchStatus: status,
        local_status: status === 'processing' ? 'processing' : undefined,
        progress,
      },
    });

    // Handle completion/failure: stop polling
    if (status === 'completed') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    } else if (status === 'failed') {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [video, dispatch, getVideos]);

  useEffect(() => {
    if (!video || video.batchStatus !== 'processing') {
      return;
    }

    if (clearNotificationsForVideo)
      clearNotificationsForVideo(String(video.id));

    intervalRef.current = setInterval(pollStatus, 2000);

    timeoutRef.current = setTimeout(
      () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        dispatch({
          type: 'batchVideos/updateVideoStatus',
          payload: {
            id: video.id,
            batchStatus: 'failed',
            local_status: undefined,
            progress: null,
          },
        });
        toast.error('Batch processing timed out', {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 3000,
        });
      },
      30 * 60 * 1000
    );

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [clearNotificationsForVideo, video, dispatch, pollStatus]);
};
