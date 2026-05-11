import { gql } from '@apollo/client';

// ============================================================================
// PROMPT MUTATIONS
// ============================================================================

/**
 * Create a new prompt template
 */
export const CREATE_PROMPT = gql`
  mutation CreatePrompt($input: PromptInput!) {
    prompts {
      createPrompt(input: $input) {
        prompt_id
        prompt_hash
        ref_prompt_key
        prompt_name
        prompt_category
        version_number
        created_at
      }
    }
  }
`;

/**
 * Fork an existing prompt to create a new version
 */
export const FORK_PROMPT = gql`
  mutation ForkPrompt($parent_prompt_id: ID!, $input: PromptInput!) {
    prompts {
      forkPrompt(parent_prompt_id: $parent_prompt_id, input: $input) {
        prompt_id
        prompt_hash
        ref_prompt_key
        version_number
        parent_prompt_id
        created_at
      }
    }
  }
`;

/**
 * Soft delete a prompt (marks as inactive)
 */
export const DELETE_PROMPT = gql`
  mutation DeletePrompt($prompt_id: ID!) {
    prompts {
      deletePrompt(prompt_id: $prompt_id) {
        success
        message
      }
    }
  }
`;

/**
 * Restore a soft-deleted prompt
 */
export const RESTORE_PROMPT = gql`
  mutation RestorePrompt($prompt_id: ID!) {
    prompts {
      restorePrompt(prompt_id: $prompt_id) {
        prompt_id
        prompt_hash
        is_active
      }
    }
  }
`;

// ============================================================================
// CAMERA CONFIGURATION MUTATIONS
// ============================================================================

/**
 * Create a new camera process configuration
 */
export const CREATE_CAM_PROCESS_CONFIG = gql`
  mutation CreateCamProcessConfig($input: CamProcessConfigCreateInput!) {
    createCamProcessConfig(input: $input) {
      camProcessConfigHash
      camHash
      orgProcessHash
      orgProcessName
      processConfig
      isEnabled
    }
  }
`;

/**
 * Update an existing camera process configuration
 */
export const UPDATE_CAM_PROCESS_CONFIG = gql`
  mutation UpdateCamProcessConfig(
    $config_id: ID!
    $input: CamProcessConfigInput!
  ) {
    configurations {
      update_cam_process_config(config_id: $config_id, input: $input) {
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
        updated_at
      }
    }
  }
`;

/**
 * Delete a camera process configuration
 */
export const DELETE_CAM_PROCESS_CONFIG = gql`
  mutation DeleteCamProcessConfig($config_id: ID!) {
    configurations {
      delete_cam_process_config(config_id: $config_id) {
        success
        message
      }
    }
  }
`;

/**
 * Toggle enable/disable status of a camera process configuration
 * DEPRECATED: Use TOGGLE_CAM_PROCESS_CONFIG from camera-process-config-queries.ts instead
 */
export const TOGGLE_CAM_PROCESS_CONFIG = gql`
  mutation ToggleCamProcessConfig($config_id: ID!, $enabled: Boolean!) {
    configurations {
      toggle_cam_process_config(config_id: $config_id, enabled: $enabled) {
        config_id
        is_enabled
        updated_at
      }
    }
  }
`;

// ============================================================================
// BATCH CONFIGURATION MUTATIONS
// ============================================================================

/**
 * Create a new batch process configuration
 */
export const CREATE_BATCH_PROCESS_CONFIG = gql`
  mutation CreateBatchProcessConfig($input: BatchProcessConfigInput!) {
    configurations {
      create_batch_process_config(input: $input) {
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
        created_at
      }
    }
  }
`;

/**
 * Update an existing batch process configuration
 */
export const UPDATE_BATCH_PROCESS_CONFIG = gql`
  mutation UpdateBatchProcessConfig(
    $config_id: ID!
    $input: BatchProcessConfigInput!
  ) {
    configurations {
      update_batch_process_config(config_id: $config_id, input: $input) {
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
        updated_at
      }
    }
  }
`;

/**
 * Delete a batch process configuration
 */
export const DELETE_BATCH_PROCESS_CONFIG = gql`
  mutation DeleteBatchProcessConfig($config_id: ID!) {
    configurations {
      delete_batch_process_config(config_id: $config_id) {
        success
        message
      }
    }
  }
`;

/**
 * Toggle enable/disable status of a batch process configuration
 */
export const TOGGLE_BATCH_PROCESS_CONFIG = gql`
  mutation ToggleBatchProcessConfig($config_id: ID!, $enabled: Boolean!) {
    configurations {
      toggle_batch_process_config(config_id: $config_id, enabled: $enabled) {
        config_id
        is_enabled
        updated_at
      }
    }
  }
`;
