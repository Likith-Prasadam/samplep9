export interface JwtPayload {
  userHash: string;
  username: string;
  account_type: string;
  roles: string[];
  exp: number;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface UserRoleCohortItem {
  role: string;
  cohort: string;
}

export interface UserRoleCohortList {
  [key: string]: UserRoleCohortItem;
}

export interface LoginResponse {
  token: string;
  userHash: string;
  userRoleCohortHash: string | null;
  tokenType: 'access' | 'selection';
  expiresIn: string;
  requiresSelection: boolean;
  userRoleCohortList: UserRoleCohortList;
}

export interface RoleSpecificLoginResponse {
  token: string;
  userHash: string;
  userRoleCohortHash: string;
  tokenType: 'access';
  expiresIn: string;
  requiresSelection: boolean;
  userRoleCohortList: UserRoleCohortList;
}

// Legacy types (keeping for backward compatibility if needed)
export interface Category {
  category_id: number;
  category_code: string;
  category_name: string;
  category_hash: string;
  user_role_id: number;
}

export interface Role {
  role_id: number;
  role_name: string;
  role_hash: string;
  categories: Category[];
}

export interface Cohort {
  cohort_id: number;
  cohort_name: string;
  cohort_hash: string;
  roles: Role[];
}

export interface User {
  user_id: number;
  username: string;
  roles: string[];
  account_type: string;
  display_name: string;
  email_id: string;
  first_name: string;
  last_name: string;
  user_hash: string;
}
