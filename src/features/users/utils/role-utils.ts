/**
 * Role Utility Functions
 * Provides helper functions for role-based operations and validations
 */

export interface UserProfile {
  account_type?: string;
  roles?: string[];
  user_hash?: string;
  user_id?: string | number;
  is_root?: boolean;
  display_name?: string;
}

/**
 * Extract user profile from localStorage
 * Tries to get from localStorage first, then falls back to JWT token decoding
 */
export const getUserProfileFromStorage = (): UserProfile => {
  try {
    let profile = JSON.parse(localStorage.getItem('user') || '{}');

    const selectedRole = localStorage.getItem('selected_role');
    if (selectedRole && !profile.account_type) {
      profile.account_type = selectedRole;
    }

    if (!profile || !profile.account_type) {
      const token = localStorage.getItem('access_token');

      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const decoded = JSON.parse(atob(parts[1]));

            profile = {
              account_type:
                decoded.user?.account_type ||
                decoded.account_type ||
                decoded.accountType ||
                decoded.user?.role ||
                decoded.role,
              user_hash:
                decoded.user?.user_hash ||
                decoded.userHash ||
                decoded.user_id ||
                decoded.userId,
              user_id:
                decoded.user?.user_id || decoded.userId || decoded.user_id,
              display_name:
                decoded.user?.displayName ||
                decoded.displayName ||
                decoded.user?.display_name ||
                decoded.display_name,
              roles:
                decoded.user?.roles ||
                decoded.roles ||
                (decoded.user?.account_type
                  ? [decoded.user.account_type]
                  : []) ||
                (decoded.account_type ? [decoded.account_type] : []) ||
                [],
              is_root: decoded.is_root || decoded.user?.is_root,
            };
          }
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      }
    }

    return profile;
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    return {};
  }
};

/**
 * Check if the current user is an admin
 * @param profile
 * @returns
 */
export const isUserAdmin = (profile: UserProfile): boolean => {
  const normalize = (value?: string) =>
    (value || '')
      .toString()
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

  const normalizedAccountType = normalize(profile?.account_type);
  const accountTypeIsAdmin =
    normalizedAccountType === 'ADMIN' ||
    normalizedAccountType === 'ROOT_ADMIN' ||
    normalizedAccountType.endsWith('_ADMIN');

  const rolesIncludeAdmin =
    profile?.roles?.some(
      (role) =>
        normalize(role)?.includes('ADMIN') || normalize(role) === 'ADMIN'
    ) || false;

  return accountTypeIsAdmin || rolesIncludeAdmin;
};

/**
 * Check if the current user is root
 * @param profile
 * @returns
 */
export const isUserRoot = (profile: UserProfile): boolean => {
  return profile?.is_root === true;
};

/**
 * Check if user is editing their own profile
 * @param profile
 * @param targetUserHash
 * @returns
 */
export const isEditingOwnProfile = (
  profile: UserProfile,
  targetUserHash?: string
): boolean => {
  return Boolean(profile?.user_hash === targetUserHash);
};

/**
 * Determine which mutation should be used based on role and context
 * @param profile
 * @returns
 */
export const getMutationType = (
  profile: UserProfile
): 'updateUser' | 'selfUpdateUser' => {
  const isAdmin = isUserAdmin(profile);

  if (isAdmin) {
    return 'updateUser';
  }

  return 'selfUpdateUser';
};

/**
 * Get allowed roles based on user's root status
 * @param roles
 * @param isRoot
 * @returns
 */
export const getAllowedRoles = (
  roles: Array<{ id: number; role_name: string }> = [],
  isRoot: boolean
) => {
  return roles.filter((role) =>
    isRoot
      ? ['ROOT_ADMIN', 'ROOT_USER'].includes(role.role_name)
      : ['ADMIN', 'USER'].includes(role.role_name)
  );
};

/**
 * Log mutation selection for debugging
 * Provides consistent debug logging across the application
 */
export const logMutationSelection = (
  mutationType: 'updateUser' | 'selfUpdateUser',
  context: {
    isAdmin: boolean;
    isEditingSelf: boolean;
    userHash?: string;
    targetUserHash?: string;
  }
) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`  - Mutation Type: ${mutationType}`);
    console.log(`  - Is Admin: ${context.isAdmin}`);
    console.log(`  - Is Editing Self: ${context.isEditingSelf}`);
    console.log(`  - Current User Hash: ${context.userHash}`);
    console.log(`  - Target User Hash: ${context.targetUserHash}`);
    console.log(
      `  - Reason: ${
        mutationType === 'updateUser'
          ? 'Admin editing another user'
          : 'User editing own profile or regular user update'
      }`
    );
  }
};
