import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { OrgCohortsState } from '@/types/org-cohort-types';

const selectOrgCohortsState = (state: RootState): OrgCohortsState =>
  state.orgCohorts;

export const selectOrgCohorts = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.cohorts
);

export const selectSelectedOrgCohort = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.selectedCohort
);

export const selectOrgCohortsLoading = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.loading
);

export const selectOrgCohortsError = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.error
);

export const selectOrgCohortsPagination = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.pagination
);

export const selectOrgCohortsFilters = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.filters
);

export const selectOrgCohortsDialog = createSelector(
  [selectOrgCohortsState],
  (orgCohortsState) => orgCohortsState.dialog
);

export const selectIsOrgCohortsDialogOpen = createSelector(
  [selectOrgCohortsDialog],
  (dialog) => dialog.open !== null
);

export const selectCurrentCohort = createSelector(
  [selectOrgCohortsDialog],
  (dialog) => dialog.currentCohort
);

export const selectOrgCohortsCount = createSelector(
  [selectOrgCohorts],
  (cohorts) => cohorts.length
);

export const selectHasOrgCohorts = createSelector(
  [selectOrgCohorts],
  (cohorts) => cohorts.length > 0
);

export const selectOrgCohortByHash = createSelector(
  [
    selectOrgCohorts,
    (_state: RootState, orgCohortHash: string) => orgCohortHash,
  ],
  (cohorts, orgCohortHash) =>
    cohorts.find((c) => c.orgCohortHash === orgCohortHash)
);

export const selectRootOrgCohorts = createSelector(
  [selectOrgCohorts],
  (cohorts) => cohorts.filter((c) => c.isRoot)
);

export const selectNonRootOrgCohorts = createSelector(
  [selectOrgCohorts],
  (cohorts) => cohorts.filter((c) => !c.isRoot)
);

export const selectOrgCohortsSortedByName = createSelector(
  [selectOrgCohorts],
  (cohorts) =>
    [...cohorts].sort((a, b) => a.orgCohortName.localeCompare(b.orgCohortName))
);

export const selectHasActiveFilters = createSelector(
  [selectOrgCohortsFilters],
  (filters) => Object.keys(filters).length > 0
);

export const selectIsFirstPage = createSelector(
  [selectOrgCohortsPagination],
  (pagination) => pagination.page === 1
);

export const selectIsLastPage = createSelector(
  [selectOrgCohortsPagination],
  (pagination) => pagination.page >= pagination.totalPages
);

export const selectHasMorePages = createSelector(
  [selectOrgCohortsPagination],
  (pagination) => pagination.page < pagination.totalPages
);
