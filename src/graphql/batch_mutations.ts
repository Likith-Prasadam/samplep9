import { gql } from '@apollo/client';

export const GET_BATCHES_VIDEOS = gql`
  query GetBatchVideos(
    $page: Int
    $itemsPerPage: Int
    $sortBy: String
    $sortOrder: String
    $filters: BatchFilterInput
  ) {
    getBatchVideos(
      page: $page
      itemsPerPage: $itemsPerPage
      sortBy: $sortBy
      sortOrder: $sortOrder
      filters: $filters
    ) {
      batches {
        batchHash
        batchName
        batchType
        batchTags
        batchStatus
        duration
        batchPlacementZone
        batchCloudStreamPath
        thumbnailPresignedUrl
        thumbnailPresignedUrlExpiry
        createdAt
        userRoleCohortHash
        videoPresignedUrl
        videoPresignedUrlExpiry
      }
      totalCount
      page
      itemsPerPage
      hasNext
      sort {
        by
        order
      }
    }
  }
`;

export const GET_PRESIGNED_URL = gql`
  query GetPresignedUrl {
    getBatchUploadPresignedUrl {
      batchHash
      batchVideoSourcePath
      presignedUrl
      presignedUrlExpiry
      thumbnail
    }
  }
`;

export const GET_PROCESS_CATALOG = gql`
  query GetProcessCatalog {
    getProcessCatalog {
      orgProcessHash
      orgProcessName
    }
  }
`;

export const GET_PROCESS_WITH_MODELS = gql`
  query GetProcessWithModels($orgProcessHash: String!) {
    getProcessWithModels(orgProcessHash: $orgProcessHash) {
      orgProcessHash
      orgProcessName
      processParamSchema
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

export const CREATE_BATCH = gql`
  mutation CreateBatch($input: BatchCreateInput!) {
    createBatch(input: $input) {
      batchHash
      batchName
      batchType
      batchTags
      batchStatus
      duration
      batchCloudStreamPath
      batchPlacementZone
      # batchCity
      # batchAddress1
      # batchFpsSourceRate
      # batchIp
      # batchLatitude
      # batchLongitude
      # batchPlacementSubzone
      # batchPlacementZoneSlot
      # batchThumbnailPath
      # batchZipcode
    }
  }
`;

export const GET_GLOBAL_PROMPTS = gql`
  query GetGlobalPrompts($cohort_id: Int!, $user_id: Int!) {
    global_prompts {
      get_global_prompts(cohort_id: $cohort_id, user_id: $user_id) {
        default_prompts
      }
    }
  }
`;

export const UPDATE_BATCH = gql`
  mutation UpdateBatch($input: BatchUpdateInput!) {
    updateBatch(input: $input) {
      batchHash
      batchName
      batchType
      batchStatus
      duration
    }
  }
`;

export const DELETE_BATCH = gql`
  mutation DeleteBatch($batchHash: String!) {
    deleteBatch(batchHash: $batchHash)
  }
`;

export const READ_PROMPTS_FROM_PATH = gql`
  query ReadPromptsFromPath($path: String!) {
    global_prompts {
      read_prompts_from_path(path: $path) {
        default_prompts
      }
    }
  }
`;

export const PROCESS_BATCH = gql`
  mutation ProcessBatch($batchHash: String!) {
    processBatch(batchHash: $batchHash) {
      batchId
      status
      message
      processingDetails
    }
  }
`;

export const GET_BATCH_PROCESS_CONFIGS = gql`
  query GetBatchProcessConfigs($batchHash: String!) {
    getBatchProcessConfigs(batchHash: $batchHash) {
      batchProcessConfigHash
      orgProcessHash
      orgProcessName
      isEnabled
    }
  }
`;

export const GET_BATCH_PROCESS_CONFIG = gql`
  query GetBatchProcessConfig($batchProcessConfigHash: String!) {
    getBatchProcessConfig(batchProcessConfigHash: $batchProcessConfigHash) {
      batchProcessConfigHash
      batchHash
      orgProcessHash
      orgProcessName
      processConfig
      isEnabled
    }
  }
`;

export const CREATE_BATCH_PROCESS_CONFIG = gql`
  mutation CreateBatchProcessConfig($input: BatchProcessConfigCreateInput!) {
    createBatchProcessConfig(input: $input) {
      batchProcessConfigHash
      batchHash
      orgProcessHash
      orgProcessName
      processConfig
      isEnabled
    }
  }
`;

export const UPDATE_BATCH_PROCESS_CONFIG = gql`
  mutation UpdateBatchProcessConfig($input: BatchProcessConfigUpdateInput!) {
    updateBatchProcessConfig(input: $input) {
      batchProcessConfigHash
      processConfig
      isEnabled
    }
  }
`;

export const TOGGLE_BATCH_PROCESS_CONFIG = gql`
  mutation ToggleBatchProcessConfig(
    $batchProcessConfigHash: String!
    $isEnabled: Boolean!
  ) {
    toggleBatchProcessConfig(
      batchProcessConfigHash: $batchProcessConfigHash
      isEnabled: $isEnabled
    )
  }
`;

export const DELETE_BATCH_PROCESS_CONFIG = gql`
  mutation DeleteBatchProcessConfig($batchProcessConfigHash: String!) {
    deleteBatchProcessConfig(batchProcessConfigHash: $batchProcessConfigHash)
  }
`;

export const CREATE_BATCH_EVENT = gql`
  mutation CreateBatchEvent($input: BatchEventCreateInput!) {
    createBatchEvent(input: $input) {
      eventHash
      eventTitle
      eventType
    }
  }
`;

export const GET_BATCH_EVENTS = gql`
  query GetBatchEvents(
    $page: Int
    $itemsPerPage: Int
    $sortBy: String
    $sortOrder: String
    $filters: BatchEventFilterInput
  ) {
    getBatchEvents(
      page: $page
      itemsPerPage: $itemsPerPage
      sortBy: $sortBy
      sortOrder: $sortOrder
      filters: $filters
    ) {
      events {
        eventHash
        eventTitle
        eventType
        eventDescription
        eventRead
        batchChunkHash
        createdAt
        chunkDuration
        chunkStartTime
        chunkEndTime
        chunkOffset
        chunkPresignedUrl
      }
      totalCount
      page
      itemsPerPage
      hasNext
      sort {
        by
        order
      }
    }
  }
`;

export const GET_BATCH_TRANSCRIPTS = gql`
  query GetBatchTranscripts($batchHash: String!) {
    getBatchTranscripts(batchHash: $batchHash) {
      transcripts {
        content
        chunkHash
        batchProcessConfigHash
        endTime
        orgProcessHash
        orgProcessName
        startTime
      }
      createdAt
      batchProcessingStatus
      batchName
      batchHash
    }
  }
`;

export const GET_BATCH_SYSTEM_PROMPT = gql`
  query GetBatchSystemPrompt(
    $batch_id: Int!
    $cohort_id: Int!
    $user_id: Int!
  ) {
    batch_chat {
      get_batch_system_prompt(
        batch_id: $batch_id
        cohort_id: $cohort_id
        user_id: $user_id
      ) {
        content
      }
    }
  }
`;

export const DEBUG_BATCH_INPUT = gql`
  query DebugBatchInput {
    __type(name: "BatchInput") {
      name
      fields {
        name
        type {
          name
        }
      }
    }
  }
`;

export const GET_PROMPT_VERSIONS = gql`
  query GetPromptVersions(
    $parentPromptHash: String!
    $page: Int
    $itemsPerPage: Int
  ) {
    getPromptVersions(
      parentPromptHash: $parentPromptHash
      page: $page
      itemsPerPage: $itemsPerPage
    ) {
      promptHash
      promptName
      promptDescription
      promptType
      accessLevel
      userRoleCohortHash
    }
  }
`;

export const GET_PROMPT_BY_HASH = gql`
  query GetPromptByHash($promptHash: String!) {
    getPromptByHash(promptHash: $promptHash) {
      promptHash
      promptName
      promptDescription
      promptContent
      promptType
    }
  }
`;

export const UPDATE_ALL_BATCH_EVENTS_READ_STATUS = gql`
  mutation UpdateAllBatchEventsReadStatus($readStatus: Boolean!) {
    updateAllBatchEventsReadStatus(readStatus: $readStatus)
  }
`;

export const GET_BATCH_FILTER_VALUES = gql`
  query GetBatchFilterValues {
    getBatchFilterValues {
      batchTypes
      batchTags
      batchCities
      batchZipcodes
      batchPlacementZones
    }
  }
`;

export interface BatchFilterValues {
  batchTypes: string[];
  batchTags: string[];
  batchCities: string[];
  batchZipcodes: string[];
  batchPlacementZones: string[];
}

export interface GetBatchFilterValuesResponse {
  getBatchFilterValues: BatchFilterValues;
}

export const GET_BATCH_INSIGHTS = gql`
  query GetBatchInsights($batchHash: String!) {
    getBatchInsights(batchHash: $batchHash) {
      ... on YoloInsights {
        __typename
        batchHash
        batchId
        timingMetrics
        annotationConfig
        videoInfo {
          durationSeconds
          fps
          inputType
          inputUri
          outputJsonPresignedUrl
          outputS3VideoUri
          outputS3JsonUri
          outputVideoPresignedUrl
          processUuid
          processedAt
          processingTimeSeconds
          totalFrames
          videoHeight
          videoWidth
        }
        classCounts
        modeClassCounts
        totalChunksProcessed
        totalObjectsDetected
        modeTotalObjectsDetected
        boundingBoxes
        videoPresignedUrls
        videoPresignedUrlExpirations
      }
      ... on PpeAstecInsights {
        __typename
        batchHash
        batchId
        timingMetrics
        annotationConfig
        videoInfo {
          durationSeconds
          fps
          inputType
          inputUri
          outputJsonPresignedUrl
          outputS3VideoUri
          outputS3JsonUri
          outputVideoPresignedUrl
          processUuid
          processedAt
          processingTimeSeconds
          videoHeight
          totalFrames
          videoWidth
        }
        totalChunksProcessed
        uniqueCounts
        modePersonsPerFrame
        perPersonPpeSummary
        ppeSummary
        boundingBoxes
        videoPresignedUrls
        videoPresignedUrlExpirations
      }
    }
  }
`;
