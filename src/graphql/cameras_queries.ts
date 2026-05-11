import { gql } from '@apollo/client';

/**
 * GetCams Query
 * Fetches paginated list of cameras accessible to authenticated user.
 *
 * Access Control:
 * - ADMIN: Returns all cameras (optionally filtered by their cohort)
 * - USER: Returns only cameras in their cohort
 *
 * Supports cohort-scoped pagination with:
 * - cohortHash: Cohort hash used to scope accessible cameras
 * - page: Current page number (default: 1)
 * - itemsPerPage: Items per page (default: 10)
 */
export const GET_CAMS_QUERY = gql`
  query GetCams(
    $cohortHash: String!
    $page: Int = 1
    $itemsPerPage: Int = 10
    $sortBy: String = "created_at"
    $sortOrder: String = "desc"
    $filters: CamsFilterInput
  ) {
    getCams(
      cohortHash: $cohortHash
      page: $page
      itemsPerPage: $itemsPerPage
      sortBy: $sortBy
      sortOrder: $sortOrder
      filters: $filters
    ) {
      cams {
        camHash
        camName
        camStatus
        camResolution
        camTags
        camType
        camPlacementZone
        camCloudStreamId
        createdAt
        hlsExpiry
        hlsUrl
        camZipcode
        camPlacementZoneSlot
        camLongitude
        camLatitude
        camIp
        camCity
        camAddress1
        camPlacementSubzone
        userRoleCohortHash
        camFpsSourceRate
        camThumbnailPath
        camTags
      }
      page
      hasNext
      itemsPerPage
      totalCount
    }
  }
`;

/**
 * GetCamByHash Query
 * Fetches a single camera by its hash.
 *
 * Access Control:
 * - ADMIN: Can fetch any camera
 * - USER: Can only fetch cameras in their cohort
 */
export const GET_CAM_BY_HASH_QUERY = gql`
  query GetCamByHash($camHash: String!) {
    getCamByHash(camHash: $camHash) {
      camHash
      camName
      camStatus
      camResolution
      camIp
      camType
      camLatitude
      camLongitude
      camAddress1
      camCity
      camZipcode
      camPlacementZone
      camPlacementSubzone
      camPlacementZoneSlot
      camCloudStreamId
      camFpsSourceRate
      createdAt
      camThumbnailPath
      hlsExpiry
      hlsUrl
      userRoleCohortHash
      isDeleted
      camTags
    }
  }
`;

/**
 * Response type for GetCams query
 */
export interface CamsWithHLSType {
  camHash: string;
  camName: string;
  camStatus: string;
  camResolution?: string;
  // camTags?: string[];
  camType?: string;
  camPlacementZone?: string;
  camCloudStreamId?: string;
  camHlsUrl?: string;
  createdAt?: string;
  hlsExpiry?: string;
  hlsUrl?: string;
  camZipcode?: string;
  camPlacementZoneSlot?: string;
  camLongitude?: string;
  camLatitude?: string;
  camIp?: string;
  camCity?: string;
  camAddress1?: string;
  camPlacementSubzone?: string;
  userRoleCohortHash?: string;
  camFpsSourceRate?: string;
  camThumbnailPath?: string;
  camTags?: string[];
}

/**
 * Paginated response for GetCams query
 */
export interface CamsPaginatedResponse {
  cams: CamsWithHLSType[];
  totalCount: number;
  page: number;
  hasNext: boolean;
  itemsPerPage: number;
}

/**
 * Complete response structure for GET_CAMS_QUERY
 */
export interface GetCamsResponse {
  getCams: CamsPaginatedResponse;
}

/**
 * Single camera response for GET_CAM_BY_HASH_QUERY
 */
export interface GetCamByHashResponse {
  getCamByHash: CamsWithHLSType;
}

/**
 * Variables for GetCams query
 */
export interface GetCamsVariables {
  cohortHash: string;
  page?: number;
  itemsPerPage?: number;
  sortBy?: string;
  sortOrder?: string;
  filters?: CamsFilterInput;
}

export interface CamsFilterInput {
  camNames?: string[];
  camNamesContains?: string[];
  camHashes?: string[];
  camResolution?: string;
  camIps?: string[];
  camTypes?: string[];
  camTags?: string[];
  camLatitudes?: string[];
  camLongitudes?: string[];
  camAddresses?: string[];
  camAddressesContains?: string[];
  camCities?: string[];
  camZipcodes?: string[];
  camPlacementZones?: string[];
  camPlacementSubzones?: string[];
  camPlacementSubzonesContains?: string[];
}

/**
 * Variables for GetCamByHash query
 */
export interface GetCamByHashVariables {
  camHash: string;
}

export const GET_CAMS_PROCESSING_INFO_QUERY = gql`
  query GetCamsProcessingInfo($camHash: String!) {
    getCamsProcessingInfo(camHash: $camHash) {
      camera {
        camAddress1
        camCity
        camCloudStreamId
        camFpsSourceRate
        camHash
        camIp
        camLatitude
        camLongitude
        camName
        camPlacementSubzone
        camPlacementZone
        camPlacementZoneSlot
        camResolution
        camStatus
        camThumbnailPath
        camType
        camZipcode
        createdAt
        isDeleted
        userRoleCohortHash
      }
      processConfigs
    }
  }
`;

/**
 * Model type for processing configuration
 */
export interface ModelType {
  modelName: string;
  modelType: string;
  modelEndpoint: string;
}

/**
 * Prompt type for processing configuration
 */
export interface PromptType {
  promptContent: string;
  promptVersion: string;
}

/**
 * Process configuration metadata type
 */
export interface ProcessConfigMetadataType {
  processType: string;
  orgProcessHash: string;
  modelHash?: string;
  systemPromptHash?: string;
  userPromptHash?: string;
  eventsListPromptHash?: string;
  parameters?: Record<string, unknown>;
  isEnabled: boolean;
}

/**
 * Resolved process configuration type
 */
export interface ResolvedProcessConfigType {
  processType: string;
  model?: ModelType;
  systemPrompt?: PromptType;
  userPrompt?: PromptType;
  eventsListPrompt?: PromptType;
  parameters?: Record<string, unknown>;
}

/**
 * Process configuration with resolved type
 */
export interface ProcessConfigWithResolvedType {
  metadata: ProcessConfigMetadataType;
  resolved: ResolvedProcessConfigType;
}

/**
 * Camera processing info type
 */
export interface CamProcessingInfoType {
  camHash: string;
  camName: string;
  processConfigs: ProcessConfigWithResolvedType[];
}

/**
 * Response type for GetCamsProcessingInfo query
 */
export interface GetCamsProcessingInfoResponse {
  getCamsProcessingInfo: {
    camera: {
      camAddress1: string;
      camCity: string;
      camCloudStreamId: string;
      camFpsSourceRate: string;
      camHash: string;
      camIp: string;
      camLatitude: number;
      camLongitude: number;
      camName: string;
      camPlacementSubzone: string;
      camPlacementZone: string;
      camPlacementZoneSlot: string;
      camResolution: string;
      camStatus: string;
      camThumbnailPath: string;
      camType: string;
      camZipcode: string;
      createdAt: string;
      isDeleted: boolean;
      userRoleCohortHash: string;
    };
    processConfigs: Record<string, unknown>;
  };
}

/**
 * Variables for GetCamsProcessingInfo query
 */
export interface GetCamsProcessingInfoVariables {
  camHash: string;
}
