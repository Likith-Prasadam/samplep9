import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLoginData, setAuthError } from '@/store/slices/auth-slice';
import type {
  LoginResponse,
  UserRoleCohortItem,
} from '@/features/login/types/types';

const REST_API_URL = import.meta.env.VITE_REST_API_URL;

interface MicrosoftLoginResponse {
  authorization_url: string;
  state: string;
}

interface MicrosoftCallbackResponse {
  access_token?: string;
  token_type?: string;
  expires_at?: string;
  user_hash?: string;
  user_role_cohort_hash?: string;
  requires_selection?: boolean;
  assignments?: Record<string, UserRoleCohortItem>;
  selection_token?: string;
  selection_expires_at?: string;
}

export function useMicrosoftSSO() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateMicrosoftLogin = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${REST_API_URL}api/v1/auth/microsoft/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initiate Microsoft login');
      }

      const data: MicrosoftLoginResponse = await response.json();

      // Store state for CSRF protection validation
      sessionStorage.setItem('microsoft_oauth_state', data.state);

      // Redirect to Microsoft login
      window.location.href = data.authorization_url;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Microsoft login failed';
      setError(errorMessage);
      dispatch(setAuthError(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  const handleMicrosoftCallback = useCallback(
    async (code: string, state: string) => {
      try {
        setLoading(true);
        setError(null);

        // Validate CSRF token
        const storedState = sessionStorage.getItem('microsoft_oauth_state');
        if (storedState !== state) {
          throw new Error('Invalid state token - CSRF protection failed');
        }

        const response = await fetch(
          `${REST_API_URL}api/v1/auth/microsoft/callback?code=${code}&state=${state}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Microsoft authentication failed');
        }

        const data: MicrosoftCallbackResponse = await response.json();

        // Handle single assignment
        if (
          data.access_token &&
          !data.requires_selection &&
          data.user_role_cohort_hash
        ) {
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('token_type', data.token_type || 'access');
          localStorage.removeItem('selection_token');

          const availableRoles = Object.entries(data.assignments || {}).map(
            ([hash, info]: [string, UserRoleCohortItem]) => ({
              hash,
              role: info.role || 'Unknown',
              cohort: info.cohort || 'Unknown',
            })
          );

          dispatch(
            setLoginData({
              userHash: data.user_hash || '',
              availableRoles,
              currentRoleCohortHash: data.user_role_cohort_hash,
            })
          );

          sessionStorage.removeItem('microsoft_oauth_state');
          window.dispatchEvent(new CustomEvent('user-logged-in'));
          navigate('/playground', { replace: true });
        }
        // Handle multiple assignments - requires role selection
        else if (data.selection_token && data.requires_selection) {
          localStorage.setItem('selection_token', data.selection_token);
          localStorage.removeItem('access_token');

          const loginResponse: LoginResponse = {
            token: data.selection_token,
            userHash: data.user_hash || '',
            userRoleCohortHash: null,
            tokenType: 'selection',
            expiresIn: data.selection_expires_at || '',
            requiresSelection: true,
            userRoleCohortList: data.assignments || {},
          };

          const availableRoles = Object.entries(data.assignments || {}).map(
            ([hash, info]: [string, UserRoleCohortItem]) => ({
              hash,
              role: info.role || 'Unknown',
              cohort: info.cohort || 'Unknown',
            })
          );

          dispatch(
            setLoginData({
              userHash: data.user_hash || '',
              availableRoles,
              currentRoleCohortHash: '',
            })
          );

          localStorage.setItem('loginResponse', JSON.stringify(loginResponse));
          sessionStorage.removeItem('microsoft_oauth_state');
          navigate('/role-selection', { replace: true });
        } else {
          throw new Error('Invalid authentication response');
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Microsoft authentication failed';
        setError(errorMessage);
        dispatch(setAuthError(errorMessage));
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    },
    [navigate, dispatch]
  );

  return {
    loading,
    error,
    initiateMicrosoftLogin,
    handleMicrosoftCallback,
  };
}
