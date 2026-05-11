import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Camera } from '@/features/live-stream/types/types';

interface LiveStreamState {
  activeCamera: Camera | null;
  activeTab: 'notifications' | 'chat' | 'clips';
  streamStatus: 'idle' | 'loading' | 'playing' | 'error';
  hlsUrl: string | null;
  streamError: string | null;
  selectedTime: number | null;
}

const initialState: LiveStreamState = {
  activeCamera: null,
  activeTab: 'chat',
  streamStatus: 'idle',
  hlsUrl: null,
  streamError: null,
  selectedTime: null,
};

const liveStreamSlice = createSlice({
  name: 'liveStream',
  initialState,
  reducers: {
    setActiveCamera: (state, action: PayloadAction<Camera | null>) => {
      const previousCameraId = state.activeCamera?.id;
      const newCameraId = action.payload?.id;

      // Reset stream state when camera changes
      if (previousCameraId !== newCameraId) {
        state.streamStatus = 'idle';
        state.hlsUrl = null;
        state.streamError = null;
        state.selectedTime = null;
      }

      state.activeCamera = action.payload;
    },
    setActiveTab: (
      state,
      action: PayloadAction<'notifications' | 'chat' | 'clips'>
    ) => {
      state.activeTab = action.payload;
    },
    setStreamStatus: (
      state,
      action: PayloadAction<'idle' | 'loading' | 'playing' | 'error'>
    ) => {
      state.streamStatus = action.payload;
      if (action.payload !== 'error') {
        state.streamError = null;
      }
    },
    setHlsUrl: (state, action: PayloadAction<string | null>) => {
      state.hlsUrl = action.payload;
    },
    setStreamError: (state, action: PayloadAction<string | null>) => {
      state.streamError = action.payload;
      if (action.payload) {
        state.streamStatus = 'error';
      }
    },
    setSelectedTime: (state, action: PayloadAction<number | null>) => {
      state.selectedTime = action.payload;
    },
    resetLiveStream: () => initialState,
  },
});

export const {
  setActiveCamera,
  setActiveTab,
  setStreamStatus,
  setHlsUrl,
  setStreamError,
  setSelectedTime,
  resetLiveStream,
} = liveStreamSlice.actions;

export default liveStreamSlice.reducer;

// Selectors
export const selectActiveCamera = (state: { liveStream: LiveStreamState }) =>
  state.liveStream.activeCamera;
export const selectActiveTab = (state: { liveStream: LiveStreamState }) =>
  state.liveStream.activeTab;
export const selectStreamStatus = (state: { liveStream: LiveStreamState }) =>
  state.liveStream.streamStatus;
export const selectHlsUrl = (state: { liveStream: LiveStreamState }) =>
  state.liveStream.hlsUrl;
export const selectStreamError = (state: { liveStream: LiveStreamState }) =>
  state.liveStream.streamError;
export const selectSelectedTime = (state: { liveStream: LiveStreamState }) =>
  state.liveStream.selectedTime;
