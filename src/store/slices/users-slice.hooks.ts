import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchUsers,
  fetchRoles,
  setPage,
  setItemsPerPage,
  setDialogOpen,
  setCurrentRow,
  clearError,
} from '@/store/slices/users-slice';
import type { User } from '@/store/slices/users-slice';
import type { UsersFilterInput } from '@/graphql/users_queries';
import {
  selectUsers,
  selectRoles,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
  selectCurrentOrgCohortHash,
  selectUsersDialog,
  selectUsersCount,
  selectHasUsers,
  selectActiveUsers,
  selectLockedUsers,
} from '@/store/slices/users-slice.selectors';

export const useUsers = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);
  const pagination = useAppSelector(selectUsersPagination);
  const currentOrgCohortHash = useAppSelector(selectCurrentOrgCohortHash);
  const usersCount = useAppSelector(selectUsersCount);
  const hasUsers = useAppSelector(selectHasUsers);

  const loadUsers = useCallback(
    (params: {
      orgCohortHash: string;
      page?: number;
      itemsPerPage?: number;
      sortBy?: string;
      sortOrder?: string;
      filters?: UsersFilterInput;
    }) => {
      return dispatch(fetchUsers(params));
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

  const clearErrorMessage = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    users,
    loading,
    error,
    pagination,
    currentOrgCohortHash,
    usersCount,
    hasUsers,
    loadUsers,
    changePage,
    changeItemsPerPage,
    clearErrorMessage,
  };
};

export const useUserRoles = () => {
  const dispatch = useAppDispatch();
  const roles = useAppSelector(selectRoles);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);

  const loadRoles = useCallback(() => {
    return dispatch(fetchRoles());
  }, [dispatch]);

  useEffect(() => {
    if (roles.length === 0) {
      loadRoles();
    }
  }, [roles.length, loadRoles]);

  return {
    roles,
    loading,
    error,
    loadRoles,
  };
};

export const useUsersDialog = () => {
  const dispatch = useAppDispatch();
  const dialog = useAppSelector(selectUsersDialog);

  const openDialog = useCallback(
    (type: 'invite' | 'add' | 'edit' | 'delete', user: User | null = null) => {
      dispatch(setDialogOpen(type));
      if (user) {
        dispatch(setCurrentRow(user));
      }
    },
    [dispatch]
  );

  const closeDialog = useCallback(() => {
    dispatch(setDialogOpen(null));
    dispatch(setCurrentRow(null));
  }, [dispatch]);

  return {
    dialog,
    openDialog,
    closeDialog,
  };
};

export const useFilteredUsers = () => {
  const activeUsers = useAppSelector(selectActiveUsers);
  const lockedUsers = useAppSelector(selectLockedUsers);

  return {
    activeUsers,
    lockedUsers,
  };
};

export const useAutoFetchUsers = (
  orgCohortHash: string,
  options?: {
    page?: number;
    itemsPerPage?: number;
    sortBy?: string;
    sortOrder?: string;
    filters?: UsersFilterInput;
    enabled?: boolean;
  }
) => {
  const dispatch = useAppDispatch();
  const users = useAppSelector(selectUsers);
  const loading = useAppSelector(selectUsersLoading);
  const error = useAppSelector(selectUsersError);
  const { enabled = true, ...fetchParams } = options || {};
  const { page, itemsPerPage, sortBy, sortOrder, filters } = fetchParams || {};

  useEffect(() => {
    if (enabled && orgCohortHash) {
      dispatch(
        fetchUsers({
          orgCohortHash,
          page,
          itemsPerPage,
          sortBy,
          sortOrder,
          filters,
        })
      );
    }
  }, [
    dispatch,
    orgCohortHash,
    enabled,
    page,
    itemsPerPage,
    sortBy,
    sortOrder,
    filters,
  ]);

  return {
    users,
    loading,
    error,
  };
};

export const useUserSearch = () => {
  const dispatch = useAppDispatch();
  const currentOrgCohortHash = useAppSelector(selectCurrentOrgCohortHash);
  const pagination = useAppSelector(selectUsersPagination);

  const searchUsers = useCallback(
    (searchTerm: string) => {
      if (currentOrgCohortHash) {
        dispatch(
          fetchUsers({
            orgCohortHash: currentOrgCohortHash,
            page: 1,
            itemsPerPage: pagination.itemsPerPage,
            filters: { searchTerm },
          })
        );
      }
    },
    [dispatch, currentOrgCohortHash, pagination.itemsPerPage]
  );

  return {
    searchUsers,
  };
};
