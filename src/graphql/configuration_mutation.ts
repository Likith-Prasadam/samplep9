import { gql } from '@apollo/client';

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

export const CREATE_GLOBAL_PROMPTS_MUTATION = gql`
  mutation MyMutation($prompts: JSON!) {
    global_prompts {
      create_global_prompts(prompts: $prompts) {
        default_prompts
      }
    }
  }
`;

export const UPDATE_GLOBAL_PROMPTS_MUTATION = gql`
  mutation MyMutation($prompts: JSON!) {
    global_prompts {
      update_global_prompts(prompts: $prompts) {
        default_prompts
      }
    }
  }
`;

export const DELETE_GLOBAL_PROMPTS_MUTATION = gql`
  mutation MyMutation($file_name: String!) {
    global_prompts {
      delete_global_prompt(file_name: $file_name)
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
