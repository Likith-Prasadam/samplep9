import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleSpecificLoginMutation } from '@/hooks/use-role-specific-login-mutation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import type { UserRoleCohortList } from '@/features/login/types/types';

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const { selectRole, loading } = useRoleSpecificLoginMutation();
  const [roles, setRoles] = useState<
    Array<{
      hash: string;
      role: string;
      cohort: string;
    }>
  >([]);

  useEffect(() => {
    const loginResponse = localStorage.getItem('loginResponse');
    if (!loginResponse) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(loginResponse);
      const roleList: UserRoleCohortList = parsed.userRoleCohortList || {};

      const roleArray = Object.entries(roleList).map(([hash, info]) => ({
        hash,
        role: info.role,
        cohort: info.cohort,
      }));

      setRoles(roleArray);
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSelectRole = async (hash: string) => {
    try {
      await selectRole(hash);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Failed to select role:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Select Your Role</CardTitle>
          <CardDescription>
            Choose which role you want to access with your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No roles available</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {roles.map((roleOption) => (
                <Button
                  key={roleOption.hash}
                  variant="outline"
                  className="h-auto flex flex-col items-start justify-start p-4 gap-2"
                  onClick={() => handleSelectRole(roleOption.hash)}
                  disabled={loading}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{roleOption.role}</p>
                      <p className="text-sm text-muted-foreground">
                        {roleOption.cohort}
                      </p>
                    </div>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RoleSelectionPage;
