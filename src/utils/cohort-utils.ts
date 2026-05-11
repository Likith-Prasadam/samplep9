interface AuthStateSnapshot {
  currentRoleCohortHash?: string;
}

interface UserSnapshot {
  cohort_hash?: string;
}

interface TokenSnapshot {
  cohort?: {
    org_cohort_hash?: string;
    cohort_hash?: string;
  };
  user?: {
    cohort_hash?: string;
  };
}

const parseJson = <T>(value: string | null): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getActiveCohortHash = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('selection_token') ||
    localStorage.getItem('token');

  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1])) as TokenSnapshot;
        const tokenCohortHash =
          payload?.cohort?.org_cohort_hash ||
          payload?.cohort?.cohort_hash ||
          payload?.user?.cohort_hash;
        if (tokenCohortHash) {
          return tokenCohortHash;
        }
      }
    } catch {
      // ignore invalid token
    }
  }

  const authState = parseJson<AuthStateSnapshot>(
    localStorage.getItem('auth_state')
  );
  if (authState?.currentRoleCohortHash) {
    return authState.currentRoleCohortHash;
  }

  const directHash = localStorage.getItem('user_role_cohort_hash');
  if (directHash) {
    return directHash;
  }

  const user = parseJson<UserSnapshot>(localStorage.getItem('user'));
  if (user?.cohort_hash) {
    return user.cohort_hash;
  }

  return null;
};
