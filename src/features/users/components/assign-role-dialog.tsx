import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ApolloError } from '@apollo/client';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GET_ROLES } from '@/graphql/roles_queries';
import {
  ADMIN_ASSIGN_ROLE_TO_USER,
  REMOVE_ROLE_FROM_USER,
} from '@/graphql/mutations';
import { toast } from 'sonner';
import { handlePermissionError } from '@/utils/handle-permission-error';

export interface User {
  userHash: string;
  displayName: string;
  emailId: string;
}

export interface RoleAssignment {
  userRoleCohortHash?: string;
  roleHash: string;
  roleName: string;
  cohortHash?: string;
  cohortName?: string;
  isNew?: boolean;
}

export interface Role {
  roleHash: string;
  roleName: string;
  description?: string;
}

type AssignRoleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  cohortHash: string;
  userRoles?: RoleAssignment[];
  onSuccess: () => void;
};

export function AssignRoleDialog({
  open,
  onOpenChange,
  user,
  cohortHash,
  userRoles = [],
  onSuccess,
}: AssignRoleDialogProps) {
  const [selectedRoleHash, setSelectedRoleHash] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [assignedRoles, setAssignedRoles] = useState<RoleAssignment[]>([]);
  // Track hashes removed during this dialog session so they hide immediately
  const [removedHashes, setRemovedHashes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setAssignedRoles([]);
      setSelectedRoleHash('');
      setRemovedHashes(new Set());
    }
  }, [open]);

  const { data: rolesData, loading: rolesLoading } = useQuery(GET_ROLES, {
    variables: { page: 1, itemsPerPage: 100 },
    skip: !open,
  });

  const [assignRole, { loading: isAssigning }] = useMutation(
    ADMIN_ASSIGN_ROLE_TO_USER,
    {
      // Refresh is handled via onSuccess → onRefresh → dispatch(fetchUsers(...))
      onCompleted: (data) => {
        const result = data?.adminAssignRoleToUser;
        if (result?.userRoleCohortHash) {
          setAssignedRoles((prev) => [
            ...prev,
            {
              userRoleCohortHash: result.userRoleCohortHash,
              roleHash: result.roleHash,
              roleName: result.roleName,
            },
          ]);
        }
        toast.success(
          `Role assigned to ${user?.displayName || 'user'} successfully`,
          {
            position: 'bottom-center',
            className: 'bg-teal-600 text-white',
            duration: 3000,
          }
        );
        setSelectedRoleHash('');
        // Refresh the table so the new role is visible immediately
        onSuccess();
      },
      onError: (error: ApolloError) => {
        if (handlePermissionError(error)) return;
        const rawMessage =
          error?.graphQLErrors?.[0]?.message || error?.message || '';
        let errorMessage = 'Failed to assign role';

        if (rawMessage.includes('User not found')) {
          errorMessage = 'User not found. Please refresh and try again.';
        } else if (rawMessage.includes('Role not found')) {
          errorMessage =
            'Selected role not found. Please refresh and try again.';
        } else if (rawMessage.includes('not in your cohort')) {
          errorMessage =
            'User is not in your cohort. You can only assign roles to users in your cohort.';
        } else if (rawMessage.includes('already has')) {
          errorMessage = `User already has this role in their cohort.`;
        } else if (rawMessage) {
          errorMessage = rawMessage;
        }

        toast.error(errorMessage, {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 4000,
        });
      },
    }
  );

  const [removeRole, { loading: isRemoving }] = useMutation(
    REMOVE_ROLE_FROM_USER,
    {
      // Refresh is handled via onSuccess → onRefresh → dispatch(fetchUsers(...))
      onCompleted: () => {
        toast.success('Role removed successfully', {
          position: 'bottom-center',
          duration: 3000,
        });
        onSuccess();
      },
      onError: (error) => {
        if (handlePermissionError(error)) return;
        toast.error(error.message || 'Failed to remove role', {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 4000,
        });
      },
    }
  );

  const handleRemoveRole = (userRoleCohortHash: string) => {
    const visibleCount =
      userRoles.filter(
        (r) => !r.userRoleCohortHash || !removedHashes.has(r.userRoleCohortHash)
      ).length +
      assignedRoles.filter(
        (r) => !r.userRoleCohortHash || !removedHashes.has(r.userRoleCohortHash)
      ).length;

    if (visibleCount <= 1) {
      toast.error("You can't delete the last role", {
        position: 'bottom-center',
        duration: 3000,
      });
      return;
    }

    // Optimistically hide the role from both local state and the prop-derived list
    setAssignedRoles((prev) =>
      prev.filter((r) => r.userRoleCohortHash !== userRoleCohortHash)
    );
    setRemovedHashes((prev) => new Set(prev).add(userRoleCohortHash));
    removeRole({
      variables: { userRoleCohortHash },
    });
  };

  useEffect(() => {
    if (rolesData) {
      const rolesList =
        rolesData?.getRoles?.roles ||
        rolesData?.roles?.fetch_data_by_filters_roles?.roles ||
        rolesData?.roles ||
        [];

      if (Array.isArray(rolesList) && rolesList.length > 0) {
        setRoles(
          rolesList
            .filter(
              (role: Role) => role.roleHash && role.roleHash.trim() !== ''
            )
            .map((role: Role) => ({
              roleHash: role.roleHash,
              roleName: role.roleName,
              description: role.description,
            }))
        );
      }
    }
  }, [rolesData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.userHash) {
      toast.error('User information is missing', {
        position: 'bottom-center',
        duration: 3000,
      });
      return;
    }

    if (!selectedRoleHash) {
      toast.error('Please select a role', {
        position: 'bottom-center',
        duration: 3000,
      });
      return;
    }

    assignRole({
      variables: {
        input: {
          userHash: user.userHash,
          roleHash: selectedRoleHash,
          cohortHash,
        },
      },
    });
  };

  const selectedRoleName = roles.find(
    (r) => r.roleHash === selectedRoleHash
  )?.roleName;
  const isLoading = isAssigning || isRemoving || rolesLoading;

  // Combine previous and new roles; filter out any that were removed this session
  const allRoles = [
    ...userRoles
      .filter(
        (r) => !r.userRoleCohortHash || !removedHashes.has(r.userRoleCohortHash)
      )
      .map((r) => ({ ...r, isNew: false })),
    ...assignedRoles
      .filter(
        (r) => !r.userRoleCohortHash || !removedHashes.has(r.userRoleCohortHash)
      )
      .map((r) => ({ ...r, isNew: true })),
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage User Roles</DialogTitle>
          <DialogDescription>
            {user
              ? `Managing roles for ${user.displayName}`
              : 'Select a user and role to manage'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Information (Read-only display) */}
          {user && (
            <div className="space-y-2 bg-muted p-3 rounded-md">
              <div className="text-sm font-medium">{user.displayName}</div>
              <div className="text-sm text-muted-foreground">
                {user.emailId}
              </div>
            </div>
          )}

          {allRoles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Current Roles</Label>
              <div className="space-y-2">
                {allRoles.map((role, index) => (
                  <div
                    key={`${role.roleHash}-${role.cohortHash || role.userRoleCohortHash || index}`}
                    className="flex items-center justify-between bg-muted p-2 rounded-md"
                  >
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {role.roleName}
                        </span>
                        {role.isNew && (
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            New
                          </span>
                        )}
                      </div>
                      {role.cohortName && (
                        <div className="text-xs text-muted-foreground">
                          {role.cohortName}
                        </div>
                      )}
                    </div>
                    {role.userRoleCohortHash && (
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveRole(role.userRoleCohortHash!)
                        }
                        disabled={isRemoving}
                        className="ml-2 p-1 hover:bg-red-100 rounded-md text-red-500 transition-colors disabled:opacity-50"
                        title="Remove role"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assign New Role Section */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="roleHash">Assign New Role</Label>
                <span className="text-red-500">*</span>
              </div>
              <Select
                onValueChange={setSelectedRoleHash}
                value={selectedRoleHash}
                disabled={isLoading}
              >
                <SelectTrigger id="roleHash">
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  {rolesLoading ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Loading roles...
                    </div>
                  ) : roles.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No roles available
                    </div>
                  ) : (
                    roles.map((role) => (
                      <SelectItem key={role.roleHash} value={role.roleHash}>
                        <div className="flex flex-col">
                          <span>{role.roleName}</span>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {selectedRoleName && (
                <p className="text-sm text-muted-foreground">
                  Assigning:{' '}
                  <span className="font-semibold">{selectedRoleName}</span>
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  setSelectedRoleHash('');
                }}
                disabled={isLoading}
              >
                Close
              </Button>
              <Button type="submit" disabled={isLoading || !selectedRoleHash}>
                {isAssigning ? 'Assigning...' : 'Assign Role'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
