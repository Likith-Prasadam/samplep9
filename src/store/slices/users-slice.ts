import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { client } from '@/lib/apollo-client';
import { GET_USERS_QUERY } from '@/graphql/users_queries';
import type { GetUserEntry, UsersFilterInput } from '@/graphql/users_queries';
import { GET_ROLES } from '@/graphql/roles_queries';
import { normalizeUserFromGetUsers } from '@/utils/user-transform';

/**
 * List user structure matching GetUsers response
 */
export type ListUser = GetUserEntry;

/**
 * User structure for store and component display
 */
export interface User {
  user_id?: string;
  user_hash: string;
  email_id: string;
  first_name: string;
  last_name: string;
  account_type: string;
  is_active: boolean;
  is_locked: boolean;
  created_at: string;
  roles: string[];
  role_names: string[];
  cohort_hashes: string[];
  cohort_names: string[];
  display_name?: string;
  gender?: string;
  phone_number?: string;
  date_of_birth?: string;
}

/**
 * Role information
 */
export interface Role {
  id?: number;
  roleName: string;
  roleHash: string;
  description?: string;
  created_at?: string;
}

/**
 * Users Redux state
 */
export interface UsersState {
  users: ListUser[];
  roles: Role[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  page: number;
  itemsPerPage: number;
  totalCount: number;
  hasNext: boolean;
  currentOrgCohortHash: string | null;
  dialog: {
    open: 'invite' | 'add' | 'edit' | 'delete' | null;
    currentRow: User | null;
  };
}

const initialState: UsersState = {
  users: [],
  roles: [],
  loading: true,
  error: null,
  currentPage: 1,
  totalPages: 1,
  page: 1,
  itemsPerPage: 10,
  totalCount: 0,
  hasNext: false,
  currentOrgCohortHash: null,
  dialog: {
    open: null,
    currentRow: null,
  },
};

/**
 * Fetch users with pagination, sorting, and filtering
 *
 * Parameters:
 * - page: Page number (default: 1)
 * - itemsPerPage: Items per page (default: 10)
 * - sortBy: Field to sort by (default: "created_at")
 * - sortOrder: Sort direction (default: "desc")
 * - filters: Filter conditions
 *
 * Access Control:
 * - ADMIN: Returns all non-SYSTEM users, optionally filtered by cohort
 * - USER: Returns only their own profile
 */
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({
    orgCohortHash,
    itemsPerPage = 10,
    page = 1,
    sortBy = 'created_at',
    sortOrder = 'desc',
    filters,
  }: {
    orgCohortHash: string;
    itemsPerPage?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: string;
    filters?: UsersFilterInput;
  }) => {
    console.log('📡 Fetching users with:', {
      orgCohortHash,
      page,
      itemsPerPage,
      sortBy,
      sortOrder,
      filters,
    });

    try {
      // Use Apollo Client to query
      const { data } = await client.query({
        query: GET_USERS_QUERY,
        variables: {
          orgCohortHash,
          page,
          itemsPerPage,
          sortBy,
          sortOrder,
          filters,
        },
        fetchPolicy: 'network-only', // Always fetch fresh data
      });

      console.log('✅ Users fetched successfully:', data);

      const fetchedUsers = (data?.getUsers?.users || []).map(
        (entry: GetUserEntry) => normalizeUserFromGetUsers(entry)
      );
      const totalCount = data?.getUsers?.totalCount || 0;
      const hasNext = data?.getUsers?.hasNext || false;
      const responsePage = data?.getUsers?.page || page;

      return {
        orgCohortHash,
        users: fetchedUsers,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        totalCount,
        hasNext,
        page: responsePage,
      };
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }
);

/**
 * Fetch all available roles
 */
export const fetchRoles = createAsyncThunk('users/fetchRoles', async () => {
  try {
    const { data } = await client.query({
      query: GET_ROLES,
      variables: { page: 1, itemsPerPage: 100 },
      fetchPolicy: 'network-only',
    });

    console.log('📡 Fetching roles');
    const fetchedRoles = data?.getRoles?.roles || [];
    console.log('✅ Roles fetched successfully:', fetchedRoles);
    return { roles: fetchedRoles };
  } catch (error) {
    console.error('❌ Error fetching roles:', error);
    return { roles: [] };
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<ListUser[]>) => {
      state.users = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setTotalPages: (state, action: PayloadAction<number>) => {
      state.totalPages = action.payload;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
      state.currentPage = action.payload;
    },
    setItemsPerPage: (state, action: PayloadAction<number>) => {
      state.itemsPerPage = action.payload;
    },
    setRoles: (state, action: PayloadAction<Role[]>) => {
      state.roles = action.payload;
    },
    setCurrentOrgCohortHash: (state, action: PayloadAction<string | null>) => {
      state.currentOrgCohortHash = action.payload;
      if (action.payload !== state.currentOrgCohortHash) {
        state.page = 1;
        state.currentPage = 1;
      }
    },
    setDialogOpen: (
      state,
      action: PayloadAction<'invite' | 'add' | 'edit' | 'delete' | null>
    ) => {
      state.dialog.open = action.payload;
    },
    setCurrentRow: (state, action: PayloadAction<User | null>) => {
      state.dialog.currentRow = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        state.users = action.payload.users;
        state.totalPages = action.payload.totalPages;
        state.totalCount = action.payload.totalCount;
        state.hasNext = action.payload.hasNext;
        state.page = action.payload.page;
        state.currentPage = action.payload.page;
        state.currentOrgCohortHash = action.payload.orgCohortHash;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.users = [];
        state.error = action.error.message || 'Failed to fetch users';
      })
      // Fetch roles
      .addCase(fetchRoles.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.roles = action.payload.roles;
        state.error = null;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to fetch roles';
      });
  },
});

export const {
  setUsers,
  setLoading,
  setCurrentPage,
  setTotalPages,
  setPage,
  setItemsPerPage,
  setRoles,
  setCurrentOrgCohortHash,
  setDialogOpen,
  setCurrentRow,
  clearError,
} = usersSlice.actions;

export default usersSlice.reducer;
