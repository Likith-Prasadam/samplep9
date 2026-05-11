import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import client from '@/lib/apollo-client';
import {
  GET_ORG_COHORTS,
  GET_ORG_COHORT_BY_HASH,
  CREATE_ORG_COHORT,
  UPDATE_ORG_COHORT,
  DELETE_ORG_COHORT,
} from '@/graphql/org_cohort_queries';
import type {
  OrgCohort,
  OrgCohortInput,
  OrgCohortUpdateInput,
  OrgCohortsState,
  OrgCohortFilters,
} from '@/types/org-cohort-types';

const initialState: OrgCohortsState = {
  cohorts: [],
  selectedCohort: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
  },
  filters: {},
  dialog: {
    open: null,
    currentCohort: null,
  },
};

// Async thunk to fetch paginated organization cohorts
export const fetchOrgCohorts = createAsyncThunk(
  'orgCohorts/fetchOrgCohorts',
  async (
    {
      page = 1,
      itemsPerPage = 10,
      filters = {},
    }: {
      page?: number;
      itemsPerPage?: number;
      filters?: OrgCohortFilters;
    },
    { rejectWithValue }
  ) => {
    try {
      const filterInput: Record<string, unknown> = {};
      if (filters.isRoot !== undefined) {
        filterInput.isRoot = filters.isRoot;
      }
      if (filters.orgCohortName) {
        filterInput.orgCohortName = filters.orgCohortName;
      }

      const { data } = await client.query({
        query: GET_ORG_COHORTS,
        variables: {
          page,
          itemsPerPage,
          filters:
            Object.keys(filterInput).length > 0 ? filterInput : undefined,
        },
        fetchPolicy: 'network-only',
      });

      const paginatedResponse = data.getOrgCohorts;
      return {
        cohorts: paginatedResponse?.orgCohorts || [],
        totalCount: paginatedResponse?.totalCount || 0,
        totalPages: Math.ceil(
          (paginatedResponse?.totalCount || 0) / itemsPerPage
        ),
        hasNext: paginatedResponse?.hasNext || false,
      };
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch organization cohorts'
      );
    }
  }
);

// Async thunk to fetch a single organization cohort by hash
export const fetchOrgCohortByHash = createAsyncThunk(
  'orgCohorts/fetchOrgCohortByHash',
  async (orgCohortHash: string, { rejectWithValue }) => {
    try {
      const { data } = await client.query({
        query: GET_ORG_COHORT_BY_HASH,
        variables: { orgCohortHash },
        fetchPolicy: 'network-only',
      });

      return data.getOrgCohortByHash;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to fetch organization cohort'
      );
    }
  }
);

// Async thunk to create a new organization cohort
export const createOrgCohort = createAsyncThunk(
  'orgCohorts/createOrgCohort',
  async (input: OrgCohortInput, { rejectWithValue }) => {
    try {
      const response = await client.mutate({
        mutation: CREATE_ORG_COHORT,
        variables: { input },
      });

      if (response.errors && response.errors.length > 0) {
        return rejectWithValue(
          response.errors[0].message || 'Failed to create organization cohort'
        );
      }

      if (!response.data || !response.data.createOrgCohort) {
        return rejectWithValue('Failed to create organization cohort');
      }

      return response.data.createOrgCohort;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to create organization cohort'
      );
    }
  }
);

// Async thunk to update an existing organization cohort
export const updateOrgCohort = createAsyncThunk(
  'orgCohorts/updateOrgCohort',
  async (input: OrgCohortUpdateInput, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: UPDATE_ORG_COHORT,
        variables: { input },
      });

      return data.updateOrgCohort;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to update organization cohort'
      );
    }
  }
);

// Async thunk to soft-delete an organization cohort
export const deleteOrgCohort = createAsyncThunk(
  'orgCohorts/deleteOrgCohort',
  async (orgCohortHash: string, { rejectWithValue }) => {
    try {
      const { data } = await client.mutate({
        mutation: DELETE_ORG_COHORT,
        variables: { orgCohortHash },
      });

      if (!data.deleteOrgCohort) {
        throw new Error('Deletion failed');
      }

      return orgCohortHash;
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'Failed to delete organization cohort'
      );
    }
  }
);

const orgCohortsSlice = createSlice({
  name: 'orgCohorts',
  initialState,
  reducers: {
    setCohorts: (state, action: PayloadAction<OrgCohort[]>) => {
      state.cohorts = action.payload;
    },
    setSelectedCohort: (state, action: PayloadAction<OrgCohort | null>) => {
      state.selectedCohort = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.pagination.itemsPerPage = action.payload;
    },
    setFilters: (state, action: PayloadAction<OrgCohortFilters>) => {
      state.filters = action.payload;
    },
    setDialogOpen: (
      state,
      action: PayloadAction<'create' | 'edit' | 'delete' | null>
    ) => {
      state.dialog.open = action.payload;
    },
    setCurrentCohort: (state, action: PayloadAction<OrgCohort | null>) => {
      state.dialog.currentCohort = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch org cohorts
      .addCase(fetchOrgCohorts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgCohorts.fulfilled, (state, action) => {
        state.loading = false;
        state.cohorts = action.payload.cohorts;
        state.pagination.totalItems = action.payload.totalCount;
        state.pagination.totalPages = action.payload.totalPages;
      })
      .addCase(fetchOrgCohorts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch org cohort by hash
      .addCase(fetchOrgCohortByHash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrgCohortByHash.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCohort = action.payload;
      })
      .addCase(fetchOrgCohortByHash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create org cohort
      .addCase(createOrgCohort.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrgCohort.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.cohorts.unshift(action.payload);
        }
        state.dialog.open = null;
        state.dialog.currentCohort = null;
      })
      .addCase(createOrgCohort.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update org cohort
      .addCase(updateOrgCohort.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrgCohort.fulfilled, (state, action) => {
        state.loading = false;
        const updatedHash =
          action.payload?.orgCohortHash ?? action.meta.arg.orgCohortHash;
        const index = state.cohorts.findIndex(
          (c) => c.orgCohortHash === updatedHash
        );
        if (index !== -1 && action.payload) {
          state.cohorts[index] = {
            ...state.cohorts[index],
            orgCohortName:
              action.payload.orgCohortName ??
              state.cohorts[index].orgCohortName,
            isRoot: action.payload.isRoot ?? state.cohorts[index].isRoot,
            updatedAt:
              action.payload.updatedAt ?? state.cohorts[index].updatedAt,
          };
        }
        state.dialog.open = null;
        state.dialog.currentCohort = null;
      })
      .addCase(updateOrgCohort.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete org cohort
      .addCase(deleteOrgCohort.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrgCohort.fulfilled, (state, action) => {
        state.loading = false;
        state.cohorts = state.cohorts.filter(
          (c) => c.orgCohortHash !== action.payload
        );
        state.dialog.open = null;
        state.dialog.currentCohort = null;
      })
      .addCase(deleteOrgCohort.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCohorts,
  setSelectedCohort,
  setPage,
  setItemsPerPage,
  setFilters,
  setDialogOpen,
  setCurrentCohort,
  clearError,
} = orgCohortsSlice.actions;

export default orgCohortsSlice.reducer;
