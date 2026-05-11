import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { DemoVideo, Event } from '@/features/demo-videos/types';
import client from '@/lib/apollo-client';
import {
  GET_DEMO_VIDEOS,
  FETCH_DEMO_EVENTS,
  PROCESS_DEMO_VIDEO,
  GET_DEMO_TRANSCRIPT,
} from '@/graphql/demo_queries_mutations';

export interface DemoVideosState {
  videos: DemoVideo[];
  events: Event[];
  loading: boolean;
  eventsLoading: boolean;
  error: string | null;
  eventsError: string | null;
  readNotifications: number[];
  currentVideoType: string;
  processingVideoId: number | null;
  transcript: string | null;
  transcriptLoading: boolean;
  videoCache: Record<string, { data: DemoVideo[]; timestamp: number }>;
  lastFetchTimestamp: number | null;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const loadReadNotifications = (): number[] => {
  try {
    const saved = localStorage.getItem('read_notifications');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const initialState: DemoVideosState = {
  videos: [],
  events: [],
  loading: false,
  eventsLoading: false,
  error: null,
  eventsError: null,
  readNotifications: loadReadNotifications(),
  currentVideoType: 'smart_cities',
  processingVideoId: null,
  transcript: null,
  transcriptLoading: false,
  videoCache: {},
  lastFetchTimestamp: null,
};

export const fetchDemoVideos = createAsyncThunk(
  'demoVideos/fetchVideos',
  async (videoType: string, { getState }) => {
    const state = getState() as { demoVideos: DemoVideosState };
    const cached = state.demoVideos.videoCache[videoType];
    const now = Date.now();

    // Return cached data if valid
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      return { videos: cached.data, fromCache: true };
    }

    const { data } = await client.query({
      query: GET_DEMO_VIDEOS,
      variables: { type: videoType },
      fetchPolicy: 'network-only',
    });

    const rawVideos = (data?.demo?.demoVideos || []) as unknown[];
    const mappedVideos: DemoVideo[] = rawVideos
      .filter((video): video is Record<string, unknown> => !!video)
      .map((v): DemoVideo => {
        const vid = v as {
          duration: string;
          id: number;
          presignedUrl: string;
          thumbnail: string | null;
          transcriptPath: string;
          videoDescription: string;
          videoName: string;
          process?: string;
          createdAt?: string;
          eventEndTime?: string | number | null;
          eventStartTime?: string | number | null;
          eventDescription?: string;
        };
        return {
          duration: vid.duration,
          id: vid.id,
          presigned_url: vid.presignedUrl,
          thumbnail: vid.thumbnail,
          transcript_path: vid.transcriptPath,
          video_description: vid.videoDescription,
          video_name: vid.videoName,
          process: vid.process,
          created_at: vid.createdAt,
          event_end_time: vid.eventEndTime ?? null,
          event_start_time: vid.eventStartTime ?? null,
          event_description: vid.eventDescription,
        };
      });

    return { videos: mappedVideos, fromCache: false };
  }
);

export const fetchDemoEvents = createAsyncThunk(
  'demoVideos/fetchEvents',
  async () => {
    const { data } = await client.query({
      query: FETCH_DEMO_EVENTS,
      variables: {
        itemsPerPage: 10,
        pageNumber: 1,
      },
      fetchPolicy: 'network-only',
    });

    const rawEvents = (data?.demo?.fetchDemoEvents?.events || []) as unknown[];
    return rawEvents.map((e): Event => {
      const ev = e as {
        id: number;
        demoId: number;
        eventDescription: string;
        eventEndTime: string;
        eventName: string;
        eventStartTime: string;
        createdAt: string;
        isDeleted: boolean;
      };
      return {
        id: ev.id,
        demo_id: ev.demoId,
        event_description: ev.eventDescription,
        event_end_time: ev.eventEndTime,
        event_name: ev.eventName,
        event_start_time: ev.eventStartTime,
        created_at: ev.createdAt,
        is_deleted: ev.isDeleted,
      };
    });
  }
);

export const processDemoVideo = createAsyncThunk(
  'demoVideos/processVideo',
  async (demoId: number) => {
    const { data } = await client.mutate({
      mutation: PROCESS_DEMO_VIDEO,
      variables: { demoId },
    });

    return {
      id: data?.demo?.process_demo_video?.id,
      transcript: data?.demo?.process_demo_video?.transcript,
    };
  }
);

export const fetchDemoTranscript = createAsyncThunk(
  'demoVideos/fetchTranscript',
  async (videoId: number) => {
    const { data } = await client.query({
      query: GET_DEMO_TRANSCRIPT,
      variables: { videoId },
    });

    return {
      transcript:
        data?.demo?.demoTranscript?.transcript || 'No transcript available',
      presigned_url: data?.demo?.demoTranscript?.presignedUrl || '',
    };
  }
);

const demoVideosSlice = createSlice({
  name: 'demoVideos',
  initialState,
  reducers: {
    setCurrentVideoType: (state, action: PayloadAction<string>) => {
      // Clear videos immediately when video type changes to prevent showing old videos
      if (state.currentVideoType !== action.payload) {
        state.videos = [];
      }
      state.currentVideoType = action.payload;
    },
    setReadNotifications: (state, action: PayloadAction<number[]>) => {
      state.readNotifications = action.payload;
      localStorage.setItem(
        'read_notifications',
        JSON.stringify(action.payload)
      );
    },
    addReadNotification: (state, action: PayloadAction<number>) => {
      if (!state.readNotifications.includes(action.payload)) {
        state.readNotifications.push(action.payload);
        localStorage.setItem(
          'read_notifications',
          JSON.stringify(state.readNotifications)
        );
      }
    },
    markAllAsRead: (state) => {
      state.readNotifications = state.events.map((event: Event) => event.id);
      localStorage.setItem(
        'read_notifications',
        JSON.stringify(state.readNotifications)
      );
    },
    setProcessingVideoId: (state, action: PayloadAction<number | null>) => {
      state.processingVideoId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
      state.eventsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Videos
      .addCase(fetchDemoVideos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDemoVideos.fulfilled, (state, action) => {
        state.loading = false;
        state.videos = action.payload.videos;
        state.lastFetchTimestamp = Date.now();

        // Update cache
        if (!action.payload.fromCache) {
          state.videoCache[state.currentVideoType] = {
            data: action.payload.videos,
            timestamp: Date.now(),
          };
        }
      })
      .addCase(fetchDemoVideos.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch videos';
      })
      // Fetch Events
      .addCase(fetchDemoEvents.pending, (state) => {
        state.eventsLoading = true;
        state.eventsError = null;
      })
      .addCase(fetchDemoEvents.fulfilled, (state, action) => {
        state.eventsLoading = false;
        state.events = action.payload;
      })
      .addCase(fetchDemoEvents.rejected, (state, action) => {
        state.eventsLoading = false;
        state.eventsError = action.error.message || 'Failed to fetch events';
      })
      // Process Video
      .addCase(processDemoVideo.pending, (state, action) => {
        state.processingVideoId = action.meta.arg;
      })
      .addCase(processDemoVideo.fulfilled, (state) => {
        state.processingVideoId = null;
      })
      .addCase(processDemoVideo.rejected, (state) => {
        state.processingVideoId = null;
      })
      // Fetch Transcript
      .addCase(fetchDemoTranscript.pending, (state) => {
        state.transcriptLoading = true;
      })
      .addCase(fetchDemoTranscript.fulfilled, (state, action) => {
        state.transcriptLoading = false;
        state.transcript = action.payload.transcript;
      })
      .addCase(fetchDemoTranscript.rejected, (state) => {
        state.transcriptLoading = false;
        state.transcript = null;
      });
  },
});

export const {
  setCurrentVideoType,
  setReadNotifications,
  addReadNotification,
  markAllAsRead,
  setProcessingVideoId,
  clearError,
} = demoVideosSlice.actions;

export default demoVideosSlice.reducer;
