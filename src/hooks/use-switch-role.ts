import { useMutation, useApolloClient } from '@apollo/client';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { setCurrentRole, setAuthError } from '@/store/slices/auth-slice';
import type { RootState } from '@/store';
import { SWITCH_ASSIGNMENT } from '@/graphql/auth_mutations';

interface SwitchAssignmentResponse {
  switchAssignment: {
    token: string;
    userHash: string;
    userRoleCohortHash: string;
    tokenType: 'access';
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

interface SwitchAssignmentVariables {
  userRoleCohortHash: string;
}

export function useSwitchRole() {
  const dispatch = useDispatch();
  const apolloClient = useApolloClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingRoles = useSelector(
    (state: RootState) => state.auth.availableRoles
  );

  const [switchAssignmentMutation] = useMutation<
    SwitchAssignmentResponse,
    SwitchAssignmentVariables
  >(SWITCH_ASSIGNMENT);

  const switchRole = async (userRoleCohortHash: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(
        '📍 Current token:',
        localStorage.getItem('access_token')?.substring(0, 20) + '...'
      );
      console.log('💾 Existing roles in Redux:', existingRoles.length);

      const response = await switchAssignmentMutation({
        variables: { userRoleCohortHash },
        fetchPolicy: 'no-cache',
        context: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          },
        },
      });

      if (response.data?.switchAssignment) {
        const {
          token,
          userRoleCohortHash: hash,
          userRoleCohortList,
        } = response.data.switchAssignment;

        console.log('🎯 New token received:', token?.substring(0, 20) + '...');
        console.log(
          '📋 Roles from API response:',
          Object.keys(userRoleCohortList).length
        );

        localStorage.setItem('access_token', token);

        const currentRoleInfo = userRoleCohortList[hash];
        const apiRoles = Object.entries(userRoleCohortList).map(
          ([roleHash, info]) => ({
            hash: roleHash,
            role: info.role,
            cohort: info.cohort,
          })
        );

        const availableRoles = apiRoles.length > 1 ? apiRoles : existingRoles;

        console.log('📦 Final roles for Redux:', availableRoles.length);
        console.log(
          '  - Using from:',
          apiRoles.length > 1 ? 'API response' : 'existing Redux state'
        );

        const currentRole = availableRoles.find((r) => r.hash === hash);

        console.log('✓ Current role found:', currentRole);
        if (currentRole) {
          localStorage.setItem('selected_role', currentRole.role);
        }

        dispatch(
          setCurrentRole({
            currentRoleCohortHash: hash,
            role: currentRole!,
            availableRoles: availableRoles,
          })
        );

        apolloClient.resetStore();

        window.dispatchEvent(
          new CustomEvent('role-switched', {
            detail: {
              userRoleCohortHash: hash,
              role: currentRoleInfo?.role,
              cohort: currentRoleInfo?.cohort,
            },
          })
        );

        setIsLoading(false);
        return response.data.switchAssignment;
      } else {
        console.error('❌ No switchAssignment data in response');
        throw new Error('No data returned from role switch');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to switch role';
      console.error('❌ Role switch error:', err);
      setError(errorMessage);
      dispatch(setAuthError(errorMessage));
      setIsLoading(false);
      throw err;
    }
  };

  return {
    switchRole,
    isLoading,
    error,
  };
}
