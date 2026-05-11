import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '@/store';
import { useSwitchRole } from '@/hooks/use-switch-role';
import { setLoginData } from '@/store/slices/auth-slice';
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Building2, Loader2, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSwitcher() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { switchRole, isLoading, error } = useSwitchRole();

  const { currentRoleCohortHash, availableRoles } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (availableRoles.length === 0 || !currentRoleCohortHash) {
      const authState = localStorage.getItem('auth_state');
      let restoredRoles: Array<{ hash: string; role: string; cohort: string }> =
        [];
      let restoredCurrentHash: string | null = null;
      let restoredUserHash: string | null = null;

      if (authState) {
        try {
          const parsed = JSON.parse(authState);
          if (parsed.availableRoles && Array.isArray(parsed.availableRoles)) {
            restoredRoles = parsed.availableRoles;
          }
          if (parsed.currentRoleCohortHash) {
            restoredCurrentHash = parsed.currentRoleCohortHash;
          }
          if (parsed.userHash) {
            restoredUserHash = parsed.userHash;
          }
        } catch (e) {
          console.error('Failed to parse auth_state from localStorage:', e);
        }
      }

      if (restoredRoles.length > 0 && restoredCurrentHash && restoredUserHash) {
        dispatch(
          setLoginData({
            userHash: restoredUserHash,
            availableRoles: restoredRoles,
            currentRoleCohortHash: restoredCurrentHash,
          })
        );
      } else {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken) {
          try {
            const parts = accessToken.split('.');
            if (parts.length === 3) {
              const decoded = JSON.parse(atob(parts[1]));
              if (
                decoded?.role?.role_hash &&
                decoded?.cohort?.org_cohort_hash
              ) {
                const singleRole = [
                  {
                    hash: decoded.cohort.org_cohort_hash,
                    role:
                      decoded.role.role_name ||
                      decoded.role.roleName ||
                      'ADMIN',
                    cohort:
                      decoded.cohort.org_cohort_name ||
                      decoded.cohort.orgCohortName ||
                      'Default',
                  },
                ];
                dispatch(
                  setLoginData({
                    userHash: decoded.user?.user_hash || '',
                    availableRoles: singleRole,
                    currentRoleCohortHash: decoded.cohort.org_cohort_hash,
                  })
                );
              }
            }
          } catch (e) {
            console.error('Failed to decode access token:', e);
          }
        }
      }
    }
  }, [dispatch, availableRoles.length, currentRoleCohortHash]);

  const handleRoleSwitch = async (hash: string) => {
    try {
      await switchRole(hash);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  return (
    <div className="relative px-3 pb-2 pt-1">
      {isLoading ? (
        <div className="absolute right-3 top-1 z-10 flex h-6 items-center">
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Switching role…</span>
        </div>
      ) : null}

      <DropdownMenuRadioGroup
        value={currentRoleCohortHash || ''}
        onValueChange={handleRoleSwitch}
        className="max-h-[min(320px,calc(100vh-12rem))] space-y-0.5 overflow-y-auto overscroll-contain py-0.5"
      >
        {availableRoles.length > 0 ? (
          availableRoles.map((role) => {
            const active = role.hash === currentRoleCohortHash;
            return (
              <DropdownMenuRadioItem
                key={role.hash}
                value={role.hash}
                disabled={isLoading}
                className={cn(
                  'relative cursor-pointer rounded-md py-2 pl-2.5 pr-2 text-left outline-none transition-colors',
                  '[&>span:first-child]:hidden',
                  'data-[state=checked]:bg-muted/70 data-[highlighted]:bg-muted/55',
                  'focus:bg-muted/55'
                )}
              >
                <div className="flex w-full min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'
                    )}
                  >
                    <Building2 className="h-4 w-4 opacity-80" />
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p
                      className={cn(
                        'truncate text-sm leading-tight text-foreground',
                        active ? 'font-semibold' : 'font-medium'
                      )}
                    >
                      {role.cohort}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {role.role}
                    </p>
                  </div>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {active ? (
                      <Check
                        className="h-4 w-4 text-foreground"
                        strokeWidth={2.25}
                        aria-hidden
                      />
                    ) : null}
                  </div>
                </div>
              </DropdownMenuRadioItem>
            );
          })
        ) : (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No roles available
          </div>
        )}
      </DropdownMenuRadioGroup>

      {error ? (
        <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/5 px-2.5 py-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span className="text-xs leading-snug text-destructive">{error}</span>
        </div>
      ) : null}
    </div>
  );
}
