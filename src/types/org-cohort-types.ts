// Organization Cohort entity — matches backend OrgCohortResponse
export interface OrgCohort {
  orgCohortHash: string;
  orgCohortName: string;
  isRoot: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Input type for creating a new organization cohort
export interface OrgCohortInput {
  orgCohortName?: string;
}

// Input type for updating an existing organization cohort
export interface OrgCohortUpdateInput {
  orgCohortHash: string;
  orgCohortName?: string;
}

// Filter parameters for querying organization cohorts
export interface OrgCohortFilters {
  isRoot?: boolean;
  orgCohortName?: string;
}

// Redux state shape for organization cohorts
export interface OrgCohortsState {
  cohorts: OrgCohort[];
  selectedCohort: OrgCohort | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
  filters: OrgCohortFilters;
  dialog: {
    open: 'create' | 'edit' | 'delete' | null;
    currentCohort: OrgCohort | null;
  };
}
