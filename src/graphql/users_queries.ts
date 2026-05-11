import { gql } from '@apollo/client';

export const GET_USERS_QUERY = gql`
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
          username
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
          userHash
          userLanguage
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
export interface UsersFilterInput {
  username?: string;
  emailId?: string;
  accountType?: string;
  isActive?: boolean;
  isLocked?: boolean;
  lastLoginIp?: string;
  searchTerm?: string;
}

export interface GetUserData {
  userHash: string;
  username: string;
  displayName: string;
  emailId: string;
  firstName: string;
  lastName: string;
  accountType: string;
  isActive: boolean;
  isLocked: boolean;
  authMethod: string;
  dateOfBirth?: string;
  gender?: string;
  expiresAt?: string;
  phoneNumber?: string;
  registeredLocation?: string;
  userLanguage?: string;
}

export interface RoleAssignment {
  userRoleCohortHash: string;
  roleHash: string;
  roleName: string;
  cohortHash: string;
  cohortName: string;
}

export interface GetUserEntry {
  user: GetUserData;
  roleAssignments: RoleAssignment[];
}

export interface GetUsersResponse {
  getUsers: {
    users: GetUserEntry[];
    totalCount: number;
    page: number;
    itemsPerPage: number;
    hasNext: boolean;
  };
}
