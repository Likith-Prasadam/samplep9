import type { GetUserEntry } from '@/graphql/users_queries';

export function normalizeUserFromGetUsers(entry: GetUserEntry) {
  const roleAssignments = entry.roleAssignments || [];

  return {
    user_id: undefined,
    user_hash: entry.user.userHash,
    username: entry.user.username,
    display_name: entry.user.displayName,
    email_id: entry.user.emailId,
    first_name: entry.user.firstName,
    last_name: entry.user.lastName,
    account_type: entry.user.accountType,
    is_active: entry.user.isActive,
    is_locked: entry.user.isLocked,
    auth_method: entry.user.authMethod,
    date_of_birth: entry.user.dateOfBirth,
    gender: entry.user.gender,
    expires_at: entry.user.expiresAt,
    phone_number: entry.user.phoneNumber,
    registered_location: entry.user.registeredLocation,
    user_language: entry.user.userLanguage,
    roles: roleAssignments.map((ra) => ra.roleHash),
    role_names: roleAssignments.map((ra) => ra.roleName),
    cohort_hashes: roleAssignments.map((ra) => ra.cohortHash),
    cohort_names: roleAssignments.map((ra) => ra.cohortName),
    role_assignments: roleAssignments.map((ra) => ({
      user_role_cohort_hash: ra.userRoleCohortHash,
      role_hash: ra.roleHash,
      role_name: ra.roleName,
      cohort_hash: ra.cohortHash,
      cohort_name: ra.cohortName,
    })),
  };
}

export function formatUserDisplayName(
  firstName: string,
  lastName: string
): string {
  return `${firstName} ${lastName}`.trim() || 'Unknown';
}

export function formatRoleNames(roleNames: string[]): string {
  if (!roleNames || roleNames.length === 0) return '-';
  return roleNames
    .map((r) => r.charAt(0).toUpperCase() + r.slice(1).toLowerCase())
    .join(', ');
}

export function formatCohortNames(cohortNames: string[]): string {
  if (!cohortNames || cohortNames.length === 0) return '-';
  return cohortNames.map((c) => c.trim()).join(', ');
}
