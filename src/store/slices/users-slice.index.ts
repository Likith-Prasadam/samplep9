/**
 * Users Redux Module
 *
 * This module provides comprehensive state management for the users feature.
 * It includes actions, reducers, selectors, and custom hooks.
 */

// Export the slice and its reducer
export { default as usersReducer } from './users-slice';

// Export types
export type { User, Role, UsersState, ListUser } from './users-slice';

// Export async thunks
export { fetchUsers, fetchRoles } from './users-slice';

// Export actions
export {
  setUsers,
  setLoading,
  setCurrentPage,
  setTotalPages,
  setPage,
  setItemsPerPage,
  setRoles,
  setCurrentOrgCohortHash,
  setDialogOpen,
  setCurrentRow,
  clearError,
} from './users-slice';

// Export selectors
export {
  selectUsers,
  selectRoles,
  selectUsersLoading,
  selectUsersError,
  selectUsersPagination,
  selectCurrentOrgCohortHash,
  selectUsersDialog,
  selectIsDialogOpen,
  selectCurrentRow,
  selectUsersCount,
  selectHasUsers,
  selectUserByHash,
  selectRoleByHash,
  selectActiveUsers,
  selectLockedUsers,
  selectUsersByAccountType,
} from './users-slice.selectors';

// Export hooks
export {
  useUsers,
  useUserRoles,
  useUsersDialog,
  useFilteredUsers,
  useAutoFetchUsers,
  useUserSearch,
} from './users-slice.hooks';
