import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/lib/apollo-client';
import {
  GET_ACCESSIBLE_PROMPTS_BY_TYPES,
  GET_PROMPT_VERSIONS,
  GET_LATEST_PROMPT_VERSION,
  GET_PROCESS_CATALOG,
  GET_PROCESS_WITH_MODELS,
  GET_ORG_MODELS,
  GET_ORG_MODEL_BY_HASH,
  GET_CAM_PROCESS_CONFIGS,
  GET_BATCH_PROCESS_CONFIGS,
} from '@/graphql/workflow_queries';
import {
  CREATE_PROMPT,
  FORK_PROMPT,
  DELETE_PROMPT,
  RESTORE_PROMPT,
  CREATE_CAM_PROCESS_CONFIG,
  CREATE_BATCH_PROCESS_CONFIG,
  UPDATE_CAM_PROCESS_CONFIG,
  UPDATE_BATCH_PROCESS_CONFIG,
  DELETE_CAM_PROCESS_CONFIG,
  DELETE_BATCH_PROCESS_CONFIG,
  TOGGLE_BATCH_PROCESS_CONFIG,
} from '@/graphql/workflow_mutations';
import { TOGGLE_CAM_PROCESS_CONFIG } from '@/graphql/camera-process-config-queries';
import type {
  PromptTemplate,
  PromptVersion,
  PromptCategory,
  AccessLevel,
  Process,
  ProcessWithModels,
  Model,
  CameraProcessConfig,
  BatchProcessConfig,
  PromptInput,
  CamProcessConfigInput,
  BatchProcessConfigInput,
  BackendProcess,
  BackendProcessWithModels,
  ModelType,
  ModelProvider,
} from '@/types/workflow-types';

// ============================================================================
// STATE INTERFACE
// ============================================================================

export interface WorkflowState {
  // Prompts
  promptTemplates: PromptTemplate[];
  promptVersions: Record<string, PromptVersion[]>; // key: ref_prompt_key
  selectedPromptTemplate: PromptTemplate | null;

  // Processes
  processes: Process[];
  selectedProcess: ProcessWithModels | null;

  // Models
  models: Model[];
  selectedModel: Model | null;

  // Configurations
  cameraConfigs: Record<string, CameraProcessConfig[]>; // key: cam_hash
  batchConfigs: Record<string, BatchProcessConfig[]>; // key: batch_hash

  // UI State
  loading: {
    prompts: boolean;
    processes: boolean;
    models: boolean;
    configurations: boolean;
  };
  error: string | null;

  // Cache timestamps
  lastFetch: {
    prompts: number;
    processes: number;
    models: number;
  };
}

const initialState: WorkflowState = {
  promptTemplates: [],
  promptVersions: {},
  selectedPromptTemplate: null,
  processes: [],
  selectedProcess: null,
  models: [],
  selectedModel: null,
  cameraConfigs: {},
  batchConfigs: {},
  loading: {
    prompts: false,
    processes: false,
    models: false,
    configurations: false,
  },
  error: null,
  lastFetch: {
    prompts: 0,
    processes: 0,
    models: 0,
  },
};

// ============================================================================
// ASYNC THUNKS - PROMPTS
// ============================================================================

export const fetchPromptsByTypes = createAsyncThunk(
  'workflow/fetchPromptsByTypes',
  async ({
    types,
    access_level,
  }: {
    types: PromptCategory[];
    access_level?: AccessLevel;
  }) => {
    const result = await client.query({
      query: GET_ACCESSIBLE_PROMPTS_BY_TYPES,
      variables: { types, accessLevel: access_level },
      fetchPolicy: 'network-only',
    });

    // Explicitly define the type locally since we don't have a generated type for the raw response
    interface BackendPromptTemplate {
      refPromptKey: string;
      promptName: string;
      promptCategory: PromptCategory;
      accessLevel: AccessLevel;
      createdBy: string;
      createdAt: string;
      updatedAt: string;
      isActive: boolean;
      latestVersion?: {
        promptId: string;
        promptHash: string;
        versionNumber: number;
        createdAt: string;
      };
    }

    const backendPrompts = result.data.prompts
      .getAccessiblePromptsByTypes as BackendPromptTemplate[];

    return backendPrompts.map((bp) => ({
      ref_prompt_key: bp.refPromptKey,
      prompt_name: bp.promptName,
      prompt_category: bp.promptCategory,
      access_level: bp.accessLevel,
      created_by: bp.createdBy,
      created_at: bp.createdAt,
      updated_at: bp.updatedAt,
      is_active: bp.isActive,
      latest_version: bp.latestVersion
        ? {
            prompt_id: bp.latestVersion.promptId,
            prompt_hash: bp.latestVersion.promptHash,
            version_number: bp.latestVersion.versionNumber,
            prompt_content: '', // Content often not needed in list view
            created_by: '',
            created_at: bp.latestVersion.createdAt,
            is_latest: true,
          }
        : undefined,
    })) as PromptTemplate[];
  }
);

export const fetchPromptVersions = createAsyncThunk(
  'workflow/fetchPromptVersions',
  async (ref_prompt_key: string) => {
    const result = await client.query({
      query: GET_PROMPT_VERSIONS,
      variables: { ref_prompt_key },
      fetchPolicy: 'network-only',
    });

    return {
      ref_prompt_key,
      versions: result.data.prompts.getPromptVersions as PromptVersion[],
    };
  }
);

export const fetchLatestPromptVersion = createAsyncThunk(
  'workflow/fetchLatestPromptVersion',
  async (ref_prompt_key: string) => {
    const result = await client.query({
      query: GET_LATEST_PROMPT_VERSION,
      variables: { ref_prompt_key },
      fetchPolicy: 'network-only',
    });

    return result.data.prompts.getLatestPromptVersion as PromptVersion;
  }
);

export const createPrompt = createAsyncThunk(
  'workflow/createPrompt',
  async (input: PromptInput) => {
    const result = await client.mutate({
      mutation: CREATE_PROMPT,
      variables: { input },
    });

    return result.data.prompts.createPrompt as PromptVersion;
  }
);

export const forkPrompt = createAsyncThunk(
  'workflow/forkPrompt',
  async ({
    parent_prompt_id,
    input,
  }: {
    parent_prompt_id: string;
    input: PromptInput;
  }) => {
    const result = await client.mutate({
      mutation: FORK_PROMPT,
      variables: { parent_prompt_id, input },
    });

    return result.data.prompts.forkPrompt as PromptVersion;
  }
);

export const deletePrompt = createAsyncThunk(
  'workflow/deletePrompt',
  async (prompt_id: string) => {
    const result = await client.mutate({
      mutation: DELETE_PROMPT,
      variables: { prompt_id },
    });

    return { prompt_id, ...result.data.prompts.deletePrompt };
  }
);

export const restorePrompt = createAsyncThunk(
  'workflow/restorePrompt',
  async (prompt_id: string) => {
    const result = await client.mutate({
      mutation: RESTORE_PROMPT,
      variables: { prompt_id },
    });

    return result.data.prompts.restorePrompt as PromptVersion;
  }
);

// ============================================================================
// ASYNC THUNKS - PROCESSES
// ============================================================================

export const fetchProcessCatalog = createAsyncThunk(
  'workflow/fetchProcessCatalog',
  async () => {
    const result = await client.query({
      query: GET_PROCESS_CATALOG,
      fetchPolicy: 'network-only',
    });

    const backendProcesses = result.data.getProcessCatalog as BackendProcess[];

    return backendProcesses.map((bp) => ({
      process_hash: bp.orgProcessHash,
      process_name: bp.orgProcessName,
      process_type: bp.orgProcessType,
      description: '', // Not provided by backend
      access_level: bp.accessLevel || 'organization',
      is_active: true, // Assumed active if returned
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })) as Process[];
  }
);

export const fetchProcessWithModels = createAsyncThunk(
  'workflow/fetchProcessWithModels',
  async (process_hash: string) => {
    const result = await client.query({
      query: GET_PROCESS_WITH_MODELS,
      variables: { orgProcessHash: process_hash },
      fetchPolicy: 'network-only',
    });

    // Cast to unknown first if needed, or rely on loose typing here since we don't strictly import the query return type
    const bp = result.data.getProcessWithModels as BackendProcessWithModels;

    return {
      process_hash: bp.orgProcessHash,
      process_name: bp.orgProcessName,
      process_type: bp.orgProcessType,
      description: '',
      required_model_types: Array.from(
        new Set(bp.accessibleModels.map((m) => m.modelType))
      ),
      required_prompt_types: Array.from(
        new Set(bp.accessiblePrompts.map((p) => p.promptType))
      ),
      parameter_schema: bp.processParamSchema,
      accessible_models: bp.accessibleModels.map((m) => ({
        model_hash: m.modelHash,
        model_name: m.modelName,
        model_type: m.modelType as ModelType,
        provider: m.modelProvider as ModelProvider,
        access_level: m.accessLevel,
        is_active: true,
        created_at: new Date().toISOString(),
      })),
      accessible_prompts: bp.accessiblePrompts.map((p) => ({
        ref_prompt_key: p.promptHash, // Using hash as key since we don't have separate key in simple list
        prompt_name: p.promptName,
        prompt_category: p.promptType,
        access_level: p.accessLevel,
        created_by: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        latest_version: {
          prompt_id: '',
          prompt_hash: p.promptHash,
          version_number: 1,
          prompt_content: '',
          created_by: '',
          created_at: new Date().toISOString(),
          is_latest: true,
        },
      })),
      access_level: bp.accessLevel || 'organization',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ProcessWithModels;
  }
);

// ============================================================================
// ASYNC THUNKS - MODELS
// ============================================================================

export const fetchOrgModels = createAsyncThunk(
  'workflow/fetchOrgModels',
  async ({
    model_type,
    access_level,
  }: { model_type?: string; access_level?: AccessLevel } = {}) => {
    const result = await client.query({
      query: GET_ORG_MODELS,
      variables: { modelType: model_type, accessLevel: access_level },
      fetchPolicy: 'network-only',
    });

    interface BackendModel {
      modelHash: string;
      modelName: string;
      modelType: ModelType;
      modelProvider: ModelProvider;
      accessLevel: AccessLevel;
      isActive: boolean;
      capabilities?: string[];
      parameters?: Record<string, unknown>;
      createdAt: string;
      updatedAt?: string;
    }

    const backendModels = result.data.models.getOrgModels as BackendModel[];

    return backendModels.map((bm) => ({
      model_hash: bm.modelHash,
      model_name: bm.modelName,
      model_type: bm.modelType,
      provider: bm.modelProvider,
      access_level: bm.accessLevel,
      is_active: bm.isActive,
      capabilities: bm.capabilities,
      parameters: bm.parameters,
      created_at: bm.createdAt,
      updated_at: bm.updatedAt,
    })) as Model[];
  }
);

export const fetchOrgModelByHash = createAsyncThunk(
  'workflow/fetchOrgModelByHash',
  async (model_hash: string) => {
    const result = await client.query({
      query: GET_ORG_MODEL_BY_HASH,
      variables: { model_hash },
      fetchPolicy: 'network-only',
    });

    return result.data.models.getOrgModelByHash as Model;
  }
);

// ============================================================================
// ASYNC THUNKS - CONFIGURATIONS
// ============================================================================

export const fetchCamProcessConfigs = createAsyncThunk(
  'workflow/fetchCamProcessConfigs',
  async (cam_hash: string) => {
    const result = await client.query({
      query: GET_CAM_PROCESS_CONFIGS,
      variables: { cam_hash },
      fetchPolicy: 'network-only',
    });

    return {
      cam_hash,
      configs: result.data.configurations
        .get_cam_process_configs as CameraProcessConfig[],
    };
  }
);

export const fetchBatchProcessConfigs = createAsyncThunk(
  'workflow/fetchBatchProcessConfigs',
  async (batch_hash: string) => {
    const result = await client.query({
      query: GET_BATCH_PROCESS_CONFIGS,
      variables: { batch_hash },
      fetchPolicy: 'network-only',
    });

    return {
      batch_hash,
      configs: result.data.configurations
        .get_batch_process_configs as BatchProcessConfig[],
    };
  }
);

export const createCamProcessConfig = createAsyncThunk(
  'workflow/createCamProcessConfig',
  async (input: CamProcessConfigInput) => {
    const result = await client.mutate({
      mutation: CREATE_CAM_PROCESS_CONFIG,
      variables: { input },
    });

    return result.data.configurations
      .create_cam_process_config as CameraProcessConfig;
  }
);

export const createBatchProcessConfig = createAsyncThunk(
  'workflow/createBatchProcessConfig',
  async (input: BatchProcessConfigInput) => {
    const result = await client.mutate({
      mutation: CREATE_BATCH_PROCESS_CONFIG,
      variables: { input },
    });

    return result.data.configurations
      .create_batch_process_config as BatchProcessConfig;
  }
);

export const updateCamProcessConfig = createAsyncThunk(
  'workflow/updateCamProcessConfig',
  async ({
    config_id,
    input,
  }: {
    config_id: string;
    input: CamProcessConfigInput;
  }) => {
    const result = await client.mutate({
      mutation: UPDATE_CAM_PROCESS_CONFIG,
      variables: { config_id, input },
    });

    return result.data.configurations
      .update_cam_process_config as CameraProcessConfig;
  }
);

export const updateBatchProcessConfig = createAsyncThunk(
  'workflow/updateBatchProcessConfig',
  async ({
    config_id,
    input,
  }: {
    config_id: string;
    input: BatchProcessConfigInput;
  }) => {
    const result = await client.mutate({
      mutation: UPDATE_BATCH_PROCESS_CONFIG,
      variables: { config_id, input },
    });

    return result.data.configurations
      .update_batch_process_config as BatchProcessConfig;
  }
);

export const deleteCamProcessConfig = createAsyncThunk(
  'workflow/deleteCamProcessConfig',
  async (config_id: string) => {
    const result = await client.mutate({
      mutation: DELETE_CAM_PROCESS_CONFIG,
      variables: { config_id },
    });

    return {
      config_id,
      ...result.data.configurations.delete_cam_process_config,
    };
  }
);

export const deleteBatchProcessConfig = createAsyncThunk(
  'workflow/deleteBatchProcessConfig',
  async (config_id: string) => {
    const result = await client.mutate({
      mutation: DELETE_BATCH_PROCESS_CONFIG,
      variables: { config_id },
    });

    return {
      config_id,
      ...result.data.configurations.delete_batch_process_config,
    };
  }
);

export const toggleCamProcessConfig = createAsyncThunk(
  'workflow/toggleCamProcessConfig',
  async ({
    config_id,
    enabled,
    cam_hash,
  }: {
    config_id: string;
    enabled: boolean;
    cam_hash: string;
  }) => {
    const result = await client.mutate({
      mutation: TOGGLE_CAM_PROCESS_CONFIG,
      variables: { camProcessConfigHash: config_id, isEnabled: enabled },
    });

    // The mutation returns { config_id, is_enabled, updated_at }
    return {
      config_id,
      is_enabled:
        result.data.configurations.toggle_cam_process_config.is_enabled,
      cam_hash,
    };
  }
);

export const toggleBatchProcessConfig = createAsyncThunk(
  'workflow/toggleBatchProcessConfig',
  async ({ config_id, enabled }: { config_id: string; enabled: boolean }) => {
    const result = await client.mutate({
      mutation: TOGGLE_BATCH_PROCESS_CONFIG,
      variables: { config_id, enabled },
    });

    return result.data.configurations
      .toggle_batch_process_config as BatchProcessConfig;
  }
);

// ============================================================================
// SLICE
// ============================================================================

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setSelectedPromptTemplate: (
      state,
      action: PayloadAction<PromptTemplate | null>
    ) => {
      state.selectedPromptTemplate = action.payload;
    },
    setSelectedProcess: (
      state,
      action: PayloadAction<ProcessWithModels | null>
    ) => {
      state.selectedProcess = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<Model | null>) => {
      state.selectedModel = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetWorkflowState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch prompts by types
      .addCase(fetchPromptsByTypes.pending, (state) => {
        state.loading.prompts = true;
        state.error = null;
      })
      .addCase(fetchPromptsByTypes.fulfilled, (state, action) => {
        state.loading.prompts = false;
        state.promptTemplates = action.payload;
        state.lastFetch.prompts = Date.now();
      })
      .addCase(fetchPromptsByTypes.rejected, (state, action) => {
        state.loading.prompts = false;
        state.error = action.error.message || 'Failed to fetch prompts';
      })

      // Fetch prompt versions
      .addCase(fetchPromptVersions.fulfilled, (state, action) => {
        state.promptVersions[action.payload.ref_prompt_key] =
          action.payload.versions;
      })

      // Fetch process catalog
      .addCase(fetchProcessCatalog.pending, (state) => {
        state.loading.processes = true;
        state.error = null;
      })
      .addCase(fetchProcessCatalog.fulfilled, (state, action) => {
        state.loading.processes = false;
        state.processes = action.payload;
        state.lastFetch.processes = Date.now();
      })
      .addCase(fetchProcessCatalog.rejected, (state, action) => {
        state.loading.processes = false;
        state.error = action.error.message || 'Failed to fetch processes';
      })

      // Fetch process with models
      .addCase(fetchProcessWithModels.fulfilled, (state, action) => {
        state.selectedProcess = action.payload;
      })

      // Fetch org models
      .addCase(fetchOrgModels.pending, (state) => {
        state.loading.models = true;
        state.error = null;
      })
      .addCase(fetchOrgModels.fulfilled, (state, action) => {
        state.loading.models = false;
        state.models = action.payload;
        state.lastFetch.models = Date.now();
      })
      .addCase(fetchOrgModels.rejected, (state, action) => {
        state.loading.models = false;
        state.error = action.error.message || 'Failed to fetch models';
      })

      // Fetch camera configs
      .addCase(fetchCamProcessConfigs.pending, (state) => {
        state.loading.configurations = true;
        state.error = null;
      })
      .addCase(fetchCamProcessConfigs.fulfilled, (state, action) => {
        state.loading.configurations = false;
        state.cameraConfigs[action.payload.cam_hash] = action.payload.configs;
      })
      .addCase(fetchCamProcessConfigs.rejected, (state, action) => {
        state.loading.configurations = false;
        state.error =
          action.error.message || 'Failed to fetch camera configurations';
      })

      // Fetch batch configs
      .addCase(fetchBatchProcessConfigs.fulfilled, (state, action) => {
        state.batchConfigs[action.payload.batch_hash] = action.payload.configs;
      })

      // Create camera config
      .addCase(createCamProcessConfig.fulfilled, (state, action) => {
        const cam_hash = action.payload.cam_hash;
        if (!state.cameraConfigs[cam_hash]) {
          state.cameraConfigs[cam_hash] = [];
        }
        state.cameraConfigs[cam_hash].push(action.payload);
      })

      // Create batch config
      .addCase(createBatchProcessConfig.fulfilled, (state, action) => {
        const batch_hash = action.payload.batch_hash;
        if (!state.batchConfigs[batch_hash]) {
          state.batchConfigs[batch_hash] = [];
        }
        state.batchConfigs[batch_hash].push(action.payload);
      })

      // Update camera config
      .addCase(updateCamProcessConfig.fulfilled, (state, action) => {
        const cam_hash = action.payload.cam_hash;
        const configs = state.cameraConfigs[cam_hash];
        if (configs) {
          const index = configs.findIndex(
            (c) => c.config_id === action.payload.config_id
          );
          if (index !== -1) {
            configs[index] = action.payload;
          }
        }
      })

      // Update batch config
      .addCase(updateBatchProcessConfig.fulfilled, (state, action) => {
        const batch_hash = action.payload.batch_hash;
        const configs = state.batchConfigs[batch_hash];
        if (configs) {
          const index = configs.findIndex(
            (c) => c.config_id === action.payload.config_id
          );
          if (index !== -1) {
            configs[index] = action.payload;
          }
        }
      })

      // Toggle camera config
      .addCase(toggleCamProcessConfig.fulfilled, (state, action) => {
        const cam_hash = action.payload.cam_hash;
        const configs = state.cameraConfigs[cam_hash];
        if (configs) {
          const config = configs.find(
            (c) => c.config_id === action.payload.config_id
          );
          if (config) {
            config.is_enabled = action.payload.is_enabled;
          }
        }
      })

      // Toggle batch config
      .addCase(toggleBatchProcessConfig.fulfilled, (state, action) => {
        const batch_hash = action.payload.batch_hash;
        const configs = state.batchConfigs[batch_hash];
        if (configs) {
          const config = configs.find(
            (c) => c.config_id === action.payload.config_id
          );
          if (config) {
            config.is_enabled = action.payload.is_enabled;
          }
        }
      });
  },
});

export const {
  setSelectedPromptTemplate,
  setSelectedProcess,
  setSelectedModel,
  clearError,
  resetWorkflowState,
} = workflowSlice.actions;

export default workflowSlice.reducer;
