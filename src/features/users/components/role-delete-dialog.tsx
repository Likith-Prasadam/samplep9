import { useMutation } from '@apollo/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DELETE_ROLE } from '@/graphql/roles_queries';
import { toast } from 'sonner';
import { handlePermissionError } from '@/utils/handle-permission-error';

export interface RoleRecord {
  roleHash: string;
  roleName: string;
  description?: string | null;
  parentRoleHash?: string | null;
}

type RoleDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: RoleRecord | null;
  onSuccess: () => void;
};

export function RoleDeleteDialog({
  open,
  onOpenChange,
  role,
  onSuccess,
}: RoleDeleteDialogProps) {
  const [deleteRole, { loading }] = useMutation(DELETE_ROLE, {
    onCompleted: () => {
      toast.success('Role deleted');
      onSuccess();
      onOpenChange(false);
    },
    onError: (e) => {
      if (handlePermissionError(e)) return;
      const rawMessage =
        e?.graphQLErrors?.[0]?.message || e.message || 'Failed to delete role';
      const normalized = rawMessage.toLowerCase();
      const isInUse =
        normalized.includes('assigned') ||
        normalized.includes('in use') ||
        normalized.includes('role has') ||
        normalized.includes('constraint');

      toast.error(
        isInUse
          ? 'This role is assigned to one or more users. Remove it from users before deleting.'
          : rawMessage
      );
    },
  });

  const handleDelete = () => {
    if (!role?.roleHash) return;
    deleteRole({ variables: { roleHash: role.roleHash } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete role</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the role &quot;{role?.roleName}
            &quot;?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
