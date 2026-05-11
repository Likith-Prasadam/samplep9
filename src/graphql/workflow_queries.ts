import { gql } from '@apollo/client';

// ============================================================================
// PROMPT QUERIES
// ============================================================================

/**
 * Get accessible prompts filtered by types (categories)
 * @param types - Array of prompt types: 'system', 'user', 'events_list'
 * @param access_level - Optional access level filter
 */
export const GET_ACCESSIBLE_PROMPTS_BY_TYPES = gql`
  query GetAccessiblePromptsByTypes($types: [String!]!, $accessLevel: String) {
    prompts {
      getAccessiblePromptsByTypes(types: $types, accessLevel: $accessLevel) {
        refPromptKey
        promptName
        promptCategory
        accessLevel
        createdBy
        createdAt
        updatedAt
        isActive
        latestVersion {
          promptId
          promptHash
          versionNumber
          createdAt
        }
      }
    }
  }
`;

/**
 * Get all versions of a specific prompt template
 * @param ref_prompt_key - The stable reference key for the prompt template
 */
export const GET_PROMPT_VERSIONS = gql`
  query GetPromptVersions(
    $parentPromptHash: String!
    $itemsPerPage: Int
    $page: Int
  ) {
    getPromptVersions(
      parentPromptHash: $parentPromptHash
      itemsPerPage: $itemsPerPage
      page: $page
    ) {
      promptHash
      promptName
      promptType
      promptDescription
      parentPromptHash
    }
  }
`;

/**
 * Get the latest version of a specific prompt template
 * @param ref_prompt_key - The stable reference key for the prompt template
 */
export const GET_LATEST_PROMPT_VERSION = gql`
  query GetLatestPromptVersion($ref_prompt_key: String!) {
    prompts {
      getLatestPromptVersion(ref_prompt_key: $ref_prompt_key) {
        prompt_id
        prompt_hash
        version_number
        prompt_content
        created_by
        created_at
        metadata
      }
    }
  }
`;

/**
 * Get prompt details by hash
 * @param prompt_hash - The hash identifier for a specific prompt version
 */
export const GET_PROMPT_BY_HASH = gql`
  query GetPromptByHash($promptHash: String!) {
    getPromptByHash(promptHash: $promptHash) {
      promptHash
      promptName
      promptType
      promptContent
      promptDescription
    }
  }
`;

/**
 * Get prompt details by hash - for live configuration
 * Returns prompt content and metadata for display
 * @param promptHash - The hash identifier for a specific prompt version
 */
export const GET_PROMPT_DETAILS_BY_HASH = gql`
  query MyQuery($promptHash: String!) {
    getPromptByHash(promptHash: $promptHash) {
      promptContent
      promptDescription
      promptHash
      promptName
      promptType
      refPromptKey
    }
  }
`;

// ============================================================================
// PROCESS QUERIES
// ============================================================================

/**
 * Get catalog of available processes/workflows
 * @param access_level - Optional access level filter
 */
export const GET_PROCESS_CATALOG = gql`
  query GetProcessCatalog {
    getProcessCatalog {
      orgProcessHash
      orgProcessName
      orgProcessType
    }
  }
`;

/**
 * Get detailed process information including required models and prompts
 * @param process_hash - The hash identifier for the process
 */
export const GET_PROCESS_WITH_MODELS = gql`
  query GetProcessWithModels($orgProcessHash: String!) {
    getProcessWithModels(orgProcessHash: $orgProcessHash) {
      orgProcessHash
      orgProcessName
      orgProcessType
      orgProcessDescription
      processParamSchema
      accessLevel
      accessibleModels {
        modelHash
        modelName
        modelType
        modelProvider
        modelIdentifier
        accessLevel
        modelDefaultParams
      }
      accessiblePrompts {
        promptHash
        promptName
        promptType
        promptDescription
        accessLevel
      }
    }
  }
`;

// ============================================================================
// MODEL QUERIES
// ============================================================================

/**
 * Get organization's available models
 * @param itemsPerPage - Number of items per page
 * @param includeDeleted - Whether to include deleted models
 * @param modelType - Optional filter by model type
 * @param page - Page number
 * @param accessLevel - Optional access level filter
 */
export const GET_ORG_MODELS = gql`
  query GetOrgModels(
    $itemsPerPage: Int
    $includeDeleted: Boolean
    $modelType: String
    $page: Int
    $accessLevel: String
  ) {
    getOrgModels(
      itemsPerPage: $itemsPerPage
      includeDeleted: $includeDeleted
      modelType: $modelType
      page: $page
      accessLevel: $accessLevel
    ) {
      modelHash
      modelIdentifier
      modelName
    }
  }
`;

/**
 * Get specific model details by hash
 * @param modelHash - The hash identifier for the model
 */
export const GET_ORG_MODEL_BY_HASH = gql`
  query GetOrgModelByHash($modelHash: String!) {
    getOrgModelByHash(modelHash: $modelHash) {
      modelHash
      modelName
      modelType
      modelIdentifier
      modelProvider
      modelDefaultParams
      baseUrl
      accessLevel
      apiKeyRef
    }
  }
`;

// ============================================================================
// CONFIGURATION QUERIES
// ============================================================================

/**
 * Get all process configurations for a specific camera
 * @param cam_hash - The hash identifier for the camera
 */
export const GET_CAM_PROCESS_CONFIGS = gql`
  query GetCamProcessConfigs($cam_hash: String!) {
    configurations {
      get_cam_process_configs(cam_hash: $cam_hash) {
        config_id
        cam_hash
        process_hash
        model_hash
        prompt_hashes {
          system_prompt_hash
          user_prompt_hash
          events_list_prompt_hash
        }
        parameters
        is_enabled
        created_by
        created_at
        updated_at
        process_details {
          process_name
          process_type
        }
        model_details {
          model_name
          model_type
        }
      }
    }
  }
`;

/**
 * Get all process configurations for a specific batch video
 * @param batch_hash - The hash identifier for the batch video
 */
export const GET_BATCH_PROCESS_CONFIGS = gql`
  query GetBatchProcessConfigs($batch_hash: String!) {
    configurations {
      get_batch_process_configs(batch_hash: $batch_hash) {
        config_id
        batch_hash
        process_hash
        model_hash
        prompt_hashes {
          system_prompt_hash
          user_prompt_hash
          events_list_prompt_hash
        }
        parameters
        is_enabled
        created_by
        created_at
        updated_at
        process_details {
          process_name
          process_type
        }
        model_details {
          model_name
          model_type
        }
      }
    }
  }
`;

/**
 * Get a specific camera process configuration
 * @param config_id - The configuration ID
 */
export const GET_CAM_PROCESS_CONFIG = gql`
  query GetCamProcessConfig($config_id: ID!) {
    configurations {
      get_cam_process_config(config_id: $config_id) {
        config_id
        cam_hash
        process_hash
        model_hash
        prompt_hashes {
          system_prompt_hash
          user_prompt_hash
          events_list_prompt_hash
        }
        parameters
        is_enabled
        created_by
        created_at
        updated_at
      }
    }
  }
`;

/**
 * Get a specific batch process configuration
 * @param config_id - The configuration ID
 */
export const GET_BATCH_PROCESS_CONFIG = gql`
  query GetBatchProcessConfig($config_id: ID!) {
    configurations {
      get_batch_process_config(config_id: $config_id) {
        config_id
        batch_hash
        process_hash
        model_hash
        prompt_hashes {
          system_prompt_hash
          user_prompt_hash
          events_list_prompt_hash
        }
        parameters
        is_enabled
        created_by
        created_at
        updated_at
      }
    }
  }
`;
