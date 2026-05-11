import { gql } from '@apollo/client';

// Event Configuration Queries
export const GET_EVENTS = gql`
  query GetEvents($input_json: EventsInput!) {
    events {
      fetch_data_by_filters_events(input_json: $input_json) {
        id
        event_name
        user_id
        cohort_id
      }
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent($input_json: EventsInput!) {
    events {
      create_event(input_json: $input_json) {
        id
        event_name
        created_at
        updated_at
        user_id
        cohort_id
      }
    }
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent($input_json: EventsInput!) {
    events {
      update_event(input_json: $input_json) {
        id
        event_name
        created_at
        updated_at
        user_id
        cohort_id
      }
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($event_id: Int!) {
    events {
      soft_delete_event(event_id: $event_id) {
        event_name
      }
    }
  }
`;

export const GET_GLOBAL_COHORT_PROMPTS = gql`
  query MyQuery($cohort_id: Int!, $user_id: Int!) {
    global_prompts {
      get_global_prompts(cohort_id: $cohort_id, user_id: $user_id) {
        default_prompts
      }
    }
  }
`;

// GraphQL operations
export const FETCH_COHORT_PARAMS = gql`
  query FetchCohortParams {
    org_cohorts {
      fetch_data_by_filters_orgcohorts(input_json: {}) {
        org_cohorts {
          cohort_model_params
          id
        }
      }
    }
  }
`;

export const UPDATE_COHORT_PARAMS = gql`
  mutation UpdateCohortParams($input_json: OrgCohortInput!) {
    org_cohorts {
      update_org_cohort(input_json: $input_json) {
        id
        cohort_model_params
      }
    }
  }
`;

/**
 * GET_PROMPTS Query
 * Fetches all prompts for all access levels: system, cohort, and user
 */
export const GET_PROMPTS = gql`
  query GetAllPrompts {
    getPrompts(
      accessLevel: null
      includeDeleted: false
      itemsPerPage: 100
      page: 1
    ) {
      accessLevel
      parentPromptHash
      promptDescription
      promptHash
      promptName
      refPromptKey
      userRoleCohortHash
      promptType
    }
  }
`;

/**
 * GET_PROMPT_BY_HASH Query
 * Fetches a prompt by its hash and returns its metadata along with optional prompt content.
 */
export const GET_PROMPT_BY_HASH = gql`
  query GetPromptByHash($promptHash: String!, $label: String) {
    getPromptByHash(promptHash: $promptHash, label: $label) {
      promptContent
      promptDescription
      promptHash
      promptName
      promptType
      refPromptKey
    }
  }
`;

// Updated mutation to use the proper input type
