import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectedIntelligenceFilters } from '@/features/connected-intelligence/types';

export interface ConnectedIntelligenceState {
  filters: ConnectedIntelligenceFilters;
}

const defaultFilters: ConnectedIntelligenceFilters = {
  zones: [],
  city: '',
  cities: [],
  zipcodes: [],
  subzone: '',
  cameraNames: '',
  cameraHashes: '',
  cameraTypes: [],
  resolutions: [],
  ipAddress: '',
  cameraTags: [],
  analysisTimeframe: '60',
};

const CONNECTED_INTELLIGENCE_STORAGE_KEY =
  'spectra-connected-intelligence-filters-v1';

const persistFilters = (filters: ConnectedIntelligenceFilters) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      CONNECTED_INTELLIGENCE_STORAGE_KEY,
      JSON.stringify(filters)
    );
  } catch {
    // Ignore storage errors to keep connected intelligence functional.
  }
};

const loadFilters = (): ConnectedIntelligenceFilters => {
  if (typeof window === 'undefined') {
    return defaultFilters;
  }

  try {
    const raw = window.localStorage.getItem(CONNECTED_INTELLIGENCE_STORAGE_KEY);
    if (!raw) return defaultFilters;

    const parsed = JSON.parse(raw) as Partial<ConnectedIntelligenceFilters>;
    if (!parsed || typeof parsed !== 'object') {
      return defaultFilters;
    }

    return {
      ...defaultFilters,
      ...parsed,
    };
  } catch {
    return defaultFilters;
  }
};

const initialState: ConnectedIntelligenceState = {
  filters: loadFilters(),
};

const connectedIntelligenceSlice = createSlice({
  name: 'connectedIntelligence',
  initialState,
  reducers: {
    setFilters: (
      state,
      action: PayloadAction<ConnectedIntelligenceFilters>
    ) => {
      state.filters = action.payload;
      persistFilters(state.filters);
    },
    resetFilters: (state) => {
      state.filters = defaultFilters;
      persistFilters(state.filters);
    },
  },
});

export const { setFilters, resetFilters } = connectedIntelligenceSlice.actions;

export default connectedIntelligenceSlice.reducer;
