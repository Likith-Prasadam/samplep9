import { useLazyQuery } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect, useCallback } from 'react';
import { setUser, setLoginData } from '@/store/slices/auth-slice';
import { ROLE_SPECIFIC_LOGIN_QUERY } from '../features/login/queries';
import type {
  RoleSpecificLoginResponse,
  LoginResponse,
} from '../features/login/types/types';
import { jwtDecode } from 'jwt-decode';

interface RoleSpecificLoginData {
  roleSpecificLogin: RoleSpecificLoginResponse;
}

interface RoleSpecificLoginVariables {
  userRoleCohortHash: string;
}

interface JwtPayloadWithUser {
  userHash?: string;
  username?: string;
  account_type?: string;
  roles?: string[];
  user?: {
    userHash?: string;
    username?: string;
    display_name?: string;
    email_id?: string;
    first_name?: string;
    last_name?: string;
    account_type?: string;
    user_id?: string;
    cohort_id?: number;
  };
  exp?: number;
}

export function useRoleSpecificLogin(onError?: (error: string) => void) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [executeQueryInternal, { data, loading, error }] = useLazyQuery<
    RoleSpecificLoginData,
    RoleSpecificLoginVariables
  >(ROLE_SPECIFIC_LOGIN_QUERY);

  // Wrapper function to add authorization header
  const executeQuery = useCallback(
    (options: { variables?: RoleSpecificLoginVariables }) => {
      const selectionToken = localStorage.getItem('selection_token');

      if (!selectionToken) {
        const msg = 'No selection token found';
        console.error(msg);
        onError?.(msg);
        return;
      }

      console.log('🔐 Sending roleSpecificLogin with token:', {
        token: selectionToken.substring(0, 50) + '...',
        userRoleCohortHash: options.variables?.userRoleCohortHash,
        fullHeader: `Bearer ${selectionToken}`,
      });

      return executeQueryInternal({
        ...options,
        context: {
          headers: {
            Authorization: `Bearer ${selectionToken}`,
          },
        },
      });
    },
    [executeQueryInternal, onError]
  );

  useEffect(() => {
    if (error) {
      console.error('Role specific login error:', error);
      let msg = 'Role selection failed';
      if (error.message) {
        msg = error.message;
        const matchResult = msg.match(/\{.*\}/);
        if (matchResult) {
          try {
            const parsed = JSON.parse(matchResult[0].replace(/'/g, '"'));
            msg = parsed.error || 'Role selection failed';
          } catch {
            // Fallback
          }
        }
      }
      onError?.(msg);
    }
  }, [error, onError]);

  useEffect(() => {
    if (data?.roleSpecificLogin) {
      const { token, userHash } = data.roleSpecificLogin;

      localStorage.removeItem('selection_token');
      localStorage.setItem('access_token', token);
      localStorage.setItem('user_hash', userHash);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let userDetails: any = {
        username: '',
        email: '',
        first_name: '',
        last_name: '',
      };

      try {
        const decoded = jwtDecode<JwtPayloadWithUser>(token);
        console.log('Decoded JWT token:', decoded);
        if (decoded.user) {
          userDetails = {
            username: decoded.user.username || decoded.username || '',
            email:
              decoded.user.email_id ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded.user as any).email ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded as any).email_id ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded as any).email ||
              '',
            first_name: decoded.user.first_name || '',
            last_name: decoded.user.last_name || '',
            user_id: decoded.user.user_id,
            cohort_id: decoded.user.cohort_id,
            account_type:
              decoded.user.account_type || decoded.account_type || '',
          };
        } else {
          userDetails = {
            username: decoded.username || '',
            email:
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded as any).email_id ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded as any).email ||
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (decoded as any).email_address ||
              '',
            first_name: '',
            last_name: '',
            account_type: decoded.account_type || '',
          };
        }
        console.log('Extracted user details:', userDetails);
      } catch (e) {
        console.error('Failed to decode JWT token:', e);
      }

      const loginResponseStr = localStorage.getItem('loginResponse');
      let currentRoleCohortHash = '';
      let availableRoles: Array<{
        hash: string;
        role: string;
        cohort: string;
      }> = [];

      if (loginResponseStr) {
        try {
          const loginResponse: LoginResponse = JSON.parse(loginResponseStr);
          const { userRoleCohortList } = loginResponse;

          availableRoles = Object.entries(userRoleCohortList || {}).map(
            ([hash, info]) => ({
              hash,
              role: info.role || 'Unknown',
              cohort: info.cohort || 'Unknown',
            })
          );

          const selectedHashFromStorage =
            localStorage.getItem('selected_role_hash');
          if (selectedHashFromStorage) {
            currentRoleCohortHash = selectedHashFromStorage;
            localStorage.removeItem('selected_role_hash');

            const selectedRoleInfo = availableRoles.find(
              (r) => r.hash === currentRoleCohortHash
            );
            if (selectedRoleInfo) {
              localStorage.setItem('selected_role', selectedRoleInfo.role);
            }
          }
        } catch (error) {
          console.error('Failed to parse login response:', error);
        }
        localStorage.removeItem('loginResponse');
      }

      const userData = {
        user_hash: userHash,
        username: userDetails.username,
        email: userDetails.email,
        first_name: userDetails.first_name,
        last_name: userDetails.last_name,
        user_id: userDetails.user_id || 0,
        cohort_id: userDetails.cohort_id || 0,
        account_type: userDetails.account_type || '',
        cohort_hash: currentRoleCohortHash,
      };

      console.log('Storing user data in localStorage:', userData);
      localStorage.setItem('user', JSON.stringify(userData));

      dispatch(
        setUser({
          username: userDetails.username,
          roles: [],
          first_name: userDetails.first_name,
          last_name: userDetails.last_name,
          user_hash: userHash,
          user_id: userDetails.user_id || 0,
          cohort_hash: currentRoleCohortHash,
          cohort_id: userDetails.cohort_id || 0,
        })
      );

      // Set login data with current role and available roles
      if (currentRoleCohortHash && availableRoles.length > 0) {
        dispatch(
          setLoginData({
            userHash,
            availableRoles,
            currentRoleCohortHash,
          })
        );
      }

      window.dispatchEvent(new CustomEvent('user-logged-in'));
      navigate('/playground', { replace: true });
    }
  }, [data, dispatch, navigate]);

  return { loading, executeQuery };
}
