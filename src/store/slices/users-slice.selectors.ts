import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import type { UsersState } from './users-slice';

/**
 * Base selector for users state
 */
const selectUsersState = (state: RootState): UsersState => state.users;

/**
 * Memoized selectors for users feature
 * These selectors use Reselect's createSelector for optimal performance
 */

/**
 * Select all users (ListUser[])
 */
export const selectUsers = createSelector(
  [selectUsersState],
  (usersState) => usersState.users
);

/**
 * Select all roles
 */
export const selectRoles = createSelector(
  [selectUsersState],
  (usersState) => usersState.roles
);

/**
 * Select loading state
 */
export const selectUsersLoading = createSelector(
  [selectUsersState],
  (usersState) => usersState.loading
);

/**
 * Select error state (if exists)
 */
export const selectUsersError = createSelector(
  [selectUsersState],
  (usersState) => usersState.error
);

/**
 * Select pagination info
 */
export const selectUsersPagination = createSelector(
  [selectUsersState],
  (usersState) => ({
    currentPage: usersState.currentPage,
    totalPages: usersState.totalPages,
    page: usersState.page,
    itemsPerPage: usersState.itemsPerPage,
    totalCount: usersState.totalCount,
    hasNext: usersState.hasNext,
  })
);

/**
 * Select current org cohort hash
 */
export const selectCurrentOrgCohortHash = createSelector(
  [selectUsersState],
  (usersState) => usersState.currentOrgCohortHash
);

/**
 * Select dialog state
 */
export const selectUsersDialog = createSelector(
  [selectUsersState],
  (usersState) => usersState.dialog
);

/**
 * Select whether dialog is open
 */
export const selectIsDialogOpen = createSelector(
  [selectUsersDialog],
  (dialog) => dialog.open !== null
);

/**
 * Select current row (user being edited/deleted)
 */
export const selectCurrentRow = createSelector(
  [selectUsersDialog],
  (dialog) => dialog.currentRow
);

/**
 * Select users count
 */
export const selectUsersCount = createSelector(
  [selectUsers],
  (users) => users.length
);

/**
 * Select whether there are any users
 */
export const selectHasUsers = createSelector(
  [selectUsers],
  (users) => users.length > 0
);

/**
 * Select user by user hash
 */
export const selectUserByHash = createSelector(
  [selectUsers, (_state: RootState, userHash: string) => userHash],
  (users, userHash) => users.find((u) => u.user.userHash === userHash)
);

/**
 * Select role by role hash
 */
export const selectRoleByHash = createSelector(
  [selectRoles, (_state: RootState, roleHash: string) => roleHash],
  (roles, roleHash) => roles.find((r) => r.roleHash === roleHash)
);

/**
 * Select active users only
 */
export const selectActiveUsers = createSelector([selectUsers], (users) =>
  users.filter((u) => u.user.isActive)
);

/**
 * Select locked users only
 */
export const selectLockedUsers = createSelector([selectUsers], (users) =>
  users.filter((u) => u.user.isLocked)
);

/**
 * Select users by account type
 */
export const selectUsersByAccountType = createSelector(
  [selectUsers, (_state: RootState, accountType: string) => accountType],
  (users, accountType) =>
    users.filter((u) => u.user.accountType === accountType)
);
