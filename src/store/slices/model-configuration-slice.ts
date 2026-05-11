import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/lib/apollo-client';
import {
  FETCH_COHORT_PARAMS,
  UPDATE_COHORT_PARAMS,
} from '@/graphql/configuration_queries';
import type { ModelParams } from '@/features/configuration/model-configuration/types/types';
import { SLIDERS } from '@/features/configuration/model-configuration/types/constants';

export interface ModelConfigurationState {
  params: ModelParams;
  model: string;
  cohortId: number;
  loading: boolean;
  error: string | null;
}

const getDefaultParams = (): ModelParams => ({
  temperature: SLIDERS[0].default,
  repetition_penalty: SLIDERS[1].default,
  top_p: SLIDERS[2].default,
  max_tokens: SLIDERS[3].default,
});

const initialState: ModelConfigurationState = {
  params: getDefaultParams(),
  model: 'v1.0',
  cohortId: 1,
  loading: false,
  error: null,
};

// Fetch cohort parameters
export const fetchCohortParams = createAsyncThunk(
  'modelConfiguration/fetchCohortParams',
  async () => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const result = await client.query({
      query: FETCH_COHORT_PARAMS,
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    const cohorts =
      result?.data?.org_cohorts?.fetch_data_by_filters_orgcohorts?.org_cohorts;

    if (!cohorts || cohorts.length === 0) {
      throw new Error('No cohort data found');
    }

    const cohort = cohorts[0];
    const cohortParams = JSON.parse(cohort.cohort_model_params);

    return {
      cohortId: cohort.id,
      params: {
        temperature: cohortParams.temperature ?? SLIDERS[0].default,
        repetition_penalty:
          cohortParams.repetition_penalty ?? SLIDERS[1].default,
        top_p: cohortParams.top_p ?? SLIDERS[2].default,
        max_tokens: cohortParams.max_tokens ?? SLIDERS[3].default,
      },
    };
  }
);

// Update cohort parameters
export const updateCohortParams = createAsyncThunk(
  'modelConfiguration/updateCohortParams',
  async ({ cohortId, params }: { cohortId: number; params: ModelParams }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const modelParamsString = JSON.stringify({
      top_p: params.top_p,
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      stop_token_ids: [],
      repetition_penalty: params.repetition_penalty,
    });

    const result = await client.mutate({
      mutation: UPDATE_COHORT_PARAMS,
      variables: {
        input_json: {
          id: cohortId,
          cohort_model_params: modelParamsString,
        },
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (!result.data?.org_cohorts?.update_org_cohort) {
      throw new Error('Failed to update cohort parameters');
    }

    return { success: true };
  }
);

const modelConfigurationSlice = createSlice({
  name: 'modelConfiguration',
  initialState,
  reducers: {
    setParam: (
      state,
      action: PayloadAction<{ key: keyof ModelParams; value: number }>
    ) => {
      state.params[action.payload.key] = action.payload.value;
    },
    setModel: (state, action: PayloadAction<string>) => {
      state.model = action.payload;
    },
    resetParams: (state) => {
      state.params = getDefaultParams();
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch cohort params
      .addCase(fetchCohortParams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCohortParams.fulfilled, (state, action) => {
        state.loading = false;
        state.cohortId = action.payload.cohortId;
        state.params = action.payload.params;
      })
      .addCase(fetchCohortParams.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to fetch cohort parameters';
      })
      // Update cohort params
      .addCase(updateCohortParams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCohortParams.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateCohortParams.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to update cohort parameters';
      });
  },
});

export const { setParam, setModel, resetParams, clearError } =
  modelConfigurationSlice.actions;

export default modelConfigurationSlice.reducer;
