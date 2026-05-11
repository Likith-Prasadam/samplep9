import { useMemo } from 'react';
import { useAppSelector } from '@/store';

export function usePermissions() {
  const currentRoleCohortHash = useAppSelector(
    (s) => s.auth.currentRoleCohortHash
  );
  const availableRoles = useAppSelector((s) => s.auth.availableRoles);

  return useMemo(() => {
    interface StoredUser {
      is_root?: boolean | string | number;
      cohort_hash?: string;
    }
    let selectedRole = 'USER';
    let storedUser: StoredUser = {};
    let selectedCohort = '';
    let tokenIsRoot = false;
    let tokenRootCohortHash = '';
    try {
      // Prefer the role from Redux (currentRoleCohortHash -> availableRoles), fallback to localStorage
      type RoleLike = { hash?: string; role?: string; role_name?: string };
      const currentRole =
        (availableRoles as RoleLike[] | undefined)?.find(
          (r) => r.hash === currentRoleCohortHash
        ) || (availableRoles as RoleLike[] | undefined)?.[0];
      const roleVal = currentRole
        ? (currentRole.role ?? currentRole.role_name)
        : undefined;

      selectedCohort = (
        (currentRole as { cohort?: string } | undefined)?.cohort ??
        localStorage.getItem('selected_cohort') ??
        ''
      )
        .toString()
        .trim()
        .toLowerCase();

      if (roleVal) {
        selectedRole = roleVal.toString().toUpperCase();
      } else {
        selectedRole = (localStorage.getItem('selected_role') || 'USER')
          .toString()
          .toUpperCase();
      }
      storedUser = (JSON.parse(localStorage.getItem('user') || '{}') ||
        {}) as StoredUser;

      const token = localStorage.getItem('access_token');
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1])) as {
            is_root?: boolean | string | number;
            user?: {
              is_root?: boolean | string | number;
              cohort_hash?: string;
            };
            cohort?: { org_cohort_hash?: string; cohort_hash?: string };
          };
          const tokenRootVal = payload?.is_root ?? payload?.user?.is_root;
          tokenIsRoot =
            tokenRootVal === true ||
            tokenRootVal === 'true' ||
            tokenRootVal === 1 ||
            tokenRootVal === '1';
          tokenRootCohortHash =
            payload?.cohort?.org_cohort_hash ||
            payload?.cohort?.cohort_hash ||
            payload?.user?.cohort_hash ||
            '';
        }
      }
    } catch {
      // ignore
    }

    const normalizedRole = selectedRole
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

    const roleIsRootAdmin = normalizedRole === 'ROOT_ADMIN';
    const roleIsRootUser = normalizedRole === 'ROOT_USER';
    const roleIsCohortAdmin = normalizedRole === 'ADMIN';
    const roleIsCohortUser = normalizedRole === 'USER';

    const isAdmin = roleIsRootAdmin || roleIsCohortAdmin;
    const localRootVal = storedUser?.is_root;
    const localIsRoot =
      localRootVal === true ||
      localRootVal === 'true' ||
      localRootVal === 1 ||
      localRootVal === '1';

    // Some environments represent "root" via cohort name or token/user flags.
    // We also treat explicit ROOT_* roles as root regardless of is_root flag.
    const isParabola9Admin =
      roleIsCohortAdmin && selectedCohort === 'parabola9';
    const isRoot =
      roleIsRootAdmin ||
      roleIsRootUser ||
      localIsRoot ||
      tokenIsRoot ||
      isParabola9Admin;
    const isRootAdmin = roleIsRootAdmin || (roleIsCohortAdmin && isRoot);
    const isRootUser = roleIsRootUser || (roleIsCohortUser && isRoot);
    const rootCohortHash = (
      tokenRootCohortHash ||
      storedUser?.cohort_hash ||
      ''
    )
      .toString()
      .trim();

    function canViewOrg(orgHash?: string | null) {
      if (isRootAdmin || isRootUser) return true;
      if (!orgHash) return false;
      if (isAdmin) return currentRoleCohortHash === orgHash;
      // regular user: can view only their own cohort
      return currentRoleCohortHash === orgHash;
    }

    function canEditOrg(orgHash?: string | null) {
      if (isRootAdmin) return true;
      if (!orgHash) return false;

      // Cohort admin: normally can manage only their assigned cohort.
      // Some backends represent the "current role cohort hash" differently from the orgCohortHash used in UI lists.
      // We also trust the currently selected organization context stored by the UI (sessionStorage),
      // which is set when navigating from org lists into add/edit flows.
      if (roleIsCohortAdmin) {
        if (currentRoleCohortHash === orgHash) return true;

        if (typeof window !== 'undefined') {
          try {
            const saved = sessionStorage.getItem('selectedOrg');
            const parsed = saved
              ? (JSON.parse(saved) as { orgCohortHash?: string } | null)
              : null;
            const scopedHash = parsed?.orgCohortHash;
            if (scopedHash && scopedHash === orgHash) return true;
          } catch {
            // ignore invalid session storage
          }
        }

        const hasSingleCohortScope =
          Array.isArray(availableRoles) && availableRoles.length === 1;
        if (hasSingleCohortScope) return true;
      }

      return false;
    }

    function canViewUser(userOrgHash?: string | null) {
      return canViewOrg(userOrgHash);
    }

    function canEditUser(userOrgHash?: string | null) {
      return canEditOrg(userOrgHash);
    }

    function canManageCameras(cohortHash?: string | null) {
      return canEditOrg(cohortHash);
    }

    function canCreateCamera(cohortHash?: string | null) {
      // Root admin can create cameras only within the currently selected root cohort context.
      // (They can still view/manage across cohorts, but camera creation is limited.)
      if (isRootAdmin) {
        if (!cohortHash) return false;
        return rootCohortHash ? rootCohortHash === cohortHash : false;
      }
      return canEditOrg(cohortHash);
    }

    function canManageUsers(cohortHash?: string | null) {
      return canEditOrg(cohortHash);
    }

    function canCreateUser(cohortHash?: string | null) {
      return canEditOrg(cohortHash);
    }

    function canManageCohorts() {
      return isRootAdmin;
    }

    return {
      isAdmin,
      isRoot,
      isRootAdmin,
      isRootUser,
      currentRoleCohortHash,
      selectedRole: normalizedRole,
      canViewOrg,
      canEditOrg,
      canViewUser,
      canEditUser,
      canManageCameras,
      canCreateCamera,
      canManageUsers,
      canCreateUser,
      canManageCohorts,
    } as const;
  }, [currentRoleCohortHash, availableRoles]);
}
