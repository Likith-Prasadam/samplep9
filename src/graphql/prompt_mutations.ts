import { gql } from '@apollo/client';

/**
 * CREATE_PROMPT Mutation
 * Creates a new prompt template and registers it in Langfuse and the database.
 */
export const CREATE_PROMPT = gql`
  mutation CreatePrompt($input: PromptInput!) {
    createPrompt(input: $input) {
      prompt {
        promptHash
        promptName
        promptDescription
        promptType
        refPromptKey
        accessLevel
        userRoleCohortHash
        parentPromptHash
      }
      success
      message
    }
  }
`;

/**
 * FORK_PROMPT Mutation
 * Creates a new version of an existing prompt.
 */
export const FORK_PROMPT = gql`
  mutation ForkPrompt($input: PromptForkInput!) {
    forkPrompt(input: $input) {
      prompt {
        promptHash
        promptName
        promptDescription
        promptType
        refPromptKey
        parentPromptHash
        accessLevel
        userRoleCohortHash
      }
      success
      message
    }
  }
`;

/**
 * GET_PROMPT_VERSIONS Query
 * Retrieves paginated prompt versions for a given parent prompt.
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
      accessLevel
      parentPromptHash
      promptDescription
      promptHash
      promptName
      promptType
      refPromptKey
      userRoleCohortHash
    }
  }
`;

/**
 * GET_ACCESSIBLE_PROMPTS_BY_TYPES Query
 * Retrieves template (parent) prompts by type(s), filtered by user access level.
 */
export const GET_ACCESSIBLE_PROMPTS_BY_TYPES = gql`
  query GetAccessiblePromptsByTypes(
    $promptTypes: [String!]!
    $itemsPerPage: Int
    $page: Int
  ) {
    getAccessiblePromptsByTypes(
      promptTypes: $promptTypes
      itemsPerPage: $itemsPerPage
      page: $page
    ) {
      accessLevel
      parentPromptHash
      promptDescription
      promptHash
      promptName
      promptType
      refPromptKey
      userRoleCohortHash
    }
  }
`;

/**
 * GET_LATEST_PROMPT_VERSION Query
 * Retrieves the latest/most recent version of a prompt.
 */
export const GET_LATEST_PROMPT_VERSION = gql`
  query GetLatestPromptVersion($parentPromptHash: String!) {
    getLatestPromptVersion(parentPromptHash: $parentPromptHash) {
      accessLevel
      parentPromptHash
      promptDescription
      promptHash
      promptName
      promptType
      refPromptKey
      userRoleCohortHash
    }
  }
`;

/**
 * DELETE_PROMPT Mutation
 * Soft-deletes a prompt with splice-delete model.
 */
export const DELETE_PROMPT = gql`
  mutation DeletePrompt($promptHash: String!) {
    deletePrompt(promptHash: $promptHash) {
      success
      message
    }
  }
`;

/**
 * RESTORE_PROMPT Mutation
 * Restores a soft-deleted prompt and all its descendants.
 */
export const RESTORE_PROMPT = gql`
  mutation RestorePrompt($promptHash: String!) {
    restorePrompt(promptHash: $promptHash) {
      success
      message
    }
  }
`;
