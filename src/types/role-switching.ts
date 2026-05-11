export interface RoleAssignment {
  hash: string;
  role: string;
  cohort: string;
}

export interface SwitchAssignmentResponse {
  switchAssignment: {
    token: string;
    userHash: string;
    userRoleCohortHash: string;
    tokenType: 'access' | 'selection';
    expiresIn: string;
    requiresSelection: boolean;
    userRoleCohortList: Record<
      string,
      {
        role: string;
        cohort: string;
      }
    >;
  };
}

export interface SwitchAssignmentVariables {
  userRoleCohortHash: string;
}

export interface RoleSwitchedEventDetail {
  userRoleCohortHash: string;
  role: string;
  cohort: string;
}

export interface UseSwitchRoleReturn {
  switchRole: (
    userRoleCohortHash: string
  ) => Promise<SwitchAssignmentResponse['switchAssignment']>;
  isLoading: boolean;
  error: string | null;
}

export interface UseRoleSpecificLoginMutationReturn {
  selectRole: (
    userRoleCohortHash: string
  ) => Promise<SwitchAssignmentResponse['switchAssignment']>;
  loading: boolean;
  error: Error | string | null;
}

export interface RoleSwitcherProps {
  className?: string;
  onRoleSwitched?: (role: RoleAssignment) => void;
}

export interface RoleContext {
  currentRole: RoleAssignment | null;
  availableRoles: RoleAssignment[];
  switchRole: (hash: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
