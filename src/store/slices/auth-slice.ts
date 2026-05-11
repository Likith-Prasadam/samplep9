import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface RoleAssignment {
  hash: string;
  role: string;
  cohort: string;
}

export interface User {
  username: string;
  roles: string[];
  first_name: string;
  last_name: string;
  user_hash: string;
  cohort_hash: string;
  cohort_id: number;
  user_id: number;
  role_name?: string;
  user_role_id?: number;
  category_id?: number;
  category_code?: string;
}

interface AuthState {
  user: User | null;
  userHash: string | null;
  currentRoleCohortHash: string | null;
  availableRoles: RoleAssignment[];
  isLoading: boolean;
  error: string | null;
}

function getInitialAuthState(): AuthState {
  const base: AuthState = {
    user: null,
    userHash: null,
    currentRoleCohortHash: null,
    availableRoles: [],
    isLoading: false,
    error: null,
  };
  if (typeof window === 'undefined') return base;
  try {
    const raw = localStorage.getItem('auth_state');
    if (!raw) return base;
    const parsed = JSON.parse(raw) as {
      userHash?: string | null;
      availableRoles?: RoleAssignment[];
      currentRoleCohortHash?: string | null;
    };
    const roles = Array.isArray(parsed.availableRoles)
      ? parsed.availableRoles
      : [];
    const hash =
      typeof parsed.currentRoleCohortHash === 'string'
        ? parsed.currentRoleCohortHash
        : null;
    if (roles.length > 0 && hash) {
      return {
        ...base,
        userHash: typeof parsed.userHash === 'string' ? parsed.userHash : null,
        availableRoles: roles,
        currentRoleCohortHash: hash,
      };
    }
  } catch {
    // ignore invalid or missing auth_state
  }
  return base;
}

const initialState: AuthState = getInitialAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
    setLoginData: (
      state,
      action: PayloadAction<{
        userHash: string;
        availableRoles: RoleAssignment[];
        currentRoleCohortHash: string;
      }>
    ) => {
      state.userHash = action.payload.userHash;
      state.availableRoles = action.payload.availableRoles;
      state.currentRoleCohortHash = action.payload.currentRoleCohortHash;
      state.error = null;

      // Persist available roles to localStorage for restoration on page refresh
      if (typeof window !== 'undefined') {
        const authState = {
          userHash: action.payload.userHash,
          availableRoles: action.payload.availableRoles,
          currentRoleCohortHash: action.payload.currentRoleCohortHash,
        };
        localStorage.setItem('auth_state', JSON.stringify(authState));
      }
    },
    setCurrentRole: (
      state,
      action: PayloadAction<{
        currentRoleCohortHash: string;
        role: RoleAssignment;
        availableRoles?: RoleAssignment[];
      }>
    ) => {
      state.currentRoleCohortHash = action.payload.currentRoleCohortHash;
      if (action.payload.availableRoles) {
        state.availableRoles = action.payload.availableRoles;
      }
      state.user = {
        ...state.user!,
        role_name: action.payload.role.role,
        cohort_hash: action.payload.currentRoleCohortHash,
        roles: [action.payload.role.role],
      };
      state.error = null;

      // Persist current role to localStorage
      if (typeof window !== 'undefined') {
        const authState = {
          userHash: state.userHash,
          availableRoles: state.availableRoles,
          currentRoleCohortHash: action.payload.currentRoleCohortHash,
        };
        localStorage.setItem('auth_state', JSON.stringify(authState));
      }
    },
    setAvailableRoles: (state, action: PayloadAction<RoleAssignment[]>) => {
      state.availableRoles = action.payload;
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.userHash = null;
      state.currentRoleCohortHash = null;
      state.availableRoles = [];
      state.isLoading = false;
      state.error = null;
    },
  },
});

export const {
  setUser,
  clearUser,
  setLoginData,
  setCurrentRole,
  setAvailableRoles,
  setAuthLoading,
  setAuthError,
  clearAuth,
} = authSlice.actions;
export default authSlice.reducer;
