import React, { useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { PROCESS_BATCH } from '@/graphql/batch_mutations';
import {
  selectNotificationsForVideo,
  selectViewedNotifications,
  fetchBatchEventsNew,
  clearNotificationsForVideo,
} from '@/store/slices/notifications-slice';
import {
  selectVideosList,
  selectIsLoading,
  selectSelectedVideo,
  selectCurrentPage,
  selectHasMoreVideos,
  selectLoadingMore,
  fetchBatchVideos,
  fetchPresignedUrlForBatch,
  refreshBatchVideoFromServer,
  updateVideoStatus,
  updateVideoStatusByHash,
  setCurrentPage,
  setItemsPerPage,
  setSelectedVideo,
  clearSelectedVideo,
  removeVideo,
  clearPlaygroundVideos,
} from '@/store/slices/playground-slice';
import VideoGrid from './playground-video-grid';
import ModelParametersForm from './playground-params-form';
import type { BatchVideo, VideoGridRef } from './../types/batch-analysis';
import type { RootState, AppDispatch } from '@/store/index';
import {
  isSameDay,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { useFetchUsernames } from '@/hooks/use-fetch-usernames';
import {
  sseManager,
  getUserSession,
  type SSEClientEvent,
} from '@/lib/ssemanager';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { type DateRange } from 'react-day-picker';

// interface ProcessParams {
//   temperature: number;
//   topP: number;
//   repetitionPenalty: number;
//   maxTokens: number;
//   user_prompt: string;
//   stop_token_ids: number[];
//   system_prompt_blob_uri: string;
// }

interface BatchAnalysisProps {
  searchQuery: string;
  filter: string;
  viewMode: 'grid' | 'list';
  dateRange?: DateRange | undefined;
}

// First page size; load more via button or scroll to see older videos (e.g. previous days)
const ITEMS_PER_PAGE = 50;

const BatchAnalysis: React.FC<BatchAnalysisProps> = ({
  searchQuery,
  filter,
  viewMode,
  dateRange,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedSearch = searchQuery.trim();
  const normalizedSearchLower = normalizedSearch.toLowerCase();

  // Selectors
  const videoslist = useSelector(selectVideosList);
  const isLoading = useSelector(selectIsLoading);
  const loadingMore = useSelector(selectLoadingMore);
  const hasMoreVideos = useSelector(selectHasMoreVideos);
  const currentPage = useSelector(selectCurrentPage);
  const currentRoleCohortHash = useSelector(
    (state: RootState) => state.auth.currentRoleCohortHash
  );
  const usernames = useSelector(
    (state: RootState) => state.batchVideos.usernames
  );
  const viewedNotifications = useSelector(selectViewedNotifications);
  const selectedVideo = useSelector(selectSelectedVideo);
  const notificationsForModalVideo = useSelector((state: RootState) =>
    selectedVideo
      ? selectNotificationsForVideo(selectedVideo.batchHash)(state)
      : []
  );
  const [reanalyzeConfirmOpen, setReanalyzeConfirmOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<'view' | 'reanalyze'>(
    'view'
  );
  const skipNextFetchFromUploadRef = useRef(false);
  const prevFilterRef = useRef<string | null>(null);
  const prevSearchRef = useRef<string | null>(null);
  const [pendingReanalyzeVideo, setPendingReanalyzeVideo] =
    React.useState<BatchVideo | null>(null);
  const [reanalyzeOption, setReanalyzeOption] = React.useState<
    'previous' | 'change'
  >('previous');
  const videoslistRef = useRef<BatchVideo[]>([]);
  const completedNotifiedRef = useRef<Set<string>>(new Set());
  /** Batches we poll for status (targeted GraphQL) — not a full page or list refetch. */
  const pendingStatusPollRef = useRef<Set<string>>(new Set());
  const statusPollIntervalRef = useRef<number | null>(null);
  const statusPollAttemptsRef = useRef<Map<string, number>>(new Map());
  const STATUS_POLL_MS = 2500;
  const STATUS_POLL_MAX_ATTEMPTS = 300;

  // Fetch usernames for videos
  useFetchUsernames(videoslist, usernames, dispatch);

  // Handle role changes: clear cache and refetch data for new role
  useEffect(() => {
    dispatch(clearPlaygroundVideos());
    skipNextFetchFromUploadRef.current = false;
    prevFilterRef.current = null;
    prevSearchRef.current = null;
    completedNotifiedRef.current.clear();
    // Refetch will be triggered by the next useEffect when cache is cleared
  }, [currentRoleCohortHash, dispatch]);

  // 1. Manage SSE Connection (Run once on mount)
  useEffect(() => {
    const connectSSE = () => {
      const { token, cohortId, userId } = getUserSession();

      console.log('[BatchAnalysis] Attempting SSE connection', {
        hasToken: !!token,
        cohortId,
        userId,
      });

      if (token && cohortId != null) {
        sseManager.connect({ token, cohortId, userId });
      } else {
        console.warn(
          '[BatchAnalysis] Cannot connect to SSE: Missing token or cohortId'
        );
      }
    };

    connectSSE();

    // Retry once after a short delay in case localStorage was just populated
    const retryTimer = setTimeout(connectSSE, 1000);

    return () => {
      clearTimeout(retryTimer);
    };
  }, []);

  // Debug: Log usernames state
  useEffect(() => {
    console.log('[BatchAnalysis] usernames state:', {
      usernamesObject: usernames,
      keys: Object.keys(usernames),
      values: Object.values(usernames),
      entries: Object.entries(usernames),
    });
  }, [usernames]);

  const [processBatchMutation] = useMutation(PROCESS_BATCH);

  // Refs
  const sectionRefs = useRef<Map<string, React.RefObject<VideoGridRef>>>(
    new Map()
  );
  const singleDateRef = useRef<VideoGridRef>(null);

  // ✅ FIXED: Define visibleVideosPerView FIRST (before useMemos that depend on it)
  const visibleVideosPerView = viewMode === 'grid' ? 4 : 2;

  useEffect(() => {
    dispatch(setItemsPerPage(ITEMS_PER_PAGE));
    dispatch(setCurrentPage(1));
    // Batch events are loaded by NotificationModal (bell) on playground mount; no duplicate fetch here
  }, [dispatch]);

  // Keep a ref in sync with the latest videos list so effects can read from it
  // without needing videoslist as a dependency (avoids unnecessary refetch loops).
  useEffect(() => {
    videoslistRef.current = videoslist;
  }, [videoslist]);

  const clearStatusPollingIfIdle = useCallback(() => {
    if (
      pendingStatusPollRef.current.size === 0 &&
      statusPollIntervalRef.current != null
    ) {
      clearInterval(statusPollIntervalRef.current);
      statusPollIntervalRef.current = null;
    }
  }, []);

  const releaseStatusPoll = useCallback(
    (batchHash: string) => {
      pendingStatusPollRef.current.delete(batchHash);
      statusPollAttemptsRef.current.delete(batchHash.toLowerCase());
      clearStatusPollingIfIdle();
    },
    [clearStatusPollingIfIdle]
  );

  const ensureStatusPollingInterval = useCallback(() => {
    if (statusPollIntervalRef.current != null) return;
    statusPollIntervalRef.current = window.setInterval(() => {
      for (const h of [...pendingStatusPollRef.current]) {
        const key = h.toLowerCase();
        const next = (statusPollAttemptsRef.current.get(key) ?? 0) + 1;
        statusPollAttemptsRef.current.set(key, next);
        if (next > STATUS_POLL_MAX_ATTEMPTS) {
          releaseStatusPoll(h);
          continue;
        }
        void dispatch(refreshBatchVideoFromServer(h)).then((action) => {
          if (
            refreshBatchVideoFromServer.fulfilled.match(action) &&
            action.payload?.terminal
          ) {
            releaseStatusPoll(h);
          }
        });
      }
      clearStatusPollingIfIdle();
    }, STATUS_POLL_MS);
  }, [dispatch, releaseStatusPoll, clearStatusPollingIfIdle]);

  const enqueueStatusPoll = useCallback(
    (batchHash: string) => {
      pendingStatusPollRef.current.add(batchHash);
      statusPollAttemptsRef.current.set(batchHash.toLowerCase(), 0);
      void dispatch(refreshBatchVideoFromServer(batchHash)).then((action) => {
        if (
          refreshBatchVideoFromServer.fulfilled.match(action) &&
          action.payload?.terminal
        ) {
          releaseStatusPoll(batchHash);
        }
      });
      ensureStatusPollingInterval();
    },
    [dispatch, ensureStatusPollingInterval, releaseStatusPoll]
  );

  useEffect(() => {
    return () => {
      if (statusPollIntervalRef.current != null) {
        clearInterval(statusPollIntervalRef.current);
        statusPollIntervalRef.current = null;
      }
    };
  }, []);

  interface SSEPayload {
    event_type?: string;
    batch_hash?: string;
    batchHash?: string;
    status?: string;
    batch_status?: string;
    progress_percentage?: number | string;
    details?: {
      video_id?: string;
      batch_hash?: string;
      batchHash?: string;
    };
    data?: SSEPayload;
  }

  // Listen for SSE updates (after polling helpers so we can stop targeted polls when SSE delivers terminal state)
  useEffect(() => {
    const handleSSEMessage = (event: SSEClientEvent) => {
      console.log('[BatchAnalysis] Raw SSE event received:', event);
      if (event.type !== 'message' || !event.parsed) return;

      const raw = event.raw as MessageEvent;
      const top = event.parsed as SSEPayload;
      const nested =
        top.data && typeof top.data === 'object'
          ? (top.data as SSEPayload)
          : null;
      const data: SSEPayload = nested ? { ...top, ...nested } : top;

      const rawEventType = typeof raw?.type === 'string' ? raw.type : undefined;
      const effectiveEventType =
        data.event_type ||
        (rawEventType === 'processing_status'
          ? 'processing_status'
          : undefined);

      const batchHash =
        data.batch_hash ||
        data.batchHash ||
        data.details?.batch_hash ||
        data.details?.batchHash;

      if (!batchHash) {
        return;
      }

      const isTracked = [...pendingStatusPollRef.current].some(
        (h) => h.toLowerCase() === batchHash.toLowerCase()
      );

      const allowLoose =
        isTracked &&
        (data.status != null ||
          data.batch_status != null ||
          data.progress_percentage != null);

      const preStatus = (data.status || data.batch_status || '').toLowerCase();

      const looseTerminal =
        !!preStatus &&
        [
          'completed',
          'success',
          'done',
          'failed',
          'processed',
          'complete',
          'succeeded',
        ].includes(preStatus);

      if (
        effectiveEventType !== 'processing_status' &&
        !allowLoose &&
        !looseTerminal
      ) {
        return;
      }

      const status = preStatus;
      let progress = 0;

      if (
        data.progress_percentage !== undefined &&
        data.progress_percentage !== null
      ) {
        const parsed = parseFloat(String(data.progress_percentage));
        if (!isNaN(parsed)) {
          progress = Math.round(parsed);
        }
      }

      if (!status) {
        if (allowLoose && data.progress_percentage != null) {
          dispatch(
            updateVideoStatusByHash({
              batchHash,
              batchStatus: 'processing',
              local_status: 'processing',
              progress,
            })
          );
        }
        return;
      }

      const isCompletionStatus =
        status === 'completed' ||
        status === 'success' ||
        status === 'done' ||
        status === 'processed' ||
        status === 'complete' ||
        status === 'succeeded';

      if (isCompletionStatus) {
        releaseStatusPoll(batchHash);

        dispatch(
          updateVideoStatusByHash({
            batchHash,
            batchStatus: 'processing',
            local_status: 'processing',
            progress: 100,
          })
        );

        setTimeout(() => {
          const uiStatus =
            status === 'success' ||
            status === 'done' ||
            status === 'processed' ||
            status === 'complete' ||
            status === 'succeeded'
              ? 'completed'
              : status;

          dispatch(
            updateVideoStatusByHash({
              batchHash,
              batchStatus: uiStatus,
              local_status: undefined,
              progress: 100,
            })
          );

          void dispatch(refreshBatchVideoFromServer(batchHash));

          if (!completedNotifiedRef.current.has(batchHash)) {
            completedNotifiedRef.current.add(batchHash);

            const video = videoslistRef.current.find(
              (v) => v.batchHash === batchHash
            );

            toast.success(
              video?.batchName
                ? `“${video.batchName}” processed successfully.`
                : 'Video processed successfully.',
              {
                position: 'bottom-center',
                className: 'bg-emerald-600 text-white',
                duration: 3500,
              }
            );
          }

          dispatch(
            fetchBatchEventsNew({
              itemsPerPage: 50,
              page: 1,
              sortBy: 'createdAt',
              sortOrder: 'desc',
              filters: {},
            })
          );
        }, 800);

        return;
      }

      if (status === 'failed') {
        releaseStatusPoll(batchHash);
      }

      console.log(
        `[BatchAnalysis] 🔄 Dispatching update for: ${batchHash} - ${status} (${progress}%)`
      );

      dispatch(
        updateVideoStatusByHash({
          batchHash,
          batchStatus: status,
          local_status: status === 'processing' ? 'processing' : undefined,
          progress: progress,
        })
      );

      if (status === 'processing') return;
    };

    const unsubscribe = sseManager.subscribe(handleSSEMessage);
    return () => unsubscribe();
  }, [dispatch, releaseStatusPoll]);

  // Fetch only when the list can change: after upload, initial load (no cache), filter/search change, delete, or config save.
  // Do NOT fetch when just navigating back (e.g. from chat to playground) so we use cached list.
  const doFetchBatchVideos = useCallback(() => {
    dispatch(
      fetchBatchVideos({
        page: 1,
        itemsPerPage: ITEMS_PER_PAGE,
        batch_status: filter !== 'all' ? filter : undefined,
        searchTerm: undefined,
      })
    );
  }, [dispatch, filter]);

  useEffect(() => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('selection_token') ||
      localStorage.getItem('token');

    if (!token) {
      //null
      return;
    }

    const fromUpload = (location.state as { fromUpload?: boolean } | null)
      ?.fromUpload;
    const fromChatReprocess = (
      location.state as {
        fromChatReprocess?: boolean;
        reprocessBatchHash?: string;
      } | null
    )?.fromChatReprocess;
    const reprocessBatchHash = (
      location.state as {
        fromChatReprocess?: boolean;
        reprocessBatchHash?: string;
      } | null
    )?.reprocessBatchHash;

    if (fromChatReprocess) {
      if (reprocessBatchHash) {
        dispatch(
          updateVideoStatusByHash({
            batchHash: reprocessBatchHash,
            batchStatus: 'queued',
            local_status: 'processing',
            progress: 0,
          })
        );
        enqueueStatusPoll(reprocessBatchHash);
      }
      navigate(location.pathname, { replace: true, state: {} });
      doFetchBatchVideos();
      return;
    }

    if (fromUpload) {
      // When coming from upload, clean up the state marker but DON'T skip video fetch
      // We need to fetch to ensure loading state is properly set and cleared
      const newBatchHash = videoslistRef.current[0]?.batchHash;
      if (newBatchHash) {
        dispatch(fetchPresignedUrlForBatch(newBatchHash));
      }
      navigate(location.pathname, { replace: true, state: {} });
      // Fetch videos to ensure loading state is managed properly
      doFetchBatchVideos();
      return;
    }
    if (skipNextFetchFromUploadRef.current) {
      skipNextFetchFromUploadRef.current = false;
      return;
    }

    const hasVideos = videoslist.length > 0;
    const filterChanged =
      prevFilterRef.current !== null && prevFilterRef.current !== filter;

    prevFilterRef.current = filter;
    prevSearchRef.current = normalizedSearch;

    if (!hasVideos) {
      doFetchBatchVideos();
      return;
    }
    if (filterChanged) {
      doFetchBatchVideos();
    }
    // Don't refetch on search changes - search is handled client-side by filtering
  }, [
    dispatch,
    filter,
    normalizedSearch,
    location.state,
    location.pathname,
    navigate,
    doFetchBatchVideos,
    videoslist.length,
    enqueueStatusPoll,
  ]);

  const triggerProcess = useCallback(
    async (video: BatchVideo) => {
      // Clear notifications for this video when processing/reprocessing starts so only new ones show
      dispatch(
        clearNotificationsForVideo({
          videoId: String(video.id),
          batchHash: video.batchHash ?? undefined,
        })
      );

      // Immediately show processing state in UI
      dispatch(
        updateVideoStatus({
          id: video.id,
          batchStatus: 'processing',
          local_status: 'processing',
          progress: 0,
        })
      );

      toast.info('Batch processing started!', {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
        duration: 3000,
      });

      try {
        // Step 1: Make the initial process call
        const { data, errors } = await processBatchMutation({
          variables: {
            batchHash: video.batchHash,
          },
        });

        if (errors) {
          throw new Error(errors[0].message);
        }

        if (data.processBatch.status === 'Failed') {
          throw new Error(data.processBatch.message || 'Processing failed');
        }

        if (data?.processBatch?.status === 'Success') {
          console.log(
            `[PROCESS] ✅ Processing initiated for video ${video.id}`
          );
          // Keep local "processing" so the card shows the progress UI; backend is often "queued" first.
          // Targeted polling + SSE update batchStatus/thumbnails/video URL without refreshing the page.
          dispatch(
            updateVideoStatus({
              id: video.id,
              batchStatus: 'queued',
              local_status: 'processing',
              progress: 0,
            })
          );
          enqueueStatusPoll(video.batchHash);
        }
      } catch (err: unknown) {
        console.error('Error processing batch:', err);
        releaseStatusPoll(video.batchHash);
        dispatch(
          updateVideoStatus({
            id: video.id,
            batchStatus: 'failed',
            local_status: undefined,
            progress: null,
          })
        );
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Error processing batch: ${errorMessage}`, {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 3000,
        });
      }
    },
    [dispatch, processBatchMutation, enqueueStatusPoll, releaseStatusPoll]
  );

  const handleProcessBatch = useCallback(
    async (video: BatchVideo) => {
      triggerProcess(video);
    },
    [triggerProcess]
  );

  const openDrawer = useCallback(
    (video: BatchVideo, mode: 'view' | 'reanalyze' = 'view') => {
      if (mode === 'reanalyze') {
        setPendingReanalyzeVideo(video);
        setReanalyzeOption('previous'); // Default to previous
        setReanalyzeConfirmOpen(true);
      } else {
        setModalMode(mode);
        dispatch(setSelectedVideo(video));
      }
    },
    [dispatch]
  );

  const closeDrawer = useCallback(() => {
    dispatch(clearSelectedVideo());
  }, [dispatch]);

  const handleDeleteSuccess = useCallback(
    (videoId: number) => {
      dispatch(removeVideo({ id: videoId }));
      closeDrawer();
      // Keep UI stable: optimistic remove is enough.
      // Only refetch if that deletion empties the list (fresh load scenario).
      const remaining = Math.max(0, (videoslistRef.current?.length ?? 0) - 1);
      if (remaining === 0) {
        doFetchBatchVideos();
      }
    },
    [dispatch, closeDrawer, doFetchBatchVideos]
  );

  const handleLoadMore = useCallback(() => {
    if (isLoading || loadingMore || !hasMoreVideos) return;
    dispatch(
      fetchBatchVideos({
        page: currentPage + 1,
        itemsPerPage: ITEMS_PER_PAGE,
        batch_status: filter !== 'all' ? filter : undefined,
        searchTerm: undefined,
      })
    );
  }, [dispatch, isLoading, loadingMore, hasMoreVideos, currentPage, filter]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
        if (!dateRange && !normalizedSearch) {
          handleLoadMore();
        }
      }
    },
    [dateRange, normalizedSearch, handleLoadMore]
  );

  // Memoized filtered videos
  const validVideos = useMemo(
    () => videoslist.filter((v): v is BatchVideo => v != null),
    [videoslist]
  );

  const dateFilteredVideos = useMemo(() => {
    if (!dateRange?.from) return validVideos;

    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to
      ? endOfDay(dateRange.to)
      : endOfDay(dateRange.from);

    return validVideos.filter((video) => {
      const createdAt = video.created_at || new Date().toISOString();
      const videoDate = new Date(createdAt.replace(' ', 'T'));
      return isWithinInterval(videoDate, { start: fromDate, end: toDate });
    });
  }, [validVideos, dateRange]);

  const sortBySearchRelevance = useCallback(
    (list: BatchVideo[], query: string) => {
      if (!query) return list;

      const escapeRegExp = (value: string) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      return [...list].sort((a, b) => {
        const aName = (a.batchName || '').toLowerCase();
        const bName = (b.batchName || '').toLowerCase();

        const aExact = aName === query;
        const bExact = bName === query;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStartsWith = aName.startsWith(query);
        const bStartsWith = bName.startsWith(query);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;

        const wordRegex = new RegExp(`\\b${escapeRegExp(query)}\\b`);
        const aWordMatch = wordRegex.test(aName);
        const bWordMatch = wordRegex.test(bName);
        if (aWordMatch && !bWordMatch) return -1;
        if (!aWordMatch && bWordMatch) return 1;

        const aIndex = aName.indexOf(query);
        const bIndex = bName.indexOf(query);
        if (aIndex !== bIndex) return aIndex - bIndex;

        if (aName.length !== bName.length) return aName.length - bName.length;

        return 0;
      });
    },
    []
  );

  const searchedDateVideos = useMemo(() => {
    if (!normalizedSearchLower) return dateFilteredVideos;

    const filtered = dateFilteredVideos.filter((video) =>
      video.batchName?.toLowerCase().includes(normalizedSearchLower)
    );

    return sortBySearchRelevance(filtered, normalizedSearchLower);
  }, [dateFilteredVideos, normalizedSearchLower, sortBySearchRelevance]);

  const searchResults = useMemo(() => {
    if (!normalizedSearchLower) return validVideos;

    const filtered = validVideos.filter((video) =>
      video.batchName?.toLowerCase().includes(normalizedSearchLower)
    );

    return sortBySearchRelevance(filtered, normalizedSearchLower);
  }, [validVideos, normalizedSearchLower, sortBySearchRelevance]);

  const groupedVideos = useMemo(() => {
    if (dateRange?.from || !validVideos.length) return [];

    // Apply search filter FIRST
    const searchedVideos = validVideos.filter((video) =>
      video.batchName?.toLowerCase().includes(normalizedSearchLower)
    );

    if (!searchedVideos.length) return [];

    const sortedVideos = [...searchedVideos].sort((a, b) => {
      const dateA = a.created_at || new Date().toISOString();
      const dateB = b.created_at || new Date().toISOString();
      return (
        new Date(dateB.replace(' ', 'T')).getTime() -
        new Date(dateA.replace(' ', 'T')).getTime()
      );
    });

    const groups: { date: string; videos: BatchVideo[] }[] = [];
    let currentGroup: BatchVideo[] = [];
    let currentDate: Date | null = null;

    sortedVideos.forEach((video) => {
      const videoDate = new Date(
        (video.created_at || new Date().toISOString()).replace(' ', 'T')
      );

      if (!currentDate || !isSameDay(videoDate, currentDate)) {
        if (currentGroup.length > 0) {
          groups.push({
            date: format(currentDate!, 'MMMM d, yyyy'),
            videos: currentGroup,
          });
        }
        currentGroup = [video];
        currentDate = videoDate;
      } else {
        currentGroup.push(video);
      }
    });

    // Add the last group
    if (currentGroup.length > 0 && currentDate) {
      groups.push({
        date: format(currentDate, 'MMMM d, yyyy'),
        videos: currentGroup,
      });
    }

    console.log('🔍 GroupedVideos recalculated:', {
      totalGroups: groups.length,
      visibleVideosPerView,
      groups: groups.map((g) => ({
        date: g.date,
        count: g.videos.length,
        shouldShowArrows: g.videos.length > visibleVideosPerView,
      })),
    });

    return groups;
  }, [validVideos, dateRange, normalizedSearchLower, visibleVideosPerView]);

  // Create grouped videos for date range selection
  const dateRangeGroupedVideos = useMemo(() => {
    if (!dateRange?.from) return [];

    // Apply search filter FIRST
    const searchedVideos = dateRange?.to
      ? searchedDateVideos
      : dateFilteredVideos;

    if (!searchedVideos.length) return [];

    const sortedVideos = [...searchedVideos].sort((a, b) => {
      const dateA = a.created_at || new Date().toISOString();
      const dateB = b.created_at || new Date().toISOString();
      return (
        new Date(dateB.replace(' ', 'T')).getTime() -
        new Date(dateA.replace(' ', 'T')).getTime()
      );
    });

    const groups: { date: string; videos: BatchVideo[] }[] = [];
    let currentGroup: BatchVideo[] = [];
    let currentDate: Date | null = null;

    sortedVideos.forEach((video) => {
      const videoDate = new Date(
        (video.created_at || new Date().toISOString()).replace(' ', 'T')
      );

      if (!currentDate || !isSameDay(videoDate, currentDate)) {
        if (currentGroup.length > 0) {
          groups.push({
            date: format(currentDate!, 'EEEE, MMMM d, yyyy'),
            videos: currentGroup,
          });
        }
        currentGroup = [video];
        currentDate = videoDate;
      } else {
        currentGroup.push(video);
      }
    });

    // Add the last group
    if (currentGroup.length > 0 && currentDate) {
      groups.push({
        date: format(currentDate, 'EEEE, MMMM d, yyyy'),
        videos: currentGroup,
      });
    }

    return groups;
  }, [dateRange, searchedDateVideos, dateFilteredVideos]);

  const getOrCreateRef = useCallback((date: string) => {
    if (!sectionRefs.current.has(date)) {
      const newRef =
        React.createRef<VideoGridRef>() as React.RefObject<VideoGridRef>;
      sectionRefs.current.set(date, newRef);
      console.log('Created new ref for:', date);
    }
    return sectionRefs.current.get(date)!;
  }, []);

  useEffect(() => {
    const currentDates = new Set(groupedVideos.map((g) => g.date));
    Array.from(sectionRefs.current.keys()).forEach((date) => {
      if (!currentDates.has(date)) {
        sectionRefs.current.delete(date);
        console.log(' Removed ref for:', date);
      }
    });
  }, [groupedVideos]);

  const viewedNotificationsArray = useMemo(
    () => Array.from(viewedNotifications),
    [viewedNotifications]
  );

  const renderContent = () => {
    if (dateRange?.from) {
      return (
        <div className="space-y-6">
          {dateRangeGroupedVideos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <p>No videos found for the selected date range</p>
            </div>
          ) : (
            dateRangeGroupedVideos.map((group) => {
              const showArrows = group.videos.length > visibleVideosPerView;
              const ref = getOrCreateRef(group.date);

              return (
                <div key={group.date} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-medium text-foreground">
                      {group.date}
                      <span className="ml-3 text-sm text-muted-foreground font-normal">
                        ({group.videos.length}{' '}
                        {group.videos.length === 1 ? 'video' : 'videos'})
                      </span>
                    </h4>
                    {showArrows && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => ref?.current?.prev()}
                          className="bg-background hover:bg-muted text-foreground p-1.5 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          aria-label="Previous"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => ref?.current?.next()}
                          className="bg-background hover:bg-muted text-foreground p-1.5 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                          aria-label="Next"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border w-full" />
                  <VideoGrid
                    ref={ref}
                    videos={group.videos}
                    searchQuery={normalizedSearch}
                    viewMode={viewMode}
                    usernames={usernames}
                    onProcessBatch={handleProcessBatch}
                    onOpenDrawer={openDrawer}
                    onDeleteSuccess={handleDeleteSuccess}
                    isLoading={false}
                    totalItems={group.videos.length}
                    itemsPerPage={group.videos.length}
                    showDates={false}
                    externalArrows={true}
                  />
                </div>
              );
            })
          )}
        </div>
      );
    }

    if (normalizedSearch) {
      const showSearchArrows = searchResults.length > visibleVideosPerView;
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              Search results
              <span className="ml-3 text-sm text-muted-foreground font-normal">
                ({searchResults.length}{' '}
                {searchResults.length === 1 ? 'video' : 'videos'})
              </span>
            </h3>
            {showSearchArrows && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => singleDateRef.current?.prev()}
                  className="bg-background hover:bg-muted text-foreground p-1.5 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Previous"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => singleDateRef.current?.next()}
                  className="bg-background hover:bg-muted text-foreground p-1.5 rounded-md border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  aria-label="Next"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <div className="border-t border-border w-full" />
          <VideoGrid
            key={`search-${normalizedSearch}`}
            ref={singleDateRef}
            videos={searchResults}
            searchQuery=""
            viewMode={viewMode}
            usernames={usernames}
            onProcessBatch={handleProcessBatch}
            onOpenDrawer={openDrawer}
            onDeleteSuccess={handleDeleteSuccess}
            isLoading={isLoading && searchResults.length === 0}
            totalItems={searchResults.length}
            itemsPerPage={searchResults.length}
            showDates={false}
            externalArrows={true}
          />
        </div>
      );
    }

    // Only show loading/empty state when we truly have no videos AND we're loading.
    // If we have videos in Redux, keep showing them even while isLoading is true (background refetch).
    if (groupedVideos.length === 0) {
      // If we have videos but groupedVideos is empty (e.g., date filter), show empty message
      if (validVideos.length > 0) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            No videos found for the selected filters.
          </div>
        );
      }
      // Only show loading when we truly have no videos
      if (validVideos.length === 0) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            {isLoading ? 'Loading Videos...' : 'No videos found.'}
          </div>
        );
      }
    }

    return (
      <div className="space-y-8">
        {groupedVideos.map(({ date, videos }) => {
          const gridRef = getOrCreateRef(date);
          const shouldShowArrows = videos.length > visibleVideosPerView;

          // console.log(` Rendering section "${date}":`, {
          //   index,
          //   videosCount: videos.length,
          //   visibleVideosPerView,
          //   shouldShowArrows,
          //   hasGridRef: !!gridRef,
          //   refCurrent: gridRef?.current,
          //   refCurrentHasPrev: typeof gridRef?.current?.prev === 'function',
          //   refCurrentHasNext: typeof gridRef?.current?.next === 'function',
          // });

          return (
            <section key={date} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">
                  {date}
                  <span className="ml-3 text-sm text-muted-foreground font-normal">
                    ({videos.length} {videos.length === 1 ? 'video' : 'videos'})
                  </span>
                </h3>

                {shouldShowArrows && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        console.log('Previous clicked for:', date);
                        console.log('   gridRef:', gridRef);
                        console.log('   gridRef.current:', gridRef?.current);
                        console.log(
                          '   has prev function:',
                          typeof gridRef?.current?.prev
                        );
                        if (gridRef?.current?.prev) {
                          console.log('    Calling prev()');
                          gridRef.current.prev();
                        } else {
                          console.error('No ref or prev function available!');
                        }
                      }}
                      className="
                        flex items-center justify-center w-10 h-10
                        bg-background/80 hover:bg-background/95 
                        text-foreground border border-border/50
                        rounded-lg shadow-sm hover:shadow-md
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        disabled:hover:bg-background/80
                      "
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        console.log(' Next clicked for:', date);
                        console.log('   gridRef:', gridRef);
                        console.log('   gridRef.current:', gridRef?.current);
                        console.log(
                          '   has next function:',
                          typeof gridRef?.current?.next
                        );
                        if (gridRef?.current?.next) {
                          console.log(' Calling next()');
                          gridRef.current.next();
                        } else {
                          console.error(' No ref or next function available!');
                        }
                      }}
                      className="
                        flex items-center justify-center w-10 h-10
                        bg-background/80 hover:bg-background/95 
                        text-foreground border border-border/50
                        rounded-lg shadow-sm hover:shadow-md
                        transition-all duration-200
                        disabled:opacity-50 disabled:cursor-not-allowed
                        disabled:hover:bg-background/80
                      "
                      aria-label="Next"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="border-t border-border w-full" />
              <VideoGrid
                ref={gridRef}
                videos={videos}
                searchQuery=""
                viewMode={viewMode}
                usernames={usernames}
                onProcessBatch={handleProcessBatch}
                onOpenDrawer={openDrawer}
                onDeleteSuccess={handleDeleteSuccess}
                isLoading={false}
                totalItems={videos.length}
                itemsPerPage={videos.length}
                showDates={false}
                externalArrows={true}
              />
            </section>
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={scrollContainerRef}
      data-playground-scroll
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto scrollbar-hidden p-4 pl-0 pr-0"
      style={{ height: 'calc(100vh - 14rem)', paddingBottom: '1rem' }}
    >
      <Dialog
        open={reanalyzeConfirmOpen}
        onOpenChange={setReanalyzeConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Re-analyze Video</DialogTitle>
            <DialogDescription>
              Re-analyzing this video will replace the existing transcript,
              events, and chat history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={reanalyzeOption}
              onValueChange={(v) =>
                setReanalyzeOption(v as 'previous' | 'change')
              }
            >
              <div
                className="flex items-start space-x-3 mb-3 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setReanalyzeOption('previous')}
              >
                <RadioGroupItem value="previous" id="r1" className="mt-1" />
                <div className="flex flex-col cursor-pointer">
                  <Label htmlFor="r1" className="font-medium cursor-pointer">
                    Use previous settings
                  </Label>
                  <span className="text-xs text-muted-foreground mt-1">
                    Fast overwrite using existing configuration
                  </span>
                </div>
              </div>
              <div
                className="flex items-start space-x-3 border p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setReanalyzeOption('change')}
              >
                <RadioGroupItem value="change" id="r2" className="mt-1" />
                <div className="flex flex-col cursor-pointer">
                  <Label htmlFor="r2" className="font-medium cursor-pointer">
                    Change analysis settings
                  </Label>
                  <span className="text-xs text-muted-foreground mt-1">
                    Configure pipelines and parameters
                  </span>
                </div>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setReanalyzeConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (reanalyzeOption === 'previous') {
                  if (pendingReanalyzeVideo) {
                    triggerProcess(pendingReanalyzeVideo);
                    setReanalyzeConfirmOpen(false);
                    setPendingReanalyzeVideo(null);
                  }
                } else {
                  if (pendingReanalyzeVideo) {
                    setModalMode('reanalyze');
                    dispatch(setSelectedVideo(pendingReanalyzeVideo));
                    setReanalyzeConfirmOpen(false);
                    setPendingReanalyzeVideo(null);
                  }
                }
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {renderContent()}
      {!dateRange?.from &&
        !normalizedSearch &&
        hasMoreVideos &&
        !loadingMore && (
          <div className="py-6 flex items-center justify-center">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={isLoading || loadingMore}
              className="gap-2"
            >
              Load more videos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      {!dateRange?.from &&
        !normalizedSearch &&
        hasMoreVideos &&
        loadingMore && (
          <div className="py-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more...
          </div>
        )}
      {selectedVideo && (
        <ModelParametersForm
          isOpen={!!selectedVideo}
          video={selectedVideo}
          processBatch={handleProcessBatch}
          onClose={closeDrawer}
          onConfigSaved={doFetchBatchVideos}
          notifications={(() => {
            const videoStatus =
              selectedVideo.local_status ||
              selectedVideo.batchStatus ||
              'pending';
            return videoStatus === 'processing'
              ? []
              : notificationsForModalVideo;
          })()}
          viewedNotifications={new Set(viewedNotificationsArray)}
          onDeleteSuccess={handleDeleteSuccess}
          username={
            (selectedVideo.user_id && usernames[selectedVideo.user_id]) ||
            'Unknown'
          }
          mode={modalMode}
        />
      )}
    </div>
  );
};

export default BatchAnalysis;
