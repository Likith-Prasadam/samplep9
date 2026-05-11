import { useMutation } from '@apollo/client';
import { REFRESH_TOKEN_MUTATION } from '@/features/login/queries';

interface RefreshTokenVariables {
  token: string;
  timezone: string;
}

interface RefreshTokenData {
  refresh_token: {
    token: string;
    expires_in: string;
  };
}

/**
 * Hook to refresh the access token with a new timezone.
 * Call this when the user changes timezone from the topbar so the backend
 * can keep the session in sync with the selected timezone.
 */
export function useRefreshToken() {
  const [executeRefresh] = useMutation<RefreshTokenData, RefreshTokenVariables>(
    REFRESH_TOKEN_MUTATION
  );

  const refreshTokenWithTimezone = async (
    timezone: string
  ): Promise<boolean> => {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const result = await executeRefresh({
        variables: { token, timezone },
      });

      const newToken = result.data?.refresh_token?.token;
      if (newToken) {
        localStorage.setItem('access_token', newToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return { refreshTokenWithTimezone };
}
