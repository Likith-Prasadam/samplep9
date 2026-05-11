import { useLazyQuery } from '@apollo/client';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { setLoginData, setAuthError } from '@/store/slices/auth-slice';
import { LOGIN_QUERY } from '../features/login/queries';
import type { LoginResponse } from '../features/login/types/types';
import { getUserTimezone } from '@/utils/timeUtils';
import { jwtDecode } from 'jwt-decode';

interface LoginVariables {
  username: string;
  password: string;
  timezone: string;
}

interface LoginData {
  login: LoginResponse;
}

/**
 * Login uses a lazy query so each submit runs a fresh network request.
 * A static useQuery + skip/hasExecuted pattern can leave Apollo serving a
 * cached error and skip refetches when variables match the failed attempt,
 * which made the Sign In button appear broken after a wrong password.
 */
export function useLoginQuery(onError?: (error: string) => void) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [runLogin, { data, loading, error }] = useLazyQuery<
    LoginData,
    LoginVariables
  >(LOGIN_QUERY, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (error) {
      console.error('Login error:', error);
      let msg = 'Login failed';
      if (error.message) {
        msg = error.message;
        const matchResult = msg.match(/\{.*\}/);
        if (matchResult) {
          try {
            const parsed = JSON.parse(matchResult[0].replace(/'/g, '"'));
            msg = parsed.error || 'Login failed';
          } catch {
            // Ignore parse errors
          }
        }
      }
      onError?.(msg);
      dispatch(setAuthError(msg));
    }
  }, [error, onError, dispatch]);

  useEffect(() => {
    if (!data?.login) return;

    const loginResponse = data.login;
    const {
      token,
      userHash,
      requiresSelection,
      userRoleCohortHash,
      userRoleCohortList,
    } = loginResponse;

    const availableRoles = Object.entries(userRoleCohortList || {}).map(
      ([hash, info]: [string, { role: string; cohort: string }]) => ({
        hash,
        role: info.role || 'Unknown',
        cohort: info.cohort || 'Unknown',
      })
    );

    if (!requiresSelection && userRoleCohortHash) {
      localStorage.setItem('access_token', token);
      localStorage.removeItem('selection_token');

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const decoded: any = jwtDecode(token);
        console.log('Decoded JWT token:', decoded);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let userDetails: any = {
          username: '',
          email: '',
          first_name: '',
          last_name: '',
        };

        if (decoded.user) {
          userDetails = {
            username: decoded.user.username || decoded.username || '',
            email:
              decoded.user.email_id ||
              decoded.user.email ||
              decoded.email_id ||
              decoded.email ||
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
              decoded.email_id || decoded.email || decoded.email_address || '',
            first_name: '',
            last_name: '',
            account_type: decoded.account_type || '',
          };
        }

        console.log('Extracted user details:', userDetails);

        const userData = {
          user_hash: userHash,
          username: userDetails.username,
          email: userDetails.email,
          first_name: userDetails.first_name,
          last_name: userDetails.last_name,
          user_id: userDetails.user_id || 0,
          cohort_id: userDetails.cohort_id || 0,
          account_type: userDetails.account_type || '',
          cohort_hash: userRoleCohortHash,
        };

        console.log('Storing user data in localStorage:', userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('Failed to decode JWT token:', e);
      }

      dispatch(
        setLoginData({
          userHash,
          availableRoles,
          currentRoleCohortHash: userRoleCohortHash,
        })
      );

      window.dispatchEvent(new CustomEvent('user-logged-in'));
      navigate('/playground', { replace: true });
    } else if (requiresSelection) {
      localStorage.setItem('selection_token', token);
      localStorage.removeItem('access_token');
      dispatch(
        setLoginData({
          userHash,
          availableRoles,
          currentRoleCohortHash: '',
        })
      );
      localStorage.setItem('loginResponse', JSON.stringify(loginResponse));

      navigate('/role-selection', { replace: true });
    } else {
      const msg = 'Invalid login response';
      onError?.(msg);
      dispatch(setAuthError(msg));
    }
  }, [data, dispatch, navigate, onError]);

  const login = (username: string, password: string) => {
    void runLogin({
      variables: {
        username,
        password,
        timezone: getUserTimezone(),
      },
    });
  };

  return { loading, login };
}
