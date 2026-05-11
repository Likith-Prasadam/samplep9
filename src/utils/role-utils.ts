/**
 * Utility functions for managing user roles and cohorts
 */

export interface RoleAssignment {
  hash: string;
  role: string;
  cohort: string;
}

/**
 * Get the current role assignment from localStorage
 */
export function getCurrentRoleAssignment(): RoleAssignment | null {
  const hash = localStorage.getItem('user_role_cohort_hash');
  const loginResponse = localStorage.getItem('loginResponse');

  if (!hash || !loginResponse) return null;

  try {
    const parsed = JSON.parse(loginResponse);
    const list = parsed.userRoleCohortList || {};
    const roleInfo = list[hash];

    if (!roleInfo) return null;

    return {
      hash,
      role: roleInfo.role,
      cohort: roleInfo.cohort,
    };
  } catch {
    return null;
  }
}

/**
 * Get all available role assignments for the user
 */
export function getAvailableRoleAssignments(): RoleAssignment[] {
  const loginResponse = localStorage.getItem('loginResponse');

  if (!loginResponse) return [];

  try {
    const parsed = JSON.parse(loginResponse);
    const list = (parsed.userRoleCohortList || {}) as Record<
      string,
      { role?: string; cohort?: string }
    >;

    return Object.entries(list).map(([hash, info]) => ({
      hash,
      role: info.role || 'Unknown',
      cohort: info.cohort || 'Unknown',
    }));
  } catch {
    return [];
  }
}

/**
 * Check if user has multiple roles available
 */
export function hasMultipleRoles(): boolean {
  return getAvailableRoleAssignments().length > 1;
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/**
 * Get the current user hash
 */
export function getUserHash(): string | null {
  return localStorage.getItem('user_hash');
}

/**
 * Check if user needs role selection
 */
export function requiresRoleSelection(): boolean {
  const loginResponse = localStorage.getItem('loginResponse');

  if (!loginResponse) return false;

  try {
    const parsed = JSON.parse(loginResponse);
    return parsed.requiresSelection === true && hasMultipleRoles();
  } catch {
    return false;
  }
}

/**
 * Clear all role-related data from localStorage
 * Should be called on logout
 */
export function clearRoleData(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('selection_token');
  localStorage.removeItem('user_hash');
  localStorage.removeItem('user_role_cohort_hash');
  localStorage.removeItem('loginResponse');
}

/**
 * Get role assignment by hash
 */
export function getRoleAssignmentByHash(hash: string): RoleAssignment | null {
  const assignments = getAvailableRoleAssignments();
  return assignments.find((a) => a.hash === hash) || null;
}
