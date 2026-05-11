export interface PromptDisplayRef {
  getEditedContent: () => string;
}

export interface PromptData {
  [key: string]: string;
}

// Legacy interface (keep for backward compatibility)
export interface CreatePromptFormValues {
  promptKey: string;
  promptContent: string;
}

// New API interfaces
export interface PromptInput {
  promptName: string;
  promptDescription: string;
  promptType: string; // Format: org_process/model_role/prompt_category
  promptContent: string;
  accessLevel: 'system' | 'cohort' | 'user';
  parentPromptHash?: string | null; // Optional for versioning
}

export interface Prompt {
  promptHash: string; // External identifier (UUID-like)
  promptName: string;
  promptDescription: string;
  promptType: string;
  refPromptKey: string; // Single Source of Truth key
  accessLevel: 'system' | 'cohort' | 'user';
  userRoleCohortHash?: string;
  parentPromptHash?: string | null;
}

export interface CreatePromptResponse {
  prompt: Prompt;
  success: boolean;
  message: string;
}

export interface PromptForkInput {
  parentPromptHash: string;
  promptContent: string;
  tags?: string[];
}

export interface GetAccessiblePromptsResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  limit: number;
}

export interface GetPromptVersionsResponse {
  prompts: Prompt[];
  success: boolean;
  message: string;
}

export interface GetLatestPromptVersionResponse {
  prompt: Prompt;
  success: boolean;
  message: string;
}

export interface DeletePromptResponse {
  success: boolean;
  message: string;
}

export interface RestorePromptResponse {
  success: boolean;
  message: string;
}
