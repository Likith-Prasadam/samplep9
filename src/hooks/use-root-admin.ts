import { useMemo } from 'react';
import { useAppSelector } from '@/store';

export function useIsRootAdmin(): boolean {
  const currentRoleCohortHash = useAppSelector(
    (s) => s.auth.currentRoleCohortHash
  );

  return useMemo(() => {
    try {
      const selectedRole = (localStorage.getItem('selected_role') || 'USER')
        .toString()
        .toUpperCase();
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}') || {};
      const isRoot = storedUser?.is_root !== false;
      return selectedRole === 'ADMIN' && !!isRoot && !!currentRoleCohortHash;
    } catch {
      return false;
    }
  }, [currentRoleCohortHash]);
}
