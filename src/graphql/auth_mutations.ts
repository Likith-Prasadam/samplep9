import { gql } from '@apollo/client';

export const SWITCH_ASSIGNMENT = gql`
  mutation SwitchAssignment($userRoleCohortHash: String!) {
    switchAssignment(userRoleCohortHash: $userRoleCohortHash) {
      token
      userHash
      userRoleCohortHash
      tokenType
      expiresIn
      requiresSelection
      userRoleCohortList
    }
  }
`;

export const GET_USER_ROLE_ASSIGNMENTS = gql`
  query GetUserRoleAssignments {
    user {
      user_role_cohort_list {
        user_role_cohort_hash
        role
        cohort
      }
    }
  }
`;
