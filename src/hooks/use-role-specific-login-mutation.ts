import { useMutation } from '@apollo/client';
import { useDispatch } from 'react-redux';
import {
  setLoginData,
  setAuthLoading,
  setAuthError,
} from '@/store/slices/auth-slice';
import { ROLE_SPECIFIC_LOGIN_QUERY } from '@/features/login/queries';
import type { RoleSpecificLoginResponse } from '@/features/login/types/types';

interface RoleSpecificLoginData {
  roleSpecificLogin: RoleSpecificLoginResponse;
}

interface RoleSpecificLoginVariables {
  userRoleCohortHash: string;
}

export function useRoleSpecificLoginMutation() {
  const dispatch = useDispatch();

  const [executeQuery, { loading, error }] = useMutation<
    RoleSpecificLoginData,
    RoleSpecificLoginVariables
  >(ROLE_SPECIFIC_LOGIN_QUERY, {
    context: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('selection_token')}`,
      },
    },
  });

  const selectRole = async (userRoleCohortHash: string) => {
    try {
      dispatch(setAuthLoading(true));

      const result = await executeQuery({
        variables: { userRoleCohortHash },
        context: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('selection_token')}`,
          },
        },
      });

      if (result.data?.roleSpecificLogin) {
        const {
          token,
          userHash,
          userRoleCohortHash: hash,
          userRoleCohortList,
        } = result.data.roleSpecificLogin;

        // Clear selection token and set access token
        localStorage.removeItem('selection_token');
        localStorage.setItem('access_token', token);

        // Convert role list to Redux format
        const availableRoles = Object.entries(userRoleCohortList || {}).map(
          ([roleHash, info]: [string, { role?: string; cohort?: string }]) => ({
            hash: roleHash,
            role: info.role || 'Unknown',
            cohort: info.cohort || 'Unknown',
          })
        );

        // Store all login data in Redux
        dispatch(
          setLoginData({
            userHash,
            availableRoles,
            currentRoleCohortHash: hash,
          })
        );

        dispatch(setAuthLoading(false));
        window.dispatchEvent(new CustomEvent('user-logged-in'));
      }

      return result.data;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Role selection failed';
      console.error('Role selection failed:', err);
      dispatch(setAuthError(errorMsg));
      dispatch(setAuthLoading(false));
      throw err;
    }
  };

  return { selectRole, loading, error };
}
