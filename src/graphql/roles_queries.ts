import { gql } from '@apollo/client';

export const GET_ROLES = gql`
  query GetRoles(
    $page: Int = 1
    $itemsPerPage: Int = 100
    $sortBy: String = "created_at"
    $sortOrder: String = "desc"
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
        description
        parentRoleHash
      }
      totalCount
      page
      itemsPerPage
      hasNext
    }
  }
`;

/**
 * ROLES_TBL – get_role_by_hash
 * Fetches a single role by hash.
 */
export const GET_ROLE_BY_HASH = gql`
  query GetRoleByHash($roleHash: String!) {
    getRoleByHash(roleHash: $roleHash) {
      roleHash
      roleName
      accessLevel
      description
      parentRoleHash
    }
  }
`;

/**
 * ROLES_TBL – create_role
 */
export const CREATE_ROLE = gql`
  mutation CreateRole($input: RolesInput!) {
    createRole(input: $input) {
      roleHash
      roleName
      accessLevel
      description
      parentRoleHash
    }
  }
`;

/**
 * ROLES_TBL – update_role
 */
export const UPDATE_ROLE = gql`
  mutation UpdateRole($input: RolesUpdateInput!) {
    updateRole(input: $input) {
      roleHash
      roleName
      accessLevel
      description
      parentRoleHash
    }
  }
`;

/**
 * ROLES_TBL – delete_role
 */
export const DELETE_ROLE = gql`
  mutation DeleteRole($roleHash: String!) {
    deleteRole(roleHash: $roleHash)
  }
`;
