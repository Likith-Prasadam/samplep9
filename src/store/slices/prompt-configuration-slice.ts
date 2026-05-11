import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { client } from '@/lib/apollo-client';
import {
  GET_GLOBAL_COHORT_PROMPTS,
  GET_PROMPTS,
} from '@/graphql/configuration_queries';
import { READ_PROMPTS_FROM_PATH } from '@/graphql/batch_mutations';
import {
  CREATE_GLOBAL_PROMPTS_MUTATION,
  UPDATE_GLOBAL_PROMPTS_MUTATION,
  DELETE_GLOBAL_PROMPTS_MUTATION,
} from '@/graphql/configuration_mutation';
import {
  GET_PROMPT_VERSIONS,
  GET_ACCESSIBLE_PROMPTS_BY_TYPES,
  GET_LATEST_PROMPT_VERSION,
  CREATE_PROMPT,
  FORK_PROMPT,
} from '@/graphql/prompt_mutations';

export interface PromptData {
  [key: string]: string;
}

export interface SystemPrompt {
  promptHash: string;
  promptName: string;
  promptDescription: string;
  promptType: string;
  refPromptKey: string;
  accessLevel: 'system' | 'cohort' | 'user';
  userRoleCohortHash?: string;
  parentPromptHash?: string | null;
}

export interface PromptVersionsState {
  versions: SystemPrompt[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  selectedVersionHash: string;
}

export interface AccessiblePromptsState {
  prompts: SystemPrompt[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  itemsPerPage: number;
  promptTypes: string;
  total: number;
}

export interface LatestPromptVersionState {
  prompt: SystemPrompt | null;
  loading: boolean;
  error: string | null;
  parentPromptHash: string;
}

export interface FetchedPromptState {
  contentByHash: {
    [promptHash: string]: {
      promptContent: string;
      promptDescription: string;
      promptHash: string;
      promptName: string;
      promptType: string;
      refPromptKey: string;
    };
  };
  loadingHash: string | null;
  error: string | null;
}

export interface PromptConfigurationState {
  // Legacy system
  prompts: PromptData;
  promptKeys: string[];
  selectedPrompt: string;
  systemPrompt: string;

  // New API system
  systemPrompts: SystemPrompt[];
  versions: PromptVersionsState;
  accessiblePrompts: AccessiblePromptsState;
  latestVersion: LatestPromptVersionState;
  fetchedPrompt: FetchedPromptState;

  // Loading & error states
  loading: boolean;
  forkLoading: boolean;
  createPromptLoading: boolean;
  deletePromptLoading: boolean;
  systemPromptsLoading: boolean;
  error: string | null;

  // User context
  userId: string;
  cohortId: string;
  selectedPromptType: string;
  lastFetchTime: number;
}

const initialVersionsState: PromptVersionsState = {
  versions: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  selectedVersionHash: '',
};

const initialAccessiblePromptsState: AccessiblePromptsState = {
  prompts: [],
  loading: false,
  error: null,
  currentPage: 1,
  itemsPerPage: 10,
  promptTypes: '',
  total: 0,
};

const initialLatestVersionState: LatestPromptVersionState = {
  prompt: null,
  loading: false,
  error: null,
  parentPromptHash: '',
};

const initialFetchedPromptState: FetchedPromptState = {
  contentByHash: {},
  loadingHash: null,
  error: null,
};

const initialState: PromptConfigurationState = {
  prompts: {},
  promptKeys: [],
  selectedPrompt: 'smart_healthcare',
  systemPrompt: 'No data available',
  systemPrompts: [],
  versions: initialVersionsState,
  accessiblePrompts: initialAccessiblePromptsState,
  latestVersion: initialLatestVersionState,
  fetchedPrompt: initialFetchedPromptState,
  loading: true,
  forkLoading: false,
  createPromptLoading: false,
  deletePromptLoading: false,
  systemPromptsLoading: false,
  error: null,
  userId: '',
  cohortId: '',
  selectedPromptType: '',
  lastFetchTime: 0,
};

// Helper function to normalize keys
const normalizeKey = (key: string) => key.toLowerCase();

// Helper function to sanitize markdown
const sanitizeForMarkdown = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\_/g, '_')
    .replace(/<\s*\/\s*([\w-]+)\s*>/g, '&lt;/$1&gt;')
    .replace(/<\s*([\w-]+)\s*>/g, '&lt;$1&gt;')
    .replace(/<\s*\/\s*([\w-]+)\s*>/g, '``</$1>``')
    .replace(/<\s*([\w-]+)\s*>/g, '``<$1>``')
    .replace(/\n\d+\.\s*\n/g, (match) => match.replace(/\n/g, ' '))
    .trim();
};

// Process prompts helper
const processPrompts = (prompts: string | object): [PromptData, string[]] => {
  const defaultPrompts: PromptData = {};
  let processedPrompts = prompts;

  console.log('processPrompts - input:', prompts);
  console.log('processPrompts - input type:', typeof prompts);

  if (typeof prompts === 'string') {
    try {
      processedPrompts = JSON.parse(prompts);
      console.log('processPrompts - parsed JSON:', processedPrompts);
    } catch (e) {
      console.error('Failed to parse prompts string, returning empty:', e);
      console.error('Problematic string:', prompts);
      return [{}, []];
    }
  }

  if (typeof processedPrompts === 'object' && processedPrompts !== null) {
    const keys = Object.keys(processedPrompts);
    console.log('processPrompts - object keys:', keys);

    keys.forEach((key) => {
      const value = (processedPrompts as Record<string, string>)[key];
      defaultPrompts[normalizeKey(key)] = value;
      console.log(
        `processPrompts - processing key: ${key}, normalized: ${normalizeKey(key)}, value length: ${value?.length || 0}`
      );
    });
  }

  console.log('processPrompts - final defaultPrompts:', defaultPrompts);
  console.log('processPrompts - final keys:', Object.keys(defaultPrompts));
  console.log(
    'processPrompts - first prompt preview:',
    Object.keys(defaultPrompts).length > 0
      ? defaultPrompts[Object.keys(defaultPrompts)[0]]?.substring(0, 100)
      : 'N/A'
  );
  return [defaultPrompts, Object.keys(defaultPrompts)];
};

// Fetch all prompts - Uses GET_GLOBAL_COHORT_PROMPTS from configuration_queries.ts
// Then uses READ_PROMPTS_FROM_PATH to read actual prompt data from blob URL
export const fetchPrompts = createAsyncThunk(
  'promptConfiguration/fetchPrompts',
  async ({ userId, cohortId }: { userId: number; cohortId: number }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    // Step 1: Get the blob URL/path from GET_GLOBAL_COHORT_PROMPTS
    const result = await client.query({
      query: GET_GLOBAL_COHORT_PROMPTS,
      variables: {
        user_id: userId,
        cohort_id: cohortId,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    const defaultPrompts =
      result?.data?.global_prompts?.get_global_prompts?.default_prompts;

    console.log('fetchPrompts - received defaultPrompts:', defaultPrompts);
    console.log('fetchPrompts - defaultPrompts type:', typeof defaultPrompts);

    // If no defaultPrompts returned, return empty (don't break the page)
    if (!defaultPrompts) {
      console.error('No default prompts or blob URL found');
      return { prompts: {}, promptKeys: [] };
    }

    // Step 2: Parse the defaultPrompts JSON to get the mapping of prompt names to blob URLs
    let promptUrlMapping: Record<string, string>;

    try {
      if (typeof defaultPrompts === 'string') {
        promptUrlMapping = JSON.parse(defaultPrompts);
      } else if (typeof defaultPrompts === 'object') {
        promptUrlMapping = defaultPrompts as Record<string, string>;
      } else {
        console.error('Unexpected defaultPrompts type:', typeof defaultPrompts);
        return { prompts: {}, promptKeys: [] };
      }
    } catch (error) {
      console.error('Failed to parse defaultPrompts:', error);
      return { prompts: {}, promptKeys: [] };
    }

    console.log('Parsed prompt URL mapping:', promptUrlMapping);
    console.log(
      'Number of prompts to fetch:',
      Object.keys(promptUrlMapping).length
    );

    // Step 3: Fetch actual prompt content from each blob URL in parallel
    const promptEntries = Object.entries(promptUrlMapping);
    const actualPrompts: Record<string, string> = {};

    // Fetch all prompts in parallel
    const fetchPromises = promptEntries.map(async ([promptKey, blobUrl]) => {
      console.log(`\n🔄 Fetching prompt: ${promptKey}`);
      console.log(`   URL: ${blobUrl}`);

      try {
        const blobResult = await client.query({
          query: READ_PROMPTS_FROM_PATH,
          variables: {
            path: blobUrl,
          },
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
          fetchPolicy: 'network-only',
        });

        console.log(
          `📦 Raw response for ${promptKey}:`,
          JSON.stringify(blobResult, null, 2)
        );

        const promptContent =
          blobResult?.data?.global_prompts?.read_prompts_from_path
            ?.default_prompts;

        console.log(
          `📝 Extracted promptContent for ${promptKey}:`,
          promptContent
        );
        console.log(
          `📊 Content type: ${typeof promptContent}, length: ${promptContent?.length || 0}`
        );

        if (promptContent) {
          console.log(`✅ Successfully fetched ${promptKey}`);

          // Parse the content if it's a JSON string to extract system_prompt
          let finalContent = promptContent;
          if (typeof promptContent === 'string') {
            try {
              const parsed = JSON.parse(promptContent);
              console.log(
                `🔍 Parsed JSON for ${promptKey}:`,
                Object.keys(parsed)
              );
              // The content might have a system_prompt field, or be the prompt itself
              finalContent = parsed.system_prompt || promptContent;
              console.log(
                `   ✓ Extracted system_prompt from ${promptKey}, length: ${finalContent.length}`
              );
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (parseError) {
              // If parsing fails, use as-is
              console.log(
                `   ⚠️ JSON parse failed for ${promptKey}, using raw content`
              );
              finalContent = promptContent;
            }
          } else if (
            typeof promptContent === 'object' &&
            promptContent.system_prompt
          ) {
            // If it's already an object with system_prompt
            finalContent = promptContent.system_prompt;
            console.log(`   ✓ Used system_prompt from object for ${promptKey}`);
          }

          console.log(
            `✨ Final content for ${promptKey}, length: ${finalContent?.length || 0}`
          );
          return { key: promptKey, content: finalContent };
        } else {
          console.error(
            `❌ No content received for ${promptKey} from ${blobUrl}`
          );
          console.error(`   Full response:`, blobResult);
          return null;
        }
      } catch (error) {
        console.error(`❌ Error fetching ${promptKey}:`);
        console.error(`   Error details:`, error);
        if (error instanceof Error) {
          console.error(`   Error message:`, error.message);
          console.error(`   Error stack:`, error.stack);
        }
        return null;
      }
    });

    const results = await Promise.all(fetchPromises);

    // Collect successfully fetched prompts
    results.forEach((result) => {
      if (result) {
        const normalizedKey = normalizeKey(result.key);
        // Store in the expected format: JSON string with system_prompt field
        actualPrompts[normalizedKey] = JSON.stringify({
          system_prompt: result.content,
        });
        console.log(
          `  Stored ${normalizedKey} with content length:`,
          result.content.length
        );
      }
    });

    console.log(
      'All prompts fetched. Total successful:',
      Object.keys(actualPrompts).length
    );

    // If no prompts were fetched successfully, return empty
    if (Object.keys(actualPrompts).length === 0) {
      console.warn('No prompts were successfully fetched from blob storage');
      return { prompts: {}, promptKeys: [] };
    }

    console.log(
      'About to process prompts, actualPrompts keys:',
      Object.keys(actualPrompts)
    );
    console.log('actualPrompts type:', typeof actualPrompts);

    // actualPrompts already has normalized keys and the content is in the values
    // Just need to return them as-is
    const promptKeys = Object.keys(actualPrompts);

    console.log('Final prompts:', actualPrompts);
    console.log('Final promptKeys:', promptKeys);
    console.log('Total prompts:', promptKeys.length);

    return { prompts: actualPrompts, promptKeys };
  }
);

// Read prompts from path - Uses READ_PROMPTS_FROM_PATH from configuration_queries.ts
export const readPromptQuery = createAsyncThunk(
  'promptConfiguration/readPromptQuery',
  async ({ path }: { path: string }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    // Use Apollo Client with READ_PROMPTS_FROM_PATH query
    const result = await client.query({
      query: READ_PROMPTS_FROM_PATH,
      variables: {
        path: path,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    const defaultPrompts =
      result?.data?.global_prompts?.read_prompts_from_path?.default_prompts;

    if (!defaultPrompts) {
      return { prompts: {}, promptKeys: [] };
    }

    const [prompts, promptKeys] = processPrompts(defaultPrompts);
    return { prompts, promptKeys };
  }
);

// Create new prompt - Uses CREATE_GLOBAL_PROMPTS_MUTATION from configuration_mutation.ts
export const createPrompt = createAsyncThunk(
  'promptConfiguration/createPrompt',
  async ({
    promptKey,
    promptContent,
  }: {
    promptKey: string;
    promptContent: string;
  }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const normalizedKey = normalizeKey(promptKey);
    const prompts = {
      [normalizedKey]: JSON.stringify({
        system_prompt: sanitizeForMarkdown(promptContent),
      }),
    };

    // Use Apollo Client with existing GraphQL mutation
    const result = await client.mutate({
      mutation: CREATE_GLOBAL_PROMPTS_MUTATION,
      variables: { prompts },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (!result.data?.global_prompts?.create_global_prompts) {
      throw new Error('Failed to create prompt');
    }

    return { success: true };
  }
);

// Update existing prompt - Uses UPDATE_GLOBAL_PROMPTS_MUTATION from configuration_mutation.ts
export const updatePrompt = createAsyncThunk(
  'promptConfiguration/updatePrompt',
  async ({
    promptKey,
    promptContent,
  }: {
    promptKey: string;
    promptContent: string;
  }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const normalizedKey = normalizeKey(promptKey);
    const prompts = {
      [normalizedKey]: JSON.stringify({
        system_prompt: sanitizeForMarkdown(promptContent),
      }),
    };

    // Use Apollo Client with existing GraphQL mutation
    const result = await client.mutate({
      mutation: UPDATE_GLOBAL_PROMPTS_MUTATION,
      variables: { prompts },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (!result.data?.global_prompts?.update_global_prompts) {
      throw new Error('Failed to update prompt');
    }

    return { success: true };
  }
);

// Delete prompt - Uses DELETE_GLOBAL_PROMPTS_MUTATION from configuration_mutation.ts
export const deletePrompt = createAsyncThunk(
  'promptConfiguration/deletePrompt',
  async ({ fileName }: { fileName: string }) => {
    const token =
      localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) throw new Error('No authentication token found.');

    const normalizedKey = normalizeKey(fileName);

    // Use Apollo Client with existing GraphQL mutation
    const result = await client.mutate({
      mutation: DELETE_GLOBAL_PROMPTS_MUTATION,
      variables: { file_name: normalizedKey },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    if (result.data?.global_prompts?.delete_global_prompt === undefined) {
      throw new Error('Failed to delete prompt');
    }

    return { success: true };
  }
);

// ============================================================================
// NEW API - ASYNC THUNKS FOR NEW PROMPT SYSTEM
// ============================================================================

// Fetch system prompts using GET_PROMPTS query
export const fetchSystemPrompts = createAsyncThunk(
  'promptConfiguration/fetchSystemPrompts',
  async () => {
    const accessToken = localStorage.getItem('access_token');
    const selectionToken = localStorage.getItem('selection_token');
    const token = localStorage.getItem('token');
    const authToken = accessToken || selectionToken || token;

    if (!authToken) {
      throw new Error('No authentication token found.');
    }

    const result = await client.query({
      query: GET_PROMPTS,
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    let prompts = result?.data?.getPrompts;
    if (!prompts) {
      prompts = result?.data?.MyQuery || result?.data?.get_prompts || [];
    }

    if (!Array.isArray(prompts)) {
      return { systemPrompts: [] };
    }

    return { systemPrompts: prompts };
  }
);

// Fetch prompt versions using getPromptVersions API
export const fetchPromptVersions = createAsyncThunk(
  'promptConfiguration/fetchPromptVersions',
  async ({
    parentPromptHash,
    page = 1,
    itemsPerPage = 10,
  }: {
    parentPromptHash: string;
    page?: number;
    itemsPerPage?: number;
  }) => {
    const accessToken = localStorage.getItem('access_token');
    const selectionToken = localStorage.getItem('selection_token');
    const token = localStorage.getItem('token');
    const authToken = accessToken || selectionToken || token;

    if (!authToken) {
      throw new Error('No authentication token found.');
    }

    const result = await client.query({
      query: GET_PROMPT_VERSIONS,
      variables: {
        parentPromptHash,
        page,
        itemsPerPage,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    let versions = result?.data?.getPromptVersions;
    if (!versions) {
      versions = [];
    }

    if (!Array.isArray(versions)) {
      return { versions: [] };
    }

    const sortedVersions = [...versions].reverse();
    return { versions: sortedVersions };
  }
);

// Fetch accessible prompts by types - FIRST API to call
// Retrieves template (parent) prompts only, filtered by type and access level
export const fetchAccessiblePromptsByTypes = createAsyncThunk(
  'promptConfiguration/fetchAccessiblePromptsByTypes',
  async ({
    promptTypes,
    page = 1,
    itemsPerPage = 10,
  }: {
    promptTypes: string | string[];
    page?: number;
    itemsPerPage?: number;
  }) => {
    const accessToken = localStorage.getItem('access_token');
    const selectionToken = localStorage.getItem('selection_token');
    const token = localStorage.getItem('token');
    const authToken = accessToken || selectionToken || token;

    if (!authToken) {
      throw new Error('No authentication token found.');
    }

    let promptTypesArray: string[];
    if (typeof promptTypes === 'string') {
      promptTypesArray = promptTypes
        .split(',')
        .map((type) => type.trim())
        .filter((type) => type.length > 0);
    } else {
      promptTypesArray = promptTypes;
    }

    if (promptTypesArray.length === 0) {
      throw new Error('At least one prompt type is required.');
    }

    const result = await client.query({
      query: GET_ACCESSIBLE_PROMPTS_BY_TYPES,
      variables: {
        promptTypes: promptTypesArray,
        page,
        itemsPerPage,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    let prompts = result?.data?.getAccessiblePromptsByTypes;
    if (!prompts) {
      prompts = [];
    }

    if (!Array.isArray(prompts)) {
      return { prompts: [], total: 0 };
    }

    return { prompts, total: prompts.length };
  }
);

// Fetch latest prompt version - Get the most recent version of a prompt
// Returns a single prompt record (the latest version or template if no versions exist)
export const fetchLatestPromptVersion = createAsyncThunk(
  'promptConfiguration/fetchLatestPromptVersion',
  async ({ parentPromptHash }: { parentPromptHash: string }) => {
    const accessToken = localStorage.getItem('access_token');
    const selectionToken = localStorage.getItem('selection_token');
    const token = localStorage.getItem('token');
    const authToken = accessToken || selectionToken || token;

    if (!authToken) {
      throw new Error('No authentication token found.');
    }

    const result = await client.query({
      query: GET_LATEST_PROMPT_VERSION,
      variables: {
        parentPromptHash,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
      fetchPolicy: 'network-only',
    });

    const prompt = result?.data?.getLatestPromptVersion;

    if (!prompt) {
      return { prompt: null };
    }

    return { prompt };
  }
);

// Create prompt API - Uses new CREATE_PROMPT mutation from prompt_mutations.ts
export const createPromptAPI = createAsyncThunk(
  'promptConfiguration/createPromptAPI',
  async ({
    promptName,
    promptDescription,
    promptType,
    promptContent,
    accessLevel,
    parentPromptHash,
  }: {
    promptName: string;
    promptDescription: string;
    promptType: string;
    promptContent: string;
    accessLevel: 'system' | 'cohort' | 'user';
    parentPromptHash?: string | null;
  }) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('selection_token') ||
      localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found. Please log in first.');
    }

    const input = {
      promptName,
      promptDescription,
      promptType,
      promptContent: sanitizeForMarkdown(promptContent),
      accessLevel,
      parentPromptHash: parentPromptHash || null,
    };

    try {
      const result = await client.mutate({
        mutation: CREATE_PROMPT,
        variables: { input },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const { prompt } = result.data?.createPrompt || {};
      if (!prompt) {
        throw new Error('No prompt data returned from API');
      }

      return {
        prompt,
        success: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create prompt via API');
    }
  }
);

// Fork prompt API - Creates a new version of an existing prompt
export const forkPromptAPI = createAsyncThunk(
  'promptConfiguration/forkPromptAPI',
  async ({
    parentPromptHash,
    promptContent,
  }: {
    parentPromptHash: string;
    promptContent: string;
  }) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('selection_token') ||
      localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found. Please log in first.');
    }

    const input = {
      parentPromptHash,
      promptContent: sanitizeForMarkdown(promptContent),
    };

    try {
      const result = await client.mutate({
        mutation: FORK_PROMPT,
        variables: { input },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      const { prompt } = result.data?.forkPrompt || {};
      if (!prompt) {
        throw new Error('No prompt data returned from fork API');
      }

      return {
        prompt,
        success: true,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fork prompt via API');
    }
  }
);

// GET_PROMPT_BY_HASH Async Thunk
export const getPromptByHashAPI = createAsyncThunk(
  'promptConfiguration/getPromptByHashAPI',
  async ({
    promptHash,
    label = 'latest',
  }: {
    promptHash: string;
    label?: string;
  }) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('selection_token') ||
      localStorage.getItem('token');

    if (!token) {
      throw new Error('No authentication token found. Please log in first.');
    }

    const { GET_PROMPT_BY_HASH } = await import(
      '@/graphql/configuration_queries'
    );

    try {
      const result = await client.query({
        query: GET_PROMPT_BY_HASH,
        variables: {
          promptHash,
          label,
        },
        fetchPolicy: 'network-only',
      });

      if (result.errors && result.errors.length > 0) {
        const errorMsg = result.errors
          .map((e: { message: string }) => e.message)
          .join(', ');
        throw new Error(`API Error: ${errorMsg}`);
      }

      const { getPromptByHash: promptData } = result.data;

      if (!promptData) {
        throw new Error('Prompt not found');
      }

      return {
        success: true,
        prompt: promptData,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch prompt by hash');
    }
  }
);

const promptConfigurationSlice = createSlice({
  name: 'promptConfiguration',
  initialState,
  reducers: {
    setSelectedPrompt: (state, action: PayloadAction<string>) => {
      state.selectedPrompt = normalizeKey(action.payload);
      const normalizedKey = normalizeKey(action.payload);
      const value = state.prompts[normalizedKey];

      if (value) {
        try {
          const parsed = JSON.parse(value);
          const content = parsed.system_prompt || JSON.stringify(parsed);
          state.systemPrompt = sanitizeForMarkdown(content);
        } catch {
          state.systemPrompt = sanitizeForMarkdown(value);
        }
      }
    },
    setSystemPrompt: (state, action: PayloadAction<string>) => {
      state.systemPrompt = action.payload;
    },
    setUserData: (
      state,
      action: PayloadAction<{ userId: string; cohortId: string }>
    ) => {
      state.userId = action.payload.userId;
      state.cohortId = action.payload.cohortId;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSystemPrompts: (state) => {
      state.systemPrompts = [];
      state.selectedPromptType = '';
      state.versions.versions = [];
      state.accessiblePrompts.prompts = [];
    },
    setSelectedPromptType: (state, action: PayloadAction<string>) => {
      state.selectedPromptType = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.versions.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.versions.itemsPerPage = action.payload;
    },
    setSelectedVersionHash: (state, action: PayloadAction<string>) => {
      state.versions.selectedVersionHash = action.payload;
    },
    clearVersionsError: (state) => {
      state.versions.error = null;
    },
    setAccessiblePromptsPage: (state, action: PayloadAction<number>) => {
      state.accessiblePrompts.currentPage = action.payload;
    },
    setAccessiblePromptsItemsPerPage: (
      state,
      action: PayloadAction<number>
    ) => {
      state.accessiblePrompts.itemsPerPage = action.payload;
    },
    setAccessiblePromptsTypes: (state, action: PayloadAction<string>) => {
      state.accessiblePrompts.promptTypes = action.payload;
    },
    clearAccessiblePromptsError: (state) => {
      state.accessiblePrompts.error = null;
    },
    resetState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch prompts
      .addCase(fetchPrompts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrompts.fulfilled, (state, action) => {
        console.log('=== fetchPrompts.fulfilled - Updating Redux State ===');
        console.log('Payload prompts:', action.payload.prompts);
        console.log('Payload promptKeys:', action.payload.promptKeys);

        state.loading = false;
        state.prompts = action.payload.prompts;
        state.promptKeys = action.payload.promptKeys;
        state.lastFetchTime = Date.now();

        console.log('Redux state updated - prompts:', state.prompts);
        console.log('Redux state updated - promptKeys:', state.promptKeys);

        // Set default selected prompt
        const normalizedSelected = normalizeKey(state.selectedPrompt);
        if (!action.payload.promptKeys.includes(normalizedSelected)) {
          const defaultKey = action.payload.promptKeys.includes(
            'smart_healthcare'
          )
            ? 'smart_healthcare'
            : action.payload.promptKeys.length > 0
              ? action.payload.promptKeys[0]
              : '';
          state.selectedPrompt = defaultKey;
          console.log('Selected default prompt:', defaultKey);

          if (defaultKey) {
            const value = action.payload.prompts[defaultKey];
            console.log(
              `Setting systemPrompt for defaultKey: ${defaultKey}, value:`,
              value
            );
            if (value) {
              try {
                const parsed = JSON.parse(value);
                const content = parsed.system_prompt || JSON.stringify(parsed);
                state.systemPrompt = sanitizeForMarkdown(content);
                console.log(
                  'systemPrompt set (from parsed):',
                  state.systemPrompt.substring(0, 100) + '...'
                );
              } catch {
                state.systemPrompt = sanitizeForMarkdown(value);
                console.log(
                  'systemPrompt set (from value):',
                  state.systemPrompt.substring(0, 100) + '...'
                );
              }
            }
          }
        } else {
          const value = action.payload.prompts[normalizedSelected];
          console.log(
            `Using existing selected prompt: ${normalizedSelected}, value:`,
            value
          );
          if (value) {
            try {
              const parsed = JSON.parse(value);
              const content = parsed.system_prompt || JSON.stringify(parsed);
              state.systemPrompt = sanitizeForMarkdown(content);
              console.log(
                'systemPrompt set (from parsed):',
                state.systemPrompt.substring(0, 100) + '...'
              );
            } catch {
              state.systemPrompt = sanitizeForMarkdown(value);
              console.log(
                'systemPrompt set (from value):',
                state.systemPrompt.substring(0, 100) + '...'
              );
            }
          }
        }
      })
      .addCase(fetchPrompts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch prompts';
      })
      // Read prompt query
      .addCase(readPromptQuery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(readPromptQuery.fulfilled, (state, action) => {
        state.loading = false;
        state.prompts = action.payload.prompts;
        state.promptKeys = action.payload.promptKeys;
        state.lastFetchTime = Date.now();

        // Set default selected prompt
        const normalizedSelected = normalizeKey(state.selectedPrompt);
        if (!action.payload.promptKeys.includes(normalizedSelected)) {
          const defaultKey = action.payload.promptKeys.includes(
            'smart_healthcare'
          )
            ? 'smart_healthcare'
            : action.payload.promptKeys.length > 0
              ? action.payload.promptKeys[0]
              : '';
          state.selectedPrompt = defaultKey;

          if (defaultKey) {
            const value = action.payload.prompts[defaultKey];
            if (value) {
              try {
                const parsed = JSON.parse(value);
                const content = parsed.system_prompt || JSON.stringify(parsed);
                state.systemPrompt = sanitizeForMarkdown(content);
              } catch {
                state.systemPrompt = sanitizeForMarkdown(value);
              }
            }
          }
        } else {
          const value = action.payload.prompts[normalizedSelected];
          if (value) {
            try {
              const parsed = JSON.parse(value);
              const content = parsed.system_prompt || JSON.stringify(parsed);
              state.systemPrompt = sanitizeForMarkdown(content);
            } catch {
              state.systemPrompt = sanitizeForMarkdown(value);
            }
          }
        }
      })
      .addCase(readPromptQuery.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to read prompts from path';
      })
      // Create prompt
      .addCase(createPrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPrompt.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createPrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create prompt';
      })
      // Update prompt
      .addCase(updatePrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePrompt.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updatePrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update prompt';
      })
      // Delete prompt
      .addCase(deletePrompt.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePrompt.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deletePrompt.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete prompt';
      })
      // New API - Fetch System Prompts
      .addCase(fetchSystemPrompts.pending, (state) => {
        state.systemPromptsLoading = true;
        state.error = null;
      })
      .addCase(fetchSystemPrompts.fulfilled, (state, action) => {
        state.systemPromptsLoading = false;
        state.systemPrompts = action.payload.systemPrompts;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchSystemPrompts.rejected, (state, action) => {
        state.systemPromptsLoading = false;
        state.error = action.error.message || 'Failed to fetch system prompts';
      })
      // Fetch Prompt Versions
      .addCase(fetchPromptVersions.pending, (state) => {
        state.versions.loading = true;
        state.versions.error = null;
      })
      .addCase(fetchPromptVersions.fulfilled, (state, action) => {
        state.versions.loading = false;
        state.versions.versions = action.payload.versions;
      })
      .addCase(fetchPromptVersions.rejected, (state, action) => {
        state.versions.loading = false;
        state.versions.error =
          action.error.message || 'Failed to fetch versions';
      })
      // Fetch Accessible Prompts By Types
      .addCase(fetchAccessiblePromptsByTypes.pending, (state) => {
        state.accessiblePrompts.loading = true;
        state.accessiblePrompts.error = null;
      })
      .addCase(fetchAccessiblePromptsByTypes.fulfilled, (state, action) => {
        state.accessiblePrompts.loading = false;
        state.accessiblePrompts.prompts = action.payload.prompts;
        state.accessiblePrompts.total = action.payload.total;
      })
      .addCase(fetchAccessiblePromptsByTypes.rejected, (state, action) => {
        state.accessiblePrompts.loading = false;
        state.accessiblePrompts.error =
          action.error.message || 'Failed to fetch accessible prompts';
      })
      // Fetch Latest Prompt Version
      .addCase(fetchLatestPromptVersion.pending, (state) => {
        state.latestVersion.loading = true;
        state.latestVersion.error = null;
      })
      .addCase(fetchLatestPromptVersion.fulfilled, (state, action) => {
        state.latestVersion.loading = false;
        state.latestVersion.prompt = action.payload.prompt;
      })
      .addCase(fetchLatestPromptVersion.rejected, (state, action) => {
        state.latestVersion.loading = false;
        state.latestVersion.error =
          action.error.message || 'Failed to fetch latest version';
      })
      // Create Prompt API
      .addCase(createPromptAPI.pending, (state) => {
        state.createPromptLoading = true;
        state.error = null;
      })
      .addCase(createPromptAPI.fulfilled, (state, action) => {
        state.createPromptLoading = false;
        const { prompt } = action.payload;
        if (prompt) {
          state.fetchedPrompt.contentByHash[prompt.promptHash] = {
            promptContent: '',
            promptDescription: prompt.promptDescription,
            promptHash: prompt.promptHash,
            promptName: prompt.promptName,
            promptType: prompt.promptType,
            refPromptKey: prompt.refPromptKey,
          };
        }
      })
      .addCase(createPromptAPI.rejected, (state, action) => {
        state.createPromptLoading = false;
        state.error = action.error.message || 'Failed to create prompt';
      })
      // Fork Prompt API
      .addCase(forkPromptAPI.pending, (state) => {
        state.forkLoading = true;
        state.error = null;
      })
      .addCase(forkPromptAPI.fulfilled, (state, action) => {
        state.forkLoading = false;
        const { prompt } = action.payload;
        if (prompt) {
          state.fetchedPrompt.contentByHash[prompt.promptHash] = {
            promptContent: '',
            promptDescription: prompt.promptDescription,
            promptHash: prompt.promptHash,
            promptName: prompt.promptName,
            promptType: prompt.promptType,
            refPromptKey: prompt.refPromptKey,
          };
        }
      })
      .addCase(forkPromptAPI.rejected, (state, action) => {
        state.forkLoading = false;
        state.error = action.error.message || 'Failed to fork prompt';
      })
      // Get Prompt By Hash API
      .addCase(getPromptByHashAPI.pending, (state, action) => {
        const promptHash = (action.meta.arg as { promptHash: string })
          .promptHash;
        state.fetchedPrompt.loadingHash = promptHash;
        state.fetchedPrompt.error = null;
      })
      .addCase(getPromptByHashAPI.fulfilled, (state, action) => {
        const promptHash = (action.meta.arg as { promptHash: string })
          .promptHash;
        state.fetchedPrompt.loadingHash = null;
        if (action.payload.prompt) {
          state.fetchedPrompt.contentByHash[promptHash] = action.payload.prompt;
          state.systemPrompt = sanitizeForMarkdown(
            action.payload.prompt.promptContent
          );
        }
      })
      .addCase(getPromptByHashAPI.rejected, (state, action) => {
        state.fetchedPrompt.loadingHash = null;
        const errorMsg =
          action.error.message || 'Failed to fetch prompt by hash';
        state.fetchedPrompt.error = errorMsg;
      });
  },
});

export const {
  setSelectedPrompt,
  setSystemPrompt,
  setUserData,
  clearError,
  clearSystemPrompts,
  setSelectedPromptType,
  setCurrentPage,
  setItemsPerPage,
  setSelectedVersionHash,
  clearVersionsError,
  setAccessiblePromptsPage,
  setAccessiblePromptsItemsPerPage,
  setAccessiblePromptsTypes,
  clearAccessiblePromptsError,
  resetState,
} = promptConfigurationSlice.actions;

// ============================================================================
// SELECTORS
// ============================================================================

// Prompts selectors
export const selectPrompts = (state: RootState) =>
  state.promptConfiguration.prompts;

export const selectPromptKeys = (state: RootState) =>
  state.promptConfiguration.promptKeys;

export const selectSelectedPrompt = (state: RootState) =>
  state.promptConfiguration.selectedPrompt;

export const selectSystemPrompt = (state: RootState) =>
  state.promptConfiguration.systemPrompt;

export const selectPromptLoading = (state: RootState) =>
  state.promptConfiguration.loading;

export const selectPromptError = (state: RootState) =>
  state.promptConfiguration.error;

// System Prompts selectors
export const selectSystemPrompts = (state: RootState) =>
  state.promptConfiguration.systemPrompts;

export const selectSystemPromptsLoading = (state: RootState) =>
  state.promptConfiguration.systemPromptsLoading;

// Versions selectors
export const selectPromptVersions = (state: RootState) =>
  state.promptConfiguration.versions.versions;

export const selectVersionsLoading = (state: RootState) =>
  state.promptConfiguration.versions.loading;

export const selectVersionsError = (state: RootState) =>
  state.promptConfiguration.versions.error;

export const selectCurrentPage = (state: RootState) =>
  state.promptConfiguration.versions.currentPage;

export const selectItemsPerPage = (state: RootState) =>
  state.promptConfiguration.versions.itemsPerPage;

export const selectSelectedVersionHash = (state: RootState) =>
  state.promptConfiguration.versions.selectedVersionHash;

// Accessible Prompts selectors
export const selectAccessiblePrompts = (state: RootState) =>
  state.promptConfiguration.accessiblePrompts.prompts;

export const selectAccessiblePromptsLoading = (state: RootState) =>
  state.promptConfiguration.accessiblePrompts.loading;

export const selectAccessiblePromptsError = (state: RootState) =>
  state.promptConfiguration.accessiblePrompts.error;

export const selectAccessiblePromptsTotal = (state: RootState) =>
  state.promptConfiguration.accessiblePrompts.total;

// Latest Version selectors
export const selectLatestPromptVersion = (state: RootState) =>
  state.promptConfiguration.latestVersion.prompt;

export const selectLatestVersionLoading = (state: RootState) =>
  state.promptConfiguration.latestVersion.loading;

export const selectLatestVersionError = (state: RootState) =>
  state.promptConfiguration.latestVersion.error;

// Fetched Prompt selectors
export const selectFetchedPromptByHash =
  (promptHash: string) => (state: RootState) =>
    state.promptConfiguration.fetchedPrompt.contentByHash[promptHash];

export const selectFetchedPromptLoading = (state: RootState) =>
  state.promptConfiguration.fetchedPrompt.loadingHash;

export const selectFetchedPromptContent = (state: RootState) =>
  state.promptConfiguration.fetchedPrompt.contentByHash;

export const selectFetchedPromptLoadingHash = (state: RootState) =>
  state.promptConfiguration.fetchedPrompt.loadingHash;

export const selectFetchedPromptError = (state: RootState) =>
  state.promptConfiguration.fetchedPrompt.error;

export const selectCurrentVersionPage = (state: RootState) =>
  state.promptConfiguration.versions.currentPage;

export const selectVersionsItemsPerPage = (state: RootState) =>
  state.promptConfiguration.versions.itemsPerPage;

// Loading state selectors
export const selectCreatePromptLoading = (state: RootState) =>
  state.promptConfiguration.createPromptLoading;

export const selectForkPromptLoading = (state: RootState) =>
  state.promptConfiguration.forkLoading;

export const selectDeletePromptLoading = (state: RootState) =>
  state.promptConfiguration.deletePromptLoading;

// User context selectors
export const selectUserId = (state: RootState) =>
  state.promptConfiguration.userId;

export const selectCohortId = (state: RootState) =>
  state.promptConfiguration.cohortId;

export const selectSelectedPromptType = (state: RootState) =>
  state.promptConfiguration.selectedPromptType;

// Convenience selector for checking if any operation is in progress
export const selectPromptConfigurationLoading = (state: RootState) => {
  const pc = state.promptConfiguration;
  return (
    pc.loading ||
    pc.systemPromptsLoading ||
    pc.versions.loading ||
    pc.accessiblePrompts.loading ||
    pc.latestVersion.loading ||
    pc.createPromptLoading ||
    pc.forkLoading ||
    pc.deletePromptLoading
  );
};

export default promptConfigurationSlice.reducer;
