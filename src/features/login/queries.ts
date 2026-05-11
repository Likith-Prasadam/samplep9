import { gql } from '@apollo/client';

export const LOGIN_QUERY = gql`
  query Login($username: String!, $password: String!, $timezone: String!) {
    login(
      input: { username: $username, password: $password, timezone: $timezone }
    ) {
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

export const ROLE_SPECIFIC_LOGIN_QUERY = gql`
  query RoleSpecificLogin($userRoleCohortHash: String!) {
    roleSpecificLogin(userRoleCohortHash: $userRoleCohortHash) {
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

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken($token: String!, $timezone: String!) {
    refresh_token(input: { token: $token, timezone: $timezone }) {
      token
      expires_in
    }
  }
`;

export const SELECT_CONTEXT_MUTATION = gql`
  mutation SelectContext($userRoleId: Int!) {
    auth {
      select_context(input: { user_role_id: $userRoleId }) {
        token
        expires_in
        token_type
        user_role_id
        role_name
        cohort_id
        category_id
      }
    }
  }
`;

export const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT ||
  'https://spectra-dev-backend.p9sphere.com/graphql';
