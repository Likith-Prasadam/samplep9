import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import client from '@/lib/apollo-client';
import { SELECT_CONTEXT_MUTATION } from '@/features/login/queries';
import type { Cohort, Category } from '@/features/login/types/types';

export interface CohortContextData {
  token: string;
  cohort_id: number;
  role_name: string;
  user_role_id: number;
  category_id: number;
  category_code: string;
}

export interface CohortState {
  cohorts: Cohort[];
  selectedCohort: Cohort | null;
  selectedCategory: Category | null;
  contextData: CohortContextData | null;
  loading: boolean;
  error: string | null;
  isContextSelected: boolean;
}

const initialState: CohortState = {
  cohorts: [],
  selectedCohort: null,
  selectedCategory: null,
  contextData: null,
  loading: false,
  error: null,
  isContextSelected: false,
};

export const selectContextAsync = createAsyncThunk(
  'cohort/selectContext',
  async (
    { userRoleId, category }: { userRoleId: number; category: Category },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await client.mutate({
        mutation: SELECT_CONTEXT_MUTATION,
        variables: { userRoleId },
      });

      const contextData = data.auth.select_context;

      return {
        token: contextData.token,
        cohort_id: contextData.cohort_id,
        role_name: contextData.role_name,
        user_role_id: contextData.user_role_id,
        category_id: contextData.category_id,
        category_code: category.category_code,
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to select context'
      );
    }
  }
);

const cohortSlice = createSlice({
  name: 'cohort',
  initialState,
  reducers: {
    setCohorts: (state, action: PayloadAction<Cohort[]>) => {
      state.cohorts = action.payload;
    },
    setSelectedCohort: (state, action: PayloadAction<Cohort | null>) => {
      state.selectedCohort = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    setContextData: (
      state,
      action: PayloadAction<CohortContextData | null>
    ) => {
      state.contextData = action.payload;
      state.isContextSelected = action.payload !== null;
    },
    clearCohortState: (state) => {
      state.cohorts = [];
      state.selectedCohort = null;
      state.selectedCategory = null;
      state.contextData = null;
      state.loading = false;
      state.error = null;
      state.isContextSelected = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(selectContextAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(selectContextAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.contextData = action.payload;
        state.isContextSelected = true;
      })
      .addCase(selectContextAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCohorts,
  setSelectedCohort,
  setSelectedCategory,
  setContextData,
  clearCohortState,
  clearError,
} = cohortSlice.actions;

export default cohortSlice.reducer;
