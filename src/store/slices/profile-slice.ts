import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ProfileData {
  user_id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  user_language: string;
  date_of_birth?: Date | null;
  email_id: string;
  registered_location?: string;
  phone_number?: string;
}

export interface ProfileState {
  profile: ProfileData | null;
  loading: boolean;
  updateLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profile: null,
  loading: false,
  updateLoading: false,
  error: null,
};

export const fetchUserProfile = createAsyncThunk(
  'profile/fetchUserProfile',
  async (username: string) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found.');

    const response = await fetch(import.meta.env.VITE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          query GetUserProfile($username: String!) {
            users {
              fetch_data_by_filters_users(input_json: { username: $username }) {
                users {
                  user_id
                  first_name
                  last_name
                  gender
                  user_language
                  date_of_birth
                  email_id
                  phone_number
                  registered_location
                }
              }
            }
          }
        `,
        variables: { username },
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (result.errors)
      throw new Error(result.errors[0]?.message || 'GraphQL error');

    const userData =
      result?.data?.users?.fetch_data_by_filters_users?.users?.[0];
    if (!userData) throw new Error('User not found');

    return userData;
  }
);

export const updateUserProfile = createAsyncThunk(
  'profile/updateUserProfile',
  async (profileData: ProfileData) => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('No authentication token found.');

    const response = await fetch(import.meta.env.VITE_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        query: `
          mutation UpdateUser($input_json: UsersInput!) {
            users {
              update_user(input_json: $input_json) {
                user_id
                user_hash
                username
                first_name
                last_name
                email_id
                gender
                account_type
              }
            }
          }
        `,
        variables: {
          input_json: {
            user_id: profileData.user_id,
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            gender: profileData.gender?.toUpperCase(),
            user_language: profileData.user_language.toLowerCase(),
            date_of_birth: profileData.date_of_birth
              ? new Date(profileData.date_of_birth).toISOString().split('T')[0]
              : null,
            email_id: profileData.email_id,
            phone_number: profileData.phone_number,
            registered_location: profileData.registered_location,
          },
        },
      }),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result = await response.json();
    if (result.errors)
      throw new Error(result.errors[0]?.message || 'Failed to update profile');

    return profileData;
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<ProfileData | null>) => {
      state.profile = action.payload;
    },
    clearProfile: (state) => {
      state.profile = null;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch profile';
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.error.message || 'Failed to update profile';
      });
  },
});

export const { setProfile, clearProfile, setError } = profileSlice.actions;

export default profileSlice.reducer;
