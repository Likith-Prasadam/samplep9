import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_USER } from '@/graphql/mutations';
import { toast } from 'sonner';
import { handlePermissionError } from '@/utils/handle-permission-error';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UserDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  userHash: string;
  orgCohortHash: string;
  userName: string;
  userId?: string | number; // Optional fallback identifier
  onDeleteSuccess?: () => void; // Callback to refresh data after deletion
}

const UserDeleteDialog = ({
  open,
  onClose,
  userHash,
  orgCohortHash,
  userName,
  userId,
  onDeleteSuccess,
}: UserDeleteDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [deleteUserMutation] = useMutation(DELETE_USER, {
    // Refresh is handled by onDeleteSuccess callback which calls onRefresh → dispatch(fetchUsers(...))
  });

  const handleConfirm = async () => {
    // Validate userHash exists before proceeding
    if (!userHash || userHash.trim() === '') {
      const debugInfo = {
        userHash,
        userId,
        userName,
      };
      console.error('userHash is missing. Debug info:', debugInfo);
      toast.error('User hash is missing. Cannot delete user.');
      return;
    }

    setLoading(true);
    try {
      // Call the GraphQL mutation to delete the user
      const response = await deleteUserMutation({
        variables: { userHash, orgCohortHash },
      });

      // Check if deletion was successful (response is Boolean true)
      const isDeleted = response.data?.deleteUser;

      if (isDeleted) {
        // Show success message
        toast.success(`User '${userName}' has been successfully deleted.`, {
          position: 'bottom-center',
          className: 'bg-teal-600 text-white',
          duration: 3000,
        });

        // Wait a brief moment to ensure refetch completes, then call callback
        setTimeout(() => {
          if (onDeleteSuccess) {
            onDeleteSuccess();
          }
          // Close the dialog
          onClose();
        }, 300);
      } else {
        toast.error('Failed to delete user. Please try again.');
      }
    } catch (err) {
      if (handlePermissionError(err)) {
        onClose();
        return;
      }
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete user';

      // Handle specific error cases
      if (errorMessage.includes('User not found')) {
        toast.error('User not found. The user may have already been deleted.');
      } else if (errorMessage.includes('already deleted')) {
        toast.error('This user has already been deleted.');
      } else if (
        errorMessage.includes('permission') ||
        errorMessage.includes('ADMIN')
      ) {
        toast.error(
          'You do not have permission to delete users. Only administrators can delete users.'
        );
      } else {
        console.error('Delete failed:', err);
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <span className="font-semibold">{userName}</span>?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDeleteDialog;
