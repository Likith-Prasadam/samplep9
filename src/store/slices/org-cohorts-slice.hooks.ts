import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchOrgCohorts,
  fetchOrgCohortByHash,
  createOrgCohort,
  updateOrgCohort,
  deleteOrgCohort,
  setPage,
  setItemsPerPage,
  setFilters,
  setDialogOpen,
  setCurrentCohort,
  clearError,
} from '@/store/slices/org-cohorts-slice';
import type {
  OrgCohort,
  OrgCohortInput,
  OrgCohortUpdateInput,
  OrgCohortFilters,
} from '@/types/org-cohort-types';
import {
  selectOrgCohorts,
  selectSelectedOrgCohort,
  selectOrgCohortsLoading,
  selectOrgCohortsError,
  selectOrgCohortsPagination,
  selectOrgCohortsFilters,
  selectOrgCohortsDialog,
  selectOrgCohortsCount,
  selectHasOrgCohorts,
  selectRootOrgCohorts,
  selectNonRootOrgCohorts,
  selectOrgCohortsSortedByName,
  selectHasActiveFilters,
  selectIsFirstPage,
  selectIsLastPage,
  selectHasMorePages,
} from '@/store/slices/org-cohorts-slice.selectors';

export const useOrgCohorts = () => {
  const dispatch = useAppDispatch();
  const cohorts = useAppSelector(selectOrgCohorts);
  const selectedCohort = useAppSelector(selectSelectedOrgCohort);
  const loading = useAppSelector(selectOrgCohortsLoading);
  const error = useAppSelector(selectOrgCohortsError);
  const pagination = useAppSelector(selectOrgCohortsPagination);
  const filters = useAppSelector(selectOrgCohortsFilters);
  const cohortsCount = useAppSelector(selectOrgCohortsCount);
  const hasCohorts = useAppSelector(selectHasOrgCohorts);

  const loadCohorts = useCallback(
    (params?: {
      page?: number;
      itemsPerPage?: number;
      filters?: OrgCohortFilters;
    }) => {
      return dispatch(fetchOrgCohorts(params || {}));
    },
    [dispatch]
  );

  const loadCohortByHash = useCallback(
    (orgCohortHash: string) => {
      return dispatch(fetchOrgCohortByHash(orgCohortHash));
    },
    [dispatch]
  );

  const changePage = useCallback(
    (page: number) => {
      dispatch(setPage(page));
    },
    [dispatch]
  );

  const changeItemsPerPage = useCallback(
    (itemsPerPage: number) => {
      dispatch(setItemsPerPage(itemsPerPage));
    },
    [dispatch]
  );

  const applyFilters = useCallback(
    (newFilters: OrgCohortFilters) => {
      dispatch(setFilters(newFilters));
    },
    [dispatch]
  );

  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    cohorts,
    selectedCohort,
    loading,
    error,
    pagination,
    filters,
    cohortsCount,
    hasCohorts,
    loadCohorts,
    loadCohortByHash,
    changePage,
    changeItemsPerPage,
    applyFilters,
    clearErrorMessage,
  };
};

export const useOrgCohortMutations = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector(selectOrgCohortsLoading);
  const error = useAppSelector(selectOrgCohortsError);

  const create = useCallback(
    (input: OrgCohortInput) => {
      return dispatch(createOrgCohort(input));
    },
    [dispatch]
  );

  const update = useCallback(
    (input: OrgCohortUpdateInput) => {
      return dispatch(updateOrgCohort(input));
    },
    [dispatch]
  );

  const remove = useCallback(
    (orgCohortHash: string) => {
      return dispatch(deleteOrgCohort(orgCohortHash));
    },
    [dispatch]
  );

  return {
    create,
    update,
    remove,
    loading,
    error,
  };
};

export const useOrgCohortsDialog = () => {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector(selectOrgCohortsDialog);

  const openDialog = useCallback(
    (type: 'create' | 'edit' | 'delete', cohort: OrgCohort | null = null) => {
      dispatch(setDialogOpen(type));
      if (cohort) {
        dispatch(setCurrentCohort(cohort));
      }
    },
    [dispatch]
  );

  const closeDialog = useCallback(() => {
    dispatch(setDialogOpen(null));
    dispatch(setCurrentCohort(null));
  }, [dispatch]);

  return {
    dialog,
    openDialog,
    closeDialog,
  };
};

export const useFilteredOrgCohorts = () => {
  const rootCohorts = useAppSelector(selectRootOrgCohorts);
  const nonRootCohorts = useAppSelector(selectNonRootOrgCohorts);
  const sortedCohorts = useAppSelector(selectOrgCohortsSortedByName);

  return {
    rootCohorts,
    nonRootCohorts,
    sortedCohorts,
  };
};

export const useOrgCohortsPagination = () => {
  const pagination = useAppSelector(selectOrgCohortsPagination);
  const isFirstPage = useAppSelector(selectIsFirstPage);
  const isLastPage = useAppSelector(selectIsLastPage);
  const hasMorePages = useAppSelector(selectHasMorePages);

  return {
    ...pagination,
    isFirstPage,
    isLastPage,
    hasMorePages,
  };
};

export const useAutoFetchOrgCohorts = (options?: {
  page?: number;
  itemsPerPage?: number;
  filters?: OrgCohortFilters;
  enabled?: boolean;
}) => {
  const dispatch = useAppDispatch();
  const cohorts = useAppSelector(selectOrgCohorts);
  const loading = useAppSelector(selectOrgCohortsLoading);
  const error = useAppSelector(selectOrgCohortsError);
  const { enabled = true, ...fetchParams } = options || {};
  const { page, itemsPerPage, filters } = fetchParams || {};

  useEffect(() => {
    if (enabled) {
      dispatch(fetchOrgCohorts({ page, itemsPerPage, filters }));
    }
  }, [dispatch, enabled, page, itemsPerPage, filters?.isRoot, filters]);

  return {
    cohorts,
    loading,
    error,
  };
};

export const useOrgCohortByHash = (orgCohortHash: string | null) => {
  const dispatch = useAppDispatch();
  const selectedCohort = useAppSelector(selectSelectedOrgCohort);
  const loading = useAppSelector(selectOrgCohortsLoading);
  const error = useAppSelector(selectOrgCohortsError);

  useEffect(() => {
    if (orgCohortHash) {
      dispatch(fetchOrgCohortByHash(orgCohortHash));
    }
  }, [dispatch, orgCohortHash]);

  return {
    cohort: selectedCohort,
    loading,
    error,
  };
};

export const useOrgCohortsFiltersState = () => {
  const filters = useAppSelector(selectOrgCohortsFilters);
  const hasActiveFilters = useAppSelector(selectHasActiveFilters);

  return {
    filters,
    hasActiveFilters,
  };
};
