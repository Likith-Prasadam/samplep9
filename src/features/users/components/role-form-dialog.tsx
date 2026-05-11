import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery } from '@apollo/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CREATE_ROLE, UPDATE_ROLE, GET_ROLES } from '@/graphql/roles_queries';
import { toast } from 'sonner';
import { handlePermissionError } from '@/utils/handle-permission-error';

const PARENT_ROLE_NONE = '__none__';

export interface RoleRecord {
  roleHash: string;
  roleName: string;
  description?: string | null;
  parentRoleHash?: string | null;
  accessLevel?: string | null;
}

type FormValues = {
  roleName: string;
  description: string;
  parentRoleHash: string;
  accessLevel: string;
};

type RoleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleRecord | null;
  onSuccess: () => void;
};

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleFormDialogProps) {
  const isEdit = !!role?.roleHash;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      roleName: '',
      description: '',
      parentRoleHash: PARENT_ROLE_NONE,
      accessLevel: '',
    },
  });

  const { data: rolesData } = useQuery(GET_ROLES, {
    variables: { page: 1, itemsPerPage: 100 },
    skip: !open,
  });

  const roles: RoleRecord[] =
    rolesData?.getRoles?.roles ?? rolesData?.getRoles ?? [];

  const [createRole, { loading: creating }] = useMutation(CREATE_ROLE, {
    onCompleted: () => {
      toast.success('Role created');
      onSuccess();
      onOpenChange(false);
      reset();
    },
    onError: (e) => {
      if (handlePermissionError(e)) return;
      toast.error(e.message ?? 'Failed to create role');
    },
  });

  const [updateRole, { loading: updating }] = useMutation(UPDATE_ROLE, {
    onCompleted: () => {
      toast.success('Role updated');
      onSuccess();
      onOpenChange(false);
      reset();
    },
    onError: (e) => {
      if (handlePermissionError(e)) return;
      toast.error(e.message ?? 'Failed to update role');
    },
  });

  useEffect(() => {
    if (open && role) {
      reset({
        roleName: role.roleName ?? '',
        description: role.description ?? '',
        parentRoleHash: role.parentRoleHash ?? PARENT_ROLE_NONE,
        accessLevel: role.accessLevel ?? '',
      });
    } else if (open && !role) {
      reset({
        roleName: '',
        description: '',
        parentRoleHash: PARENT_ROLE_NONE,
        accessLevel: '',
      });
    }
  }, [open, role, reset]);

  const toParentRoleValue = (v: string) =>
    v === PARENT_ROLE_NONE || !v ? undefined : v;

  const onSubmit = (values: FormValues) => {
    if (isEdit && role) {
      updateRole({
        variables: {
          input: {
            roleHash: role.roleHash,
            roleName: values.roleName || undefined,
            description: values.description || undefined,
            parentRoleHash: toParentRoleValue(values.parentRoleHash),
          },
        },
      });
    } else {
      createRole({
        variables: {
          input: {
            roleName: values.roleName,
            description: values.description || undefined,
            parentRoleHash: toParentRoleValue(values.parentRoleHash),
            accessLevel: values.accessLevel || undefined,
          },
        },
      });
    }
  };

  const loading = isSubmitting || creating || updating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Role' : 'Add Role'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update role name, description, or parent role.'
              : 'Create a new role. Optionally set a parent role for hierarchy.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="roleName">Role name *</Label>
            <Controller
              name="roleName"
              control={control}
              rules={{ required: 'Role name is required' }}
              render={({ field }) => (
                <Input
                  id="roleName"
                  placeholder="e.g. ANALYST"
                  {...field}
                  disabled={loading}
                />
              )}
            />
            {errors.roleName && (
              <p className="text-sm text-destructive">
                {errors.roleName.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input
                  id="description"
                  placeholder="Optional description"
                  {...field}
                  disabled={loading}
                />
              )}
            />
          </div>
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="accessLevel">Access level</Label>
              <Controller
                name="accessLevel"
                control={control}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    disabled={loading}
                  >
                    <SelectTrigger id="accessLevel">
                      <SelectValue placeholder="Select access level (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant">tenant</SelectItem>
                      <SelectItem value="platform">platform</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="parentRoleHash">Parent role</Label>
            <Controller
              name="parentRoleHash"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={(v) => field.onChange(v)}
                  value={field.value || PARENT_ROLE_NONE}
                  disabled={loading}
                >
                  <SelectTrigger id="parentRoleHash">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PARENT_ROLE_NONE}>None</SelectItem>
                    {roles
                      .filter((r) => r.roleHash !== role?.roleHash)
                      .map((r) => (
                        <SelectItem key={r.roleHash} value={r.roleHash}>
                          {r.roleName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Add Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
