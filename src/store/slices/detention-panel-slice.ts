import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import client from '@/lib/apollo-client';
import { GET_DETENTION_PANEL_DASHBOARD } from '@/graphql/detention_queries';

export interface Zone {
  actual: number;
  expected: number;
  status: string;
  timestamp: string;
  variance: number;
  variance_percent: number;
  zone_name: string;
}

export interface DetentionDashboardData {
  count_accuracy: number;
  variance_alerts: number;
  total_inmates: number;
  zones_online: number;
  zones: Zone[];
}

export interface DetentionPanelState {
  data: DetentionDashboardData | null;
  loading: boolean;
  error: string | null;
  selectedFacility: string;
  selectedZone: string | null;
  lastFetchTimestamp: number | null;
}

const initialState: DetentionPanelState = {
  data: null,
  loading: false,
  error: null,
  selectedFacility: 'FCI-ATLANTA',
  selectedZone: null,
  lastFetchTimestamp: null,
};

export const fetchDetentionDashboard = createAsyncThunk(
  'detentionPanel/fetchDashboard',
  async (facilityId: string, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_DETENTION_PANEL_DASHBOARD,
        variables: { facility_id: facilityId },
        fetchPolicy: 'network-only',
      });

      return data?.detention_panel?.get_detention_panel_dashboard || null;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch dashboard data'
      );
    }
  }
);

const detentionPanelSlice = createSlice({
  name: 'detentionPanel',
  initialState,
  reducers: {
    setSelectedFacility: (state, action: PayloadAction<string>) => {
      state.selectedFacility = action.payload;
    },
    setSelectedZone: (state, action: PayloadAction<string | null>) => {
      state.selectedZone = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDetentionDashboard.pending, (state) => {
        // Only show loading state if there's no existing data
        // This prevents UI flicker during background refreshes
        if (!state.data) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchDetentionDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.lastFetchTimestamp = Date.now();
      })
      .addCase(fetchDetentionDashboard.rejected, (state, action) => {
        state.loading = false;
        // Only set error if there's no existing data
        // This prevents error display during background refresh failures
        if (!state.data) {
          state.error = action.payload as string;
        }
      });
  },
});

export const { setSelectedFacility, setSelectedZone, clearError } =
  detentionPanelSlice.actions;

export default detentionPanelSlice.reducer;
