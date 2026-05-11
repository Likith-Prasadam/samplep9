import { gql } from '@apollo/client';

/**
 * Get all process configurations for a specific camera
 * @param camHash - The hash identifier for the camera
 */
export const GET_CAM_PROCESS_CONFIGS = gql`
  query GetCamProcessConfigs($cam_hash: String!) {
    getCamProcessConfigs(camHash: $cam_hash) {
      camProcessConfigHash
      isEnabled
      orgProcessHash
      orgProcessName
    }
  }
`;

/**
 * Get a specific camera process configuration with detailed settings
 * @param camProcessConfigHash - The configuration hash identifier
 */
export const GET_CAM_PROCESS_CONFIG = gql`
  query GetCamProcessConfig($cam_process_config_hash: String!) {
    getCamProcessConfig(camProcessConfigHash: $cam_process_config_hash) {
      camHash
      camProcessConfigHash
      isEnabled
      orgProcessHash
      orgProcessName
      processConfig
    }
  }
`;

/**
 * Get all process configurations for a camera (detailed version)
 */
export const GET_CAM_PROCESS_CONFIGS_DETAILED = gql`
  query GetCamProcessConfigsDetailed($cam_hash: String!) {
    getCamProcessConfigs(camHash: $cam_hash) {
      camProcessConfigHash
      isEnabled
      orgProcessHash
      orgProcessName
      processConfig
    }
  }
`;

/**
 * Update a camera process configuration
 * @param input - Update input with camProcessConfigHash, isEnabled, and processConfig
 */
export const UPDATE_CAM_PROCESS_CONFIG = gql`
  mutation UpdateCamProcessConfig($input: CamProcessConfigUpdateInput!) {
    updateCamProcessConfig(input: $input) {
      camHash
      orgProcessName
      processConfig
      camProcessConfigHash
      isEnabled
      orgProcessHash
    }
  }
`;

/**
 * Delete a camera process configuration
 * @param camProcessConfigHash - The configuration hash to delete
 */
export const DELETE_CAM_PROCESS_CONFIG = gql`
  mutation DeleteCamProcessConfig($cam_process_config_hash: String!) {
    deleteCamProcessConfig(camProcessConfigHash: $cam_process_config_hash)
  }
`;

/**
 * Toggle enable/disable status of a camera process configuration
 * @param camProcessConfigHash - The configuration hash to toggle
 * @param isEnabled - The new enabled status
 */
export const TOGGLE_CAM_PROCESS_CONFIG = gql`
  mutation ToggleCamProcessConfig(
    $camProcessConfigHash: String!
    $isEnabled: Boolean!
  ) {
    toggleCamProcessConfig(
      camProcessConfigHash: $camProcessConfigHash
      isEnabled: $isEnabled
    )
  }
`;
