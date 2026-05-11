import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { ApolloError } from '@apollo/client';
import client from '@/lib/apollo-client';
import {
  GET_CAMS_QUERY,
  type GetCamsResponse,
  type CamsWithHLSType,
} from '@/graphql/cameras_queries';
import { getActiveCohortHash } from '@/utils/cohort-utils';
import type { RootState } from '@/store';
import type {
  Camera,
  SnackbarState,
} from '@/features/cameras/camera-list/types/cameras';

/** Ordered unique cohort hashes: preferred first (e.g. URL), then session/JWT fallbacks. */
function getCohortHashCandidates(
  state: RootState,
  preferred?: string | null
): string[] {
  const raw = [
    preferred,
    state.auth.currentRoleCohortHash,
    state.auth.user?.cohort_hash,
    getActiveCohortHash(),
  ];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of raw) {
    if (typeof c !== 'string') continue;
    const t = c.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function getApolloRelatedMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    return [
      error.message,
      ...(error.graphQLErrors?.map((e) => e.message) ?? []),
      ...(error.networkError && 'message' in error.networkError
        ? [String((error.networkError as { message?: string }).message)]
        : []),
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (error instanceof Error) return error.message;
  return String(error);
}

function isRetryableCohortError(error: unknown): boolean {
  const msg = getApolloRelatedMessage(error);
  return /cohort not found/i.test(msg);
}

async function getCamsWithCohortFallback(
  state: RootState,
  preferredCohort: string | undefined,
  page: number,
  itemsPerPage: number
): Promise<GetCamsResponse['getCams']> {
  const candidates = getCohortHashCandidates(state, preferredCohort);
  if (candidates.length === 0) {
    throw new Error('No cohort hash available for getCams query');
  }

  let lastError: unknown;
  for (const cohortHash of candidates) {
    try {
      const { data } = await client.query<GetCamsResponse>({
        query: GET_CAMS_QUERY,
        variables: {
          cohortHash,
          page,
          itemsPerPage,
        },
        fetchPolicy: 'network-only',
      });

      if (!data || !data.getCams) {
        throw new Error('No data returned from getCams query');
      }

      return data.getCams;
    } catch (error) {
      lastError = error;
      const retry =
        isRetryableCohortError(error) &&
        candidates.indexOf(cohortHash) < candidates.length - 1;
      if (retry) {
        console.warn(
          `[cameras] Cohort not accepted (${cohortHash.slice(0, 8)}…), retrying with next candidate`
        );
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to fetch cameras');
}

/**
 * Async thunk to fetch paginated list of cameras
 */
export const fetchCams = createAsyncThunk(
  'cameras/fetchCams',
  async (
    {
      cohortHash,
      page = 1,
      itemsPerPage = 10,
    }: {
      cohortHash?: string;
      page?: number;
      itemsPerPage?: number;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as RootState;
      const result = await getCamsWithCohortFallback(
        state,
        cohortHash,
        page,
        itemsPerPage
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to fetch cameras';
      console.error('❌ Error fetching cameras:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * Async thunk to fetch a single camera by its hash
 * Uses getCams query and filters results by hash
 * Uses network-only fetch policy to ensure fresh HLS URLs after hard refresh
 */
export const fetchCamByHash = createAsyncThunk(
  'cameras/fetchCamByHash',
  async (
    payload: string | { camHash: string; cohortHash?: string },
    { rejectWithValue, getState }
  ) => {
    const camHash = typeof payload === 'string' ? payload : payload.camHash;
    const requestedCohortHash =
      typeof payload === 'string' ? undefined : payload.cohortHash;

    try {
      const state = getState() as RootState;
      const paginated = await getCamsWithCohortFallback(
        state,
        requestedCohortHash,
        1,
        100
      );

      if (!paginated?.cams?.length) {
        throw new Error('No cameras found');
      }

      const camera = paginated.cams.find((cam) => cam.camHash === camHash);

      if (!camera) {
        throw new Error(`No camera found with hash: ${camHash}`);
      }

      return camera;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to fetch camera with hash: ${camHash}`;
      console.error('❌ Error fetching camera by hash:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Initial state
interface CamerasState {
  searchTerm: string;
  statusFilter: 'all' | 'active' | 'inactive';
  currentPage: number;
  itemsPerPage: number;
  isAddCameraOpen: boolean;
  isDeleteDialogOpen: boolean;
  isEditDialogOpen: boolean;
  cameraToEdit: Camera | null;
  cameraToDelete: Camera | null;
  snackbar: SnackbarState;
  filteredCameras?: Camera[]; // Optional: if you dispatch raw/filtered data here
  // API state
  cams: CamsWithHLSType[];
  selectedCam: CamsWithHLSType | null;
  totalCount: number;
  hasNext: boolean;
  loading: boolean;
  cameraLoading: boolean;
  error: string | null;
}

const initialState: CamerasState = {
  searchTerm: '',
  statusFilter: 'all',
  currentPage: 1,
  itemsPerPage: 20,
  isAddCameraOpen: false,
  isDeleteDialogOpen: false,
  isEditDialogOpen: false,
  cameraToEdit: null,
  cameraToDelete: null,
  snackbar: { message: '', isOpen: false, variant: 'success' as const },
  filteredCameras: undefined,
  // API state
  cams: [],
  selectedCam: null,
  totalCount: 0,
  hasNext: false,
  loading: false,
  cameraLoading: false,
  error: null,
};

// Create slice
const camerasSlice = createSlice({
  name: 'cameras',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setStatusFilter: (
      state,
      action: PayloadAction<'all' | 'active' | 'inactive'>
    ) => {
      state.statusFilter = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
    },
    setIsAddCameraOpen: (state, action: PayloadAction<boolean>) => {
      state.isAddCameraOpen = action.payload;
    },
    setIsDeleteDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.isDeleteDialogOpen = action.payload;
    },
    setIsEditDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.isEditDialogOpen = action.payload;
    },
    setCameraToEdit: (state, action: PayloadAction<Camera | null>) => {
      state.cameraToEdit = action.payload;
    },
    setCameraToDelete: (state, action: PayloadAction<Camera | null>) => {
      state.cameraToDelete = action.payload;
    },
    showSnackbar: (
      state,
      action: PayloadAction<Omit<SnackbarState, 'isOpen'> & { isOpen: true }>
    ) => {
      state.snackbar = { ...action.payload, isOpen: true };
    },
    hideSnackbar: (state) => {
      state.snackbar.isOpen = false;
    },
    setFilteredCameras: (state, action: PayloadAction<Camera[]>) => {
      state.filteredCameras = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Add more reducers as needed (e.g., for mutations)
  },
  extraReducers: (builder) => {
    // Fetch Cams - Pending
    builder.addCase(fetchCams.pending, (state) => {
      state.loading = true;
      state.error = null;
    });

    // Fetch Cams - Fulfilled
    builder.addCase(fetchCams.fulfilled, (state, action) => {
      state.loading = false;
      state.cams = action.payload.cams;
      state.totalCount = action.payload.totalCount;
      state.currentPage = action.payload.page;
      state.itemsPerPage = action.payload.itemsPerPage;
      state.hasNext = action.payload.hasNext;
      state.error = null;
    });

    // Fetch Cams - Rejected
    builder.addCase(fetchCams.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch Cam By Hash - Pending
    builder.addCase(fetchCamByHash.pending, (state) => {
      state.cameraLoading = true;
      state.error = null;
    });

    // Fetch Cam By Hash - Fulfilled
    builder.addCase(fetchCamByHash.fulfilled, (state, action) => {
      state.cameraLoading = false;
      state.selectedCam = action.payload;
      state.error = null;
    });

    // Fetch Cam By Hash - Rejected
    builder.addCase(fetchCamByHash.rejected, (state, action) => {
      state.cameraLoading = false;
      state.error = action.payload as string;
    });
  },
});

// Export reducer for injection
export const camerasReducer = camerasSlice.reducer;

// Export actions
export const {
  setSearchTerm,
  setStatusFilter,
  setCurrentPage,
  setItemsPerPage,
  setIsAddCameraOpen,
  setIsDeleteDialogOpen,
  setIsEditDialogOpen,
  setCameraToEdit,
  setCameraToDelete,
  showSnackbar,
  hideSnackbar,
  setFilteredCameras,
  clearError,
} = camerasSlice.actions;

// Export selectors
export const selectCamerasState = (state: { cameras: CamerasState }) =>
  state.cameras;
export const selectSearchTerm = (state: { cameras: CamerasState }) =>
  state.cameras.searchTerm;
export const selectStatusFilter = (state: { cameras: CamerasState }) =>
  state.cameras.statusFilter;
export const selectCurrentPage = (state: { cameras: CamerasState }) =>
  state.cameras.currentPage;
export const selectItemsPerPage = (state: { cameras: CamerasState }) =>
  state.cameras.itemsPerPage;
export const selectIsAddCameraOpen = (state: { cameras: CamerasState }) =>
  state.cameras.isAddCameraOpen;
export const selectIsDeleteDialogOpen = (state: { cameras: CamerasState }) =>
  state.cameras.isDeleteDialogOpen;
export const selectIsEditDialogOpen = (state: { cameras: CamerasState }) =>
  state.cameras.isEditDialogOpen;
export const selectCameraToEdit = (state: { cameras: CamerasState }) =>
  state.cameras.cameraToEdit;
export const selectCameraToDelete = (state: { cameras: CamerasState }) =>
  state.cameras.cameraToDelete;
export const selectSnackbar = (state: { cameras: CamerasState }) =>
  state.cameras.snackbar;
export const selectFilteredCameras = (state: { cameras: CamerasState }) =>
  state.cameras.filteredCameras;

// New selectors for API state
export const selectCams = (state: { cameras: CamerasState }) =>
  state.cameras.cams;
export const selectSelectedCam = (state: { cameras: CamerasState }) =>
  state.cameras.selectedCam;
export const selectTotalCount = (state: { cameras: CamerasState }) =>
  state.cameras.totalCount;
export const selectHasNext = (state: { cameras: CamerasState }) =>
  state.cameras.hasNext;
export const selectLoading = (state: { cameras: CamerasState }) =>
  state.cameras.loading;
export const selectCameraLoading = (state: { cameras: CamerasState }) =>
  state.cameras.cameraLoading;
export const selectCamerasError = (state: { cameras: CamerasState }) =>
  state.cameras.error;
