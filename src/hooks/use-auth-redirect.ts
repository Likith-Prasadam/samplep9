import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import type { RootState } from '@/store';
import type { JwtPayload } from '@/features/login/types/types';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      navigate('/playground', { replace: true });
      return;
    }

    const token = localStorage.getItem('access_token');
    if (isTokenValid(token)) {
      navigate('/playground', { replace: true });
      return;
    } else if (token) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_hash');
    }
  }, [navigate, user]);
}

function isTokenValid(token: string | null): boolean {
  if (!token) return false;

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return false;
    return Date.now() < decoded.exp * 1000;
  } catch {
    return false;
  }
}
