import { useState } from 'react';
import { type Table } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { DELETE_USER } from '@/graphql/mutations';

type UserMultiDeleteDialogProps<TData> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
  orgCohortHash: string;
  onRefresh?: () => void;
};

const CONFIRM_WORD = 'DELETE';

export function UsersMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
  orgCohortHash,
  onRefresh,
}: UserMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('');
  const [deleteUser] = useMutation(DELETE_USER);

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`);
      return;
    }

    onOpenChange(false);

    const deletePromises = selectedRows.map((row) => {
      const userData = row.original as {
        user_hash?: string;
        userHash?: string;
      };
      const userHash = userData.user_hash || userData.userHash;
      return deleteUser({
        variables: { userHash, orgCohortHash },
      });
    });

    toast.promise(Promise.all(deletePromises), {
      loading: `Deleting ${selectedRows.length} user${selectedRows.length > 1 ? 's' : ''}...`,
      success: () => {
        table.resetRowSelection();
        onRefresh?.();
        setValue('');
        return `Successfully deleted ${selectedRows.length} user${selectedRows.length > 1 ? 's' : ''}`;
      },
      error: (err) => {
        console.error('Bulk delete error:', err);
        return 'Failed to delete some or all users. Please try again.';
      },
    });
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className="text-destructive">
          <AlertTriangle
            className="stroke-destructive me-1 inline-block"
            size={18}
          />{' '}
          Delete {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'users' : 'user'}
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete the selected users? <br />
          </p>

          <Label className="my-4 flex flex-col items-start gap-1.5">
            <span className="">Confirm by typing "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
            />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText="Delete"
      destructive
    />
  );
}
