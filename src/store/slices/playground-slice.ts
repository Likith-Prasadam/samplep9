/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { BatchVideo } from '@/features/playground/types/batch-analysis';
import { GET_BATCHES_VIDEOS } from '@/graphql/batch_mutations';
import { getUserSession } from '@/lib/ssemanager';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

const PROGRESS_CACHE_KEY = 'hls_video_progress_cache';

/** Align backend status strings with UI expectations (badges, completion checks). */
function normalizeListBatchStatus(raw: string): string {
  const s = (raw || '').toLowerCase().trim();
  if (
    s === 'success' ||
    s === 'done' ||
    s === 'complete' ||
    s === 'succeeded' ||
    s === 'processed'
  ) {
    return 'completed';
  }
  return s;
}

function isInFlightStatus(status: string): boolean {
  return ['pending', 'queued', 'processing'].includes(
    (status || '').toLowerCase()
  );
}

const getProgressCache = (): Record<string, number> => {
  try {
    const item = localStorage.getItem(PROGRESS_CACHE_KEY);
    return item ? JSON.parse(item) : {};
  } catch {
    return {};
  }
};

const setProgressCache = (cache: Record<string, number>) => {
  try {
    localStorage.setItem(PROGRESS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore localStorage errors
  }
};

interface FetchVideosParams {
  page: number;
  itemsPerPage: number;
  batch_status?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Helper to generate a stable numeric ID from batchHash (exported for upload page to build new video)
export function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

interface RootState {
  batchVideos: BatchVideosState;
}

export interface BatchVideosState {
  searchQuery: string;
  videoslist: BatchVideo[];
  totalItems: number;
  uploadSuccess: boolean;
  isLoading: boolean;
  loadingMore: boolean;
  currentPage: number;
  itemsPerPage: number;
  hasMoreVideos: boolean;
  usernames: Record<string, string>;
  selectedVideo: BatchVideo | null;
}

const initialState: BatchVideosState = {
  searchQuery: '',
  videoslist: [],
  totalItems: 0,
  uploadSuccess: false,
  isLoading: true,
  loadingMore: false,
  currentPage: 1,
  itemsPerPage: 8,
  hasMoreVideos: false,
  usernames: {},
  selectedVideo: null,
};

// Corrected createAsyncThunk - removed generic type parameters
export const fetchBatchVideos = createAsyncThunk(
  'batchVideos/fetchBatchVideos',
  async (
    {
      page,
      itemsPerPage,
      batch_status,
      searchTerm,
      sortBy = 'created_at',
      sortOrder = 'desc',
    }: FetchVideosParams,
    { extra, rejectWithValue, getState }: any
  ) => {
    const apolloClient = (
      extra as { apolloClient: ApolloClient<NormalizedCacheObject> }
    ).apolloClient;
    const { token, userId, cohortId } = getUserSession();

    if (!token) {
      console.error(
        '[fetchBatchVideos] ❌ No token found in session. Checked:',
        {
          access_token: !!localStorage.getItem('access_token'),
          selection_token: !!localStorage.getItem('selection_token'),
          token: !!localStorage.getItem('token'),
          user: !!localStorage.getItem('user'),
        }
      );
      return rejectWithValue('Invalid session: No authentication token found');
    }

    console.log('[fetchBatchVideos] ✅ Token found, proceeding with query');

    try {
      // Build filters object - DO NOT filter by status on backend, we'll do it client-side
      const filters: any = {};
      // Status filtering removed - will be done client-side
      if (searchTerm) {
        filters.searchTerm = searchTerm;
      }

      const queryVariables = {
        page: page || 1,
        itemsPerPage: itemsPerPage || 10,
        sortBy: sortBy || 'created_at',
        sortOrder: sortOrder || 'desc',
        ...(Object.keys(filters).length > 0 ? { filters } : {}),
      };

      console.log(
        '[fetchBatchVideos] Requesting page',
        queryVariables.page,
        'itemsPerPage',
        queryVariables.itemsPerPage,
        'batch_status filter (client-side):',
        batch_status,
        'filters being sent to backend:',
        filters,
        'queryVariables:',
        queryVariables
      );

      const { data, errors } = await apolloClient.query({
        query: GET_BATCHES_VIDEOS,
        variables: queryVariables,
        context: { headers: { Authorization: `Bearer ${token}` } },
        fetchPolicy: 'network-only',
      });

      if (errors) {
        console.error('GraphQL errors:', errors);
        return rejectWithValue(
          `GraphQL error: ${errors[0]?.message || 'Unknown error'}`
        );
      }

      const fetchResult = data?.getBatchVideos;
      const requestedSize = Math.max(1, itemsPerPage || 10);
      const rawBatchesAll = fetchResult?.batches || [];

      console.log(
        '[fetchBatchVideos] Response received:',
        'totalCount:',
        fetchResult?.totalCount,
        'batches returned:',
        rawBatchesAll.length,
        'raw status values from API:',
        rawBatchesAll.map((b: any) => ({
          batchHash: b.batchHash,
          rawStatus: b.batchStatus,
          batchName: b.batchName,
        }))
      );

      // Enforce page size on frontend: only use the first page of results so we never load all videos at once
      const rawBatches =
        rawBatchesAll.length <= requestedSize
          ? rawBatchesAll
          : rawBatchesAll.slice(0, requestedSize);
      const totalItems = fetchResult?.totalCount ?? rawBatchesAll.length;
      const hasNext =
        Boolean(fetchResult?.hasNext) || rawBatchesAll.length > requestedSize;
      const responsePage = fetchResult?.page ?? page;

      // Get current state to preserve local_status and progress
      const currentState = getState() as { batchVideos: BatchVideosState };
      const currentVideos = currentState?.batchVideos?.videoslist || [];

      const progressCache = getProgressCache();

      const videos: BatchVideo[] = rawBatches.map((b: any) => {
        // Generate stable numeric ID from batchHash
        const numericId = hashStringToNumber(b.batchHash);

        // Find existing video in state to preserve local_status and progress
        // Match by batchHash since that's the stable identifier
        const existingVideo = currentVideos.find(
          (v: BatchVideo) =>
            v.batchHash.toLowerCase() === b.batchHash.toLowerCase()
        );

        // Normalize batchStatus to lowercase for consistency
        const normalizedStatus = normalizeListBatchStatus(b.batchStatus || '');

        let progressFromCache: number | null = null;
        if (!existingVideo && normalizedStatus === 'processing') {
          if (progressCache[b.batchHash] != null) {
            progressFromCache = progressCache[b.batchHash];
          }
        }

        const terminal = ['completed', 'failed'].includes(normalizedStatus);
        const inFlightRemote = ['queued', 'processing', 'pending'].includes(
          normalizedStatus
        );
        const keepLocalProcessing =
          existingVideo?.local_status === 'processing' &&
          !terminal &&
          inFlightRemote;

        const stableVideoPresignedUrl =
          isInFlightStatus(normalizedStatus) && existingVideo?.videoPresignedUrl
            ? existingVideo.videoPresignedUrl
            : (b.videoPresignedUrl ?? existingVideo?.videoPresignedUrl);
        const stableVideoPresignedUrlExpiry =
          isInFlightStatus(normalizedStatus) &&
          existingVideo?.videoPresignedUrlExpiry
            ? existingVideo.videoPresignedUrlExpiry
            : (b.videoPresignedUrlExpiry ??
              existingVideo?.videoPresignedUrlExpiry);

        return {
          id: numericId,
          batchHash: b.batchHash,
          batchName: b.batchName || '',
          batchStatus: normalizedStatus,
          batchCloudStreamPath:
            b.batchCloudStreamPath || existingVideo?.batchCloudStreamPath || '',
          thumbnailPresignedUrl:
            b.thumbnailPresignedUrl ||
            existingVideo?.thumbnailPresignedUrl ||
            '',
          duration: b.duration || 0,
          batchType: b.batchType,
          batchPlacementZone: b.batchPlacementZone,
          batchTags: b.batchTags ?? null,
          createdAt: b.createdAt,
          userRoleCohortHash: b.userRoleCohortHash,
          videoPresignedUrl: stableVideoPresignedUrl,
          videoPresignedUrlExpiry: stableVideoPresignedUrlExpiry,
          user_id: userId ? String(userId) : undefined,
          cohort_id: cohortId ? String(cohortId) : undefined,

          // Preserve local state
          created_at: b.createdAt || existingVideo?.created_at,
          // Keep optimistic "processing" while backend still shows an in-flight state (queued/processing).
          local_status: keepLocalProcessing ? 'processing' : undefined,
          progress:
            terminal && normalizedStatus === 'failed'
              ? null
              : terminal && normalizedStatus === 'completed'
                ? 100
                : keepLocalProcessing
                  ? existingVideo?.progress
                  : progressFromCache,
        };
      });

      // Apply client-side filtering by batch_status
      let filteredVideos = videos;
      if (batch_status && batch_status !== 'all') {
        const filterLower = batch_status.toLowerCase();
        filteredVideos = videos.filter(
          (video) => video.batchStatus.toLowerCase() === filterLower
        );
        console.log(
          '[fetchBatchVideos] Client-side status filter applied:',
          'filter:',
          batch_status,
          'before filtering:',
          videos.length,
          'after filtering:',
          filteredVideos.length,
          'videos included:',
          filteredVideos.map((v) => ({
            batchHash: v.batchHash,
            status: v.batchStatus,
          }))
        );
      }

      return {
        videos: filteredVideos,
        totalItems,
        page: responsePage,
        hasNext,
      };
    } catch (error: any) {
      console.error('Thunk error:', error);
      return rejectWithValue(`Fetch error: ${error.message || 'Unknown'}`);
    }
  }
);

/** Fetches presigned video URL for a single batch (e.g. after prepend from upload) without replacing the list. */
export const fetchPresignedUrlForBatch = createAsyncThunk(
  'batchVideos/fetchPresignedUrlForBatch',
  async (
    batchHash: string,
    { extra, rejectWithValue }: any
  ): Promise<{
    batchHash: string;
    videoPresignedUrl: string | null;
    videoPresignedUrlExpiry: string | null;
  } | null> => {
    const apolloClient = (
      extra as { apolloClient: ApolloClient<NormalizedCacheObject> }
    ).apolloClient;
    const { token } = getUserSession();
    if (!token) return rejectWithValue('No auth token');
    try {
      const { data, errors } = await apolloClient.query({
        query: GET_BATCHES_VIDEOS,
        variables: {
          page: 1,
          itemsPerPage: 48,
          sortBy: 'created_at',
          sortOrder: 'desc',
        },
        context: { headers: { Authorization: `Bearer ${token}` } },
        fetchPolicy: 'network-only',
      });
      if (errors) return rejectWithValue(errors[0]?.message ?? 'GraphQL error');
      const batches = data?.getBatchVideos?.batches ?? [];
      const match = batches.find(
        (b: any) =>
          (b.batchHash ?? '').toLowerCase() === batchHash.toLowerCase()
      );
      if (!match) return null;
      return {
        batchHash: match.batchHash,
        videoPresignedUrl: match.videoPresignedUrl ?? null,
        videoPresignedUrlExpiry: match.videoPresignedUrlExpiry ?? null,
      };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Fetch failed');
    }
  }
);

const batchVideosSlice = createSlice({
  name: 'batchVideos',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setVideosList: (state, action: PayloadAction<BatchVideo[]>) => {
      state.videoslist = action.payload;
    },
    updateVideoStatus: (
      state,
      action: PayloadAction<{ id: number } & Partial<BatchVideo>>
    ) => {
      const index = state.videoslist.findIndex(
        (v: BatchVideo) => v.id === action.payload.id
      );
      if (index !== -1) {
        state.videoslist[index] = {
          ...state.videoslist[index],
          ...action.payload,
        };
      }
      if (state.selectedVideo && state.selectedVideo.id === action.payload.id) {
        state.selectedVideo = {
          ...state.selectedVideo,
          ...action.payload,
        };
      }
    },
    updateVideoStatusByHash: (
      state,
      action: PayloadAction<{ batchHash: string } & Partial<BatchVideo>>
    ) => {
      console.log(
        '[PlaygroundSlice] Updating status for hash:',
        action.payload.batchHash
      );
      const index = state.videoslist.findIndex(
        (v: BatchVideo) =>
          v.batchHash.toLowerCase() === action.payload.batchHash.toLowerCase()
      );
      if (index !== -1) {
        console.log('[PlaygroundSlice] Found video at index:', index);
        state.videoslist[index] = {
          ...state.videoslist[index],
          ...action.payload,
        };
        console.log(
          '[PlaygroundSlice] Updated video state:',
          state.videoslist[index]
        );

        // Update localStorage cache
        const progress = action.payload.progress;
        const status = action.payload.batchStatus;
        const cache = getProgressCache();
        if (progress != null && status === 'processing') {
          cache[action.payload.batchHash] = progress;
          setProgressCache(cache);
        } else if (status === 'completed' || status === 'failed') {
          // Clean up completed/failed videos from cache
          if (cache[action.payload.batchHash]) {
            delete cache[action.payload.batchHash];
            setProgressCache(cache);
          }
        }
      } else {
        console.warn(
          '[PlaygroundSlice] Video not found for status update:',
          action.payload.batchHash
        );
      }
      if (
        state.selectedVideo &&
        state.selectedVideo.batchHash?.toLowerCase() ===
          action.payload.batchHash.toLowerCase()
      ) {
        state.selectedVideo = {
          ...state.selectedVideo,
          ...action.payload,
        };
      }
    },
    setUploadSuccess: (state, action: PayloadAction<boolean>) => {
      state.uploadSuccess = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTotalItems: (state, action: PayloadAction<number>) => {
      state.totalItems = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
    },
    setUsernames: (state, action: PayloadAction<Record<string, string>>) => {
      state.usernames = { ...state.usernames, ...action.payload };
    },
    setSelectedVideo: (state, action: PayloadAction<BatchVideo>) => {
      state.selectedVideo = action.payload;
    },
    clearSelectedVideo: (state) => {
      state.selectedVideo = null;
    },
    removeVideo: (
      state,
      action: PayloadAction<{ id?: number; batchHash?: string }>
    ) => {
      const { id, batchHash } = action.payload;
      const prevLen = state.videoslist.length;
      state.videoslist = state.videoslist.filter((v) => {
        if (id != null && v.id === id) return false;
        if (batchHash && v.batchHash?.toLowerCase() === batchHash.toLowerCase())
          return false;
        return true;
      });
      if (state.videoslist.length < prevLen) {
        state.totalItems = Math.max(0, state.totalItems - 1);
        if (
          state.selectedVideo &&
          (state.selectedVideo.id === id ||
            state.selectedVideo.batchHash?.toLowerCase() ===
              batchHash?.toLowerCase())
        ) {
          state.selectedVideo = null;
        }
      }
    },
    prependVideo: (state, action: PayloadAction<BatchVideo>) => {
      const existing = state.videoslist.some(
        (v) =>
          v.batchHash?.toLowerCase() === action.payload.batchHash?.toLowerCase()
      );
      if (!existing) {
        state.videoslist.unshift(action.payload);
        state.totalItems = Math.max(
          state.videoslist.length,
          (state.totalItems ?? 0) + 1
        );
      }
    },
    clearPlaygroundVideos: (state) => {
      // Reset all cached data when role changes
      state.searchQuery = '';
      state.videoslist = [];
      state.totalItems = 0;
      state.uploadSuccess = false;
      state.isLoading = true;
      state.loadingMore = false;
      state.currentPage = 1;
      state.itemsPerPage = 8;
      state.hasMoreVideos = false;
      state.usernames = {};
      state.selectedVideo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(
        fetchBatchVideos.fulfilled,
        (
          state,
          action: PayloadAction<{
            videos: BatchVideo[];
            totalItems: number;
            page: number;
            hasNext: boolean;
          }>
        ) => {
          const {
            videos,
            totalItems,
            page: responsePage,
            hasNext,
          } = action.payload;
          if (responsePage === 1) {
            state.videoslist = videos;
          } else {
            const existingHashes = new Set(
              state.videoslist.map((v) => v.batchHash.toLowerCase())
            );
            const toAppend = videos.filter(
              (v) => !existingHashes.has(v.batchHash.toLowerCase())
            );
            state.videoslist = [...state.videoslist, ...toAppend];
          }
          state.totalItems = totalItems;
          state.currentPage = responsePage;
          state.hasMoreVideos = hasNext;
          state.isLoading = false;
          state.loadingMore = false;
          console.log('Reducer: Videos set to', state.videoslist.length);
        }
      )
      .addCase(fetchBatchVideos.pending, (state, action) => {
        const page = action.meta.arg?.page ?? 1;
        if (page === 1) {
          state.isLoading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchBatchVideos.rejected, (state, action) => {
        state.isLoading = false;
        state.loadingMore = false;
        if (action.meta.arg?.page === 1) {
          state.videoslist = [];
        }
        console.error('Fetch rejected:', action.payload);
      })
      .addCase(
        fetchPresignedUrlForBatch.fulfilled,
        (
          state,
          action: PayloadAction<{
            batchHash: string;
            videoPresignedUrl: string | null;
            videoPresignedUrlExpiry: string | null;
          } | null>
        ) => {
          if (!action.payload) return;
          const { batchHash, videoPresignedUrl, videoPresignedUrlExpiry } =
            action.payload;
          const index = state.videoslist.findIndex(
            (v) => v.batchHash?.toLowerCase() === batchHash.toLowerCase()
          );
          if (index !== -1) {
            state.videoslist[index] = {
              ...state.videoslist[index],
              ...(videoPresignedUrl != null && { videoPresignedUrl }),
              ...(videoPresignedUrlExpiry != null && {
                videoPresignedUrlExpiry,
              }),
            };
          }
        }
      );
  },
});

export const {
  setSearchQuery,
  setVideosList,
  updateVideoStatus,
  updateVideoStatusByHash,
  setUploadSuccess,
  setIsLoading,
  setTotalItems,
  setCurrentPage,
  setItemsPerPage,
  setUsernames,
  setSelectedVideo,
  clearSelectedVideo,
  removeVideo,
  prependVideo,
  clearPlaygroundVideos,
} = batchVideosSlice.actions;

/** Row shape from `getBatchVideos.batches` (GraphQL). */
interface GqlBatchVideoRow {
  batchHash: string;
  batchName?: string;
  batchStatus?: string;
  batchCloudStreamPath?: string;
  thumbnailPresignedUrl?: string;
  duration?: number;
  batchType?: string;
  batchPlacementZone?: string;
  createdAt?: string;
  videoPresignedUrl?: string;
  videoPresignedUrlExpiry?: string;
  userRoleCohortHash?: string;
}

/**
 * Lightweight status sync for one batch (no full list refetch / page reload).
 * Used while processing so UI updates when SSE is unavailable or another tab owns the connection.
 */
export const refreshBatchVideoFromServer = createAsyncThunk<
  { batchHash: string; terminal: boolean } | null,
  string,
  { state: RootState; rejectValue: string }
>(
  'batchVideos/refreshBatchVideoFromServer',
  async (batchHash, { extra, rejectWithValue, dispatch, getState }) => {
    const apolloClient = (
      extra as { apolloClient: ApolloClient<NormalizedCacheObject> }
    ).apolloClient;
    const { token, userId, cohortId } = getUserSession();
    if (!token) {
      return rejectWithValue('No auth token');
    }

    const pickMatch = (
      batches: GqlBatchVideoRow[]
    ): GqlBatchVideoRow | undefined =>
      batches.find(
        (b) => (b.batchHash ?? '').toLowerCase() === batchHash.toLowerCase()
      );

    const queryBatches = async (variables: {
      page: number;
      itemsPerPage: number;
      filters?: Record<string, unknown>;
    }) => {
      try {
        const { data, errors } = await apolloClient.query({
          query: GET_BATCHES_VIDEOS,
          variables: {
            sortBy: 'created_at',
            sortOrder: 'desc',
            ...variables,
          },
          context: { headers: { Authorization: `Bearer ${token}` } },
          fetchPolicy: 'network-only',
        });
        if (errors?.length) {
          return { batches: [] as GqlBatchVideoRow[], hasNext: false };
        }
        const fetchResult = data?.getBatchVideos;
        const raw = (fetchResult?.batches ?? []) as GqlBatchVideoRow[];
        return {
          batches: raw,
          hasNext: Boolean(fetchResult?.hasNext),
        };
      } catch (e) {
        console.warn('[refreshBatchVideoFromServer] query failed', e);
        return { batches: [] as GqlBatchVideoRow[], hasNext: false };
      }
    };

    try {
      // Same filter as playground-chat: exact batch lookup (reliable; search/page slice often misses).
      let { batches, hasNext } = await queryBatches({
        page: 1,
        itemsPerPage: 5,
        filters: { batchHashes: [batchHash] },
      });
      let match = pickMatch(batches);

      if (!match) {
        ({ batches, hasNext } = await queryBatches({
          page: 1,
          itemsPerPage: 80,
          filters: { searchTerm: batchHash },
        }));
        match = pickMatch(batches);
      }

      if (!match) {
        ({ batches, hasNext } = await queryBatches({
          page: 1,
          itemsPerPage: 80,
        }));
        match = pickMatch(batches);
      }

      if (!match) {
        let page = 2;
        const maxPages = 30;
        while (!match && hasNext && page <= maxPages) {
          const next = await queryBatches({
            page,
            itemsPerPage: 100,
          });
          match = pickMatch(next.batches);
          hasNext = next.hasNext;
          page += 1;
        }
      }

      if (!match) {
        return null;
      }

      const currentState = getState() as RootState;
      const existing = currentState.batchVideos.videoslist.find(
        (v: BatchVideo) => v.batchHash.toLowerCase() === batchHash.toLowerCase()
      );

      const normalizedStatus = normalizeListBatchStatus(
        match.batchStatus || ''
      );
      const terminal = ['completed', 'failed'].includes(normalizedStatus);
      const inFlightRemote = ['queued', 'processing', 'pending'].includes(
        normalizedStatus
      );
      const keepLocalProcessing =
        existing?.local_status === 'processing' && !terminal && inFlightRemote;

      const numericId = existing?.id ?? hashStringToNumber(match.batchHash);

      const stableVideoPresignedUrl =
        isInFlightStatus(normalizedStatus) && existing?.videoPresignedUrl
          ? existing.videoPresignedUrl
          : (match.videoPresignedUrl ?? existing?.videoPresignedUrl);
      const stableVideoPresignedUrlExpiry =
        isInFlightStatus(normalizedStatus) && existing?.videoPresignedUrlExpiry
          ? existing.videoPresignedUrlExpiry
          : (match.videoPresignedUrlExpiry ??
            existing?.videoPresignedUrlExpiry);

      const payload: { batchHash: string } & Partial<BatchVideo> = {
        batchHash: match.batchHash,
        batchName: match.batchName || '',
        batchStatus: normalizedStatus,
        batchCloudStreamPath:
          match.batchCloudStreamPath || existing?.batchCloudStreamPath || '',
        thumbnailPresignedUrl:
          match.thumbnailPresignedUrl || existing?.thumbnailPresignedUrl || '',
        duration: match.duration || 0,
        batchType: match.batchType,
        batchPlacementZone: match.batchPlacementZone,
        createdAt: match.createdAt,
        videoPresignedUrl: stableVideoPresignedUrl,
        videoPresignedUrlExpiry: stableVideoPresignedUrlExpiry,
        userRoleCohortHash: match.userRoleCohortHash,
        created_at: match.createdAt || existing?.created_at,
        user_id: userId ? String(userId) : existing?.user_id,
        cohort_id: cohortId ? String(cohortId) : existing?.cohort_id,
        id: numericId,
        local_status: keepLocalProcessing ? 'processing' : undefined,
      };

      if (terminal && normalizedStatus === 'failed') {
        payload.progress = null;
      } else if (terminal && normalizedStatus === 'completed') {
        payload.progress = 100;
      } else if (keepLocalProcessing) {
        payload.progress = existing?.progress ?? 0;
      }

      dispatch(updateVideoStatusByHash(payload));

      return { batchHash: match.batchHash, terminal };
    } catch (error: any) {
      console.error('[refreshBatchVideoFromServer]', error);
      return rejectWithValue(error?.message ?? 'Fetch failed');
    }
  }
);

// Selectors
export const selectSearchQuery = (state: RootState) =>
  state.batchVideos.searchQuery;
export const selectVideosList = (state: RootState) =>
  state.batchVideos.videoslist;
export const selectTotalItems = (state: RootState) =>
  state.batchVideos.totalItems;
export const selectIsLoading = (state: RootState) =>
  state.batchVideos.isLoading;
export const selectUploadSuccess = (state: RootState) =>
  state.batchVideos.uploadSuccess;
export const selectCurrentPage = (state: RootState) =>
  state.batchVideos.currentPage;
export const selectItemsPerPage = (state: RootState) =>
  state.batchVideos.itemsPerPage;
export const selectHasMoreVideos = (state: RootState) =>
  state.batchVideos.hasMoreVideos;
export const selectLoadingMore = (state: RootState) =>
  state.batchVideos.loadingMore;
export const selectUsernames = (state: RootState) =>
  state.batchVideos.usernames;
export const selectSelectedVideo = (state: RootState) =>
  state.batchVideos.selectedVideo;

export default batchVideosSlice.reducer;
