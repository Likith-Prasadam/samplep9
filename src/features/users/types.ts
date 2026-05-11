export interface ListUser {
  user_id?: number;
  user: {
    userHash: string;
    displayName: string;
    emailId: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isActive: boolean;
    isLocked: boolean;
    createdAt: string;
  };
  roleAssignments: Array<{
    userRoleCohortHash: string;
    roleHash: string;
    roleName: string;
    cohortHash: string;
    cohortName: string;
  }>;
}

export interface User {
  user_id?: string;
  user_hash: string;
  display_name?: string;
  email_id: string;
  first_name: string;
  last_name: string;
  account_type: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  auth_method?: string;
  gender?: string;
  date_of_birth?: string;
  expires_at?: string;
  phone_number?: string;
  registered_location?: string;
  user_language?: string;
  roles: string[];
  role_names: string[];
  cohort_hashes: string[];
  cohort_names: string[];
  role_assignments?: Array<{
    user_role_cohort_hash: string;
    role_hash: string;
    role_name: string;
    cohort_hash: string;
    cohort_name: string;
  }>;
}

export interface RoleCohortPair {
  roleHash: string;
  roleName?: string;
  cohortHash: string;
  cohortName?: string;
}

export interface CreateUserInput {
  username: string;
  displayName: string;
  password: string;
  firstName: string;
  lastName: string;
  emailId: string;
  gender?: string;
  accountType?: string;
  roleCohortPairs: RoleCohortPair[];
  userLanguage?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  registeredLocation?: string;
  isActive?: boolean;
  isLocked?: boolean;
}

export interface CreateUserResponse {
  user: {
    userHash: string;
    displayName: string;
    emailId: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isActive: boolean;
    isLocked: boolean;
    gender?: string;
    userLanguage?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    registeredLocation?: string;
    expiresAt?: string;
    authMethod?: string;
  };
  roleAssignments: Array<{
    roleHash: string;
    roleName: string;
    cohortHash: string;
    cohortName: string;
  }>;
}

// Matches backend UsersUpdateInput — only fields the backend accepts
export interface UsersUpdateInput {
  userHash: string;
  orgCohortHash: string;
  emailId?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  userLanguage?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  displayName?: string;
  registeredLocation?: string;
  expiresAt?: string;
}

export interface UpdateUserResponse {
  userHash: string;
  accountType: string;
  authMethod?: string;
  dateOfBirth?: string;
  displayName?: string;
  emailId: string;
  expiresAt?: string;
  firstName: string;
  gender?: string;
  isActive: boolean;
  isLocked: boolean;
  lastName: string;
  phoneNumber?: string;
  registeredLocation?: string;
  userLanguage?: string;
  username: string;
}

export interface SelfUpdateUserResponse {
  userHash: string;
  accountType: string;
  authMethod?: string;
  dateOfBirth?: string;
  displayName?: string;
  emailId: string;
  expiresAt?: string;
  firstName: string;
  gender?: string;
  isActive: boolean;
  isLocked: boolean;
  lastName: string;
  phoneNumber?: string;
  registeredLocation?: string;
  userLanguage?: string;
  username: string;
}

export interface Cohort {
  id: number;
  org_cohort_hash: string;
  org_cohort_name: string;
  model_id: number;
  cohort_model_params?: Record<string, unknown>;
  cohort_default_prompts?: Record<string, unknown>;
  events_to_detect?: string[];
  created_at: string;
  updated_at: string;
  is_root: boolean;
  is_general: boolean;
}

export type UserRole = 'ADMIN' | 'USER' | 'ROOT_ADMIN' | 'ROOT_USER';

export interface MutationContext {
  isAdmin: boolean;
  isEditingSelf: boolean;
  isRoot: boolean;
  userHash?: string;
  targetUserHash?: string;
}

export type MutationType = 'updateUser' | 'selfUpdateUser';

export interface UserProfileContext {
  account_type?: string;
  roles?: string[];
  user_hash?: string;
  user_id?: string | number;
  is_root?: boolean;
  username?: string;
  cohort_id?: number;
}

export interface MutationSelectionResult {
  mutationType: MutationType;
  isAdmin: boolean;
  isEditingSelf: boolean;
  context: MutationContext;
}
