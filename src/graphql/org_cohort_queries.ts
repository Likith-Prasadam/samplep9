import { gql } from '@apollo/client';

// Query to fetch paginated list of organization cohorts with optional filtering
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
      totalCount
      page
      itemsPerPage
      hasNext
    }
  }
`;

// Query to fetch a single organization cohort by hash
export const GET_ORG_COHORT_BY_HASH = gql`
  query GetOrgCohortByHash($orgCohortHash: String!) {
    getOrgCohortByHash(orgCohortHash: $orgCohortHash) {
      orgCohortHash
      orgCohortName
      isRoot
      createdAt
      updatedAt
    }
  }
`;

// Mutation to create a new organization cohort
export const CREATE_ORG_COHORT = gql`
  mutation CreateOrgCohort($input: OrgCohortInput!) {
    createOrgCohort(input: $input) {
      isRoot
      orgCohortName
    }
  }
`;

// Mutation to update an existing organization cohort
export const UPDATE_ORG_COHORT = gql`
  mutation UpdateOrgCohort($input: OrgCohortUpdateInput!) {
    updateOrgCohort(input: $input) {
      orgCohortName
      isRoot
    }
  }
`;

// Mutation to soft-delete an organization cohort
export const DELETE_ORG_COHORT = gql`
  mutation DeleteOrgCohort($orgCohortHash: String!) {
    deleteOrgCohort(orgCohortHash: $orgCohortHash)
  }
`;
