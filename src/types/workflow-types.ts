/**
 * Workflow Type Definitions for SPECTRA Configuration System
 *
 * This file contains all TypeScript types for:
 * - Prompts and versioning
 * - Processes and workflows
 * - Models
 * - Configurations
 */

// ============================================================================
// PROMPT TYPES
// ============================================================================

/**
 * Prompt category types
 */
export type PromptCategory = 'system' | 'user' | 'events_list';

/**
 * Access level types
 */
export type AccessLevel = 'public' | 'organization' | 'private';

/**
 * Prompt template - The stable reference for a prompt with multiple versions
 */
export interface PromptTemplate {
  ref_prompt_key: string;
  prompt_name: string;
  prompt_category: PromptCategory;
  access_level: AccessLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  latest_version?: PromptVersion;
}

/**
 * Prompt version - A specific version of a prompt template
 */
export interface PromptVersion {
  prompt_id: string;
  prompt_hash: string;
  ref_prompt_key?: string;
  prompt_name?: string;
  prompt_category?: PromptCategory;
  version_number: number;
  prompt_content: string;
  created_by: string;
  created_at: string;
  is_latest: boolean;
  parent_prompt_id?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Input for creating a new prompt
 */
export interface PromptInput {
  prompt_name: string;
  prompt_category: PromptCategory;
  prompt_content: string;
  access_level?: AccessLevel;
  metadata?: Record<string, unknown>;
}

/**
 * Prompt hashes for configuration
 */
export interface PromptHashes {
  system_prompt_hash?: string;
  user_prompt_hash?: string;
  events_list_prompt_hash?: string;
}

// ============================================================================
// PROCESS TYPES
// ============================================================================

/**
 * Process/Workflow type
 */
export type ProcessType =
  | 'event_detection'
  | 'object_tracking'
  | 'anomaly_detection'
  | 'classification'
  | 'custom';

/**
 * Process catalog item
 */
export interface Process {
  process_hash: string;
  process_name: string;
  process_type: ProcessType;
  description: string;
  access_level: AccessLevel;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Backend process catalog item (matches API response)
 */
export interface BackendProcess {
  orgProcessHash: string;
  orgProcessName: string;
  orgProcessType: ProcessType;
  accessLevel?: AccessLevel;
}

/**
 * Backend process with models (matches API response)
 */
export interface AccessibleModel {
  modelHash: string;
  modelName: string;
  modelType: string;
  modelProvider: string;
  accessLevel: AccessLevel;
}

export interface AccessiblePrompt {
  promptHash: string;
  promptName: string;
  promptType: PromptCategory;
  promptDescription?: string;
  accessLevel: AccessLevel;
}

/**
 * Backend process with models (matches API response)
 */
export interface BackendProcessWithModels extends BackendProcess {
  accessibleModels: AccessibleModel[];
  accessiblePrompts: AccessiblePrompt[];
  processParamSchema: ParameterSchema;
}

/**
 * Detailed process with requirements
 */
export interface ProcessWithModels extends Process {
  required_model_types: string[];
  required_prompt_types: PromptCategory[];
  parameter_schema?: ParameterSchema;
  accessible_models: Model[];
  accessible_prompts: PromptTemplate[];
}

/**
 * Parameter schema for dynamic form generation
 */
export interface ParameterSchema {
  type: 'object';
  properties: Record<string, ParameterField>;
  required?: string[];
}

/**
 * Individual parameter field definition
 */
export interface ParameterField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title?: string;
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  items?: ParameterField;
  properties?: Record<string, ParameterField>;
}

// ============================================================================
// MODEL TYPES
// ============================================================================

/**
 * Model type categories
 */
export type ModelType = 'vision' | 'text' | 'multimodal' | 'embedding';

/**
 * Model provider
 */
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'custom';

/**
 * Model definition
 */
export interface Model {
  model_hash: string;
  model_name: string;
  model_type: ModelType;
  provider: ModelProvider;
  access_level: AccessLevel;
  is_active: boolean;
  capabilities?: string[];
  parameters?: Record<string, unknown>;
  parameter_schema?: ParameterSchema;
  created_at: string;
  updated_at?: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Base configuration interface
 */
export interface BaseProcessConfig {
  config_id: string;
  process_hash: string;
  model_hash: string;
  prompt_hashes: PromptHashes;
  parameters?: Record<string, unknown>;
  is_enabled: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Camera process configuration
 */
export interface CameraProcessConfig extends BaseProcessConfig {
  cam_hash: string;
  process_details?: {
    process_name: string;
    process_type: ProcessType;
  };
  model_details?: {
    model_name: string;
    model_type: ModelType;
  };
}

/**
 * Batch process configuration
 */
export interface BatchProcessConfig extends BaseProcessConfig {
  batch_hash: string;
  process_details?: {
    process_name: string;
    process_type: ProcessType;
  };
  model_details?: {
    model_name: string;
    model_type: ModelType;
  };
}

/**
 * Input for creating camera configuration
 */
export interface CamProcessConfigInput {
  cam_hash: string;
  process_hash: string;
  model_hash: string;
  prompt_hashes: PromptHashes;
  parameters?: Record<string, unknown>;
  is_enabled?: boolean;
}

/**
 * Input for creating batch configuration
 */
export interface BatchProcessConfigInput {
  batch_hash: string;
  process_hash: string;
  model_hash: string;
  prompt_hashes: PromptHashes;
  parameters?: Record<string, unknown>;
  is_enabled?: boolean;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

/**
 * Configuration builder form state
 */
export interface ConfigurationFormState {
  process?: Process;
  selectedModel?: Model;
  selectedPrompts: {
    system?: PromptVersion;
    user?: PromptVersion;
    events_list?: PromptVersion;
  };
  parameters: Record<string, unknown>;
  targetType: 'camera' | 'batch';
  targetHash?: string;
  isEnabled: boolean;
}

/**
 * Target entity for configuration
 */
export interface TargetEntity {
  hash: string;
  name: string;
  type: 'camera' | 'batch';
  metadata?: Record<string, unknown>;
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Configuration validation result
 */
export interface ConfigurationValidation {
  isValid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic mutation response
 */
export interface MutationResponse {
  success: boolean;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Prompt filter options
 */
export interface PromptFilters {
  categories?: PromptCategory[];
  access_level?: AccessLevel;
  search?: string;
  is_active?: boolean;
}

/**
 * Process filter options
 */
export interface ProcessFilters {
  process_types?: ProcessType[];
  access_level?: AccessLevel;
  search?: string;
  is_active?: boolean;
}

/**
 * Model filter options
 */
export interface ModelFilters {
  model_types?: ModelType[];
  providers?: ModelProvider[];
  access_level?: AccessLevel;
  search?: string;
  is_active?: boolean;
}

// ============================================================================
// GOVERNANCE TYPES
// ============================================================================

/**
 * Prompt usage check result
 */
export interface PromptUsageCheck {
  is_used: boolean;
  active_configurations: Array<{
    config_id: string;
    entity_name: string;
    entity_type: 'camera' | 'batch';
  }>;
}

/**
 * Role-based permissions
 */
export interface WorkflowPermissions {
  can_create_prompts: boolean;
  can_fork_prompts: boolean;
  can_delete_prompts: boolean;
  can_create_configurations: boolean;
  can_edit_configurations: boolean;
  can_delete_configurations: boolean;
}
