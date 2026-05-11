import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($input: UsersInput!) {
    createUser(input: $input) {
      user {
        displayName
        emailId
        firstName
        lastName
        accountType
        isActive
        isLocked
        gender
        userLanguage
        dateOfBirth
        phoneNumber
        registeredLocation
        expiresAt
        authMethod
        userHash
        username
      }
      roleAssignments {
        roleHash
        roleName
        cohortHash
        cohortName
      }
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UsersUpdateInput!) {
    updateUser(input: $input) {
      accountType
      authMethod
      dateOfBirth
      displayName
      emailId
      expiresAt
      firstName
      gender
      isActive
      isLocked
      lastName
      phoneNumber
      registeredLocation
      userLanguage
      userHash
      username
    }
  }
`;

export const SELF_UPDATE_USER = gql`
  mutation SelfUpdateUser($input: UsersUpdateInput!) {
    selfUpdateUser(input: $input) {
      accountType
      authMethod
      dateOfBirth
      displayName
      emailId
      expiresAt
      firstName
      gender
      isActive
      isLocked
      lastName
      phoneNumber
      registeredLocation
      userLanguage
      userHash
      username
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($userHash: String!, $orgCohortHash: String!) {
    deleteUser(userHash: $userHash, orgCohortHash: $orgCohortHash)
  }
`;

export const GET_USERS = gql`
  query GetUsers(
    $orgCohortHash: String!
    $page: Int = 1
    $itemsPerPage: Int = 10
    $sortBy: String = "created_at"
    $sortOrder: String = "desc"
    $filters: UsersFilterInput
  ) {
    getUsers(
      orgCohortHash: $orgCohortHash
      page: $page
      itemsPerPage: $itemsPerPage
      sortBy: $sortBy
      sortOrder: $sortOrder
      filters: $filters
    ) {
      users {
        user {
          displayName
          emailId
          firstName
          lastName
          accountType
          isActive
          isLocked
          authMethod
          dateOfBirth
          gender
          expiresAt
          phoneNumber
          registeredLocation
          userLanguage
          userHash
          username
        }
        roleAssignments {
          userRoleCohortHash
          roleHash
          roleName
          cohortHash
          cohortName
        }
      }
      totalCount
      page
      itemsPerPage
      hasNext
    }
  }
`;

export const GET_ORG_MODELS = gql`
  query GetOrgModels {
    getOrgModels {
      modelHash
      modelName
      modelType
    }
  }
`;

export const GET_ROLES = gql`
  query GetRoles(
    $page: Int = 1
    $itemsPerPage: Int = 10
    $sortBy: String = ""
    $sortOrder: String = ""
    $filters: RolesFilterInput
  ) {
    getRoles(
      page: $page
      itemsPerPage: $itemsPerPage
      sortBy: $sortBy
      sortOrder: $sortOrder
      filters: $filters
    ) {
      roles {
        roleHash
        roleName
        accessLevel
        parentRoleHash
        description
      }
      page
      itemsPerPage
      totalCount
      hasNext
    }
  }
`;

export const GET_ORG_COHORTS = gql`
  query GetOrgCohorts(
    $page: Int = 1
    $itemsPerPage: Int = 10
    $filters: OrgCohortFilterInput
  ) {
    getOrgCohorts(page: $page, itemsPerPage: $itemsPerPage, filters: $filters) {
      orgCohorts {
        orgCohortHash
        orgCohortName
        isRoot
        createdAt
        updatedAt
      }
      page
      itemsPerPage
      totalCount
      hasNext
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    auth {
      login(input: { username: $username, password: $password }) {
        token
        user {
          username
          roles
          account_type
          display_name
          email_id
          first_name
          last_name
          user_hash
          cohort_id
          user_id
        }
        token_type
      }
    }
  }
`;

export const GET_USER_PROFILE = gql`
  query GetUserProfile($username: String!) {
    users {
      fetch_data_by_filters_users(input_json: { username: $username }) {
        users {
          user_id
          first_name
          last_name
          gender
          user_language
          date_of_birth
          email_id
          phone_number
          registered_location
        }
      }
    }
  }
`;

export const ADMIN_ASSIGN_ROLE_TO_USER = gql`
  mutation AdminAssignRoleToUser($input: AdminUserRolesInput!) {
    adminAssignRoleToUser(input: $input) {
      userRoleCohortHash
      userHash
      username
      roleHash
      roleName
    }
  }
`;

export const REMOVE_ROLE_FROM_USER = gql`
  mutation RemoveRoleFromUser($userRoleCohortHash: String!) {
    removeRoleFromUser(userRoleCohortHash: $userRoleCohortHash)
  }
`;

export interface RolesFilterInput {
  roleName?: string;
  searchTerm?: string;
}
