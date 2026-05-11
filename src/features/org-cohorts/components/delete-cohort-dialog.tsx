import { useAppDispatch, useAppSelector } from '@/store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { handlePermissionError } from '@/utils/handle-permission-error';
import { deleteOrgCohort } from '@/store/slices/org-cohorts-slice';
import type { OrgCohort } from '@/types/org-cohort-types';

interface DeleteCohortDialogProps {
  open: boolean;
  cohort: OrgCohort | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DeleteCohortDialog({
  open,
  cohort,
  onOpenChange,
  onSuccess,
}: DeleteCohortDialogProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.orgCohorts);
  const perms = usePermissions();

  useEffect(() => {
    if (open && !perms.isRootAdmin) {
      toast.error("You don't have permission to delete organization cohorts.");
      onOpenChange(false);
    }
  }, [open, perms.isRootAdmin, onOpenChange]);

  const handleDelete = async () => {
    if (!cohort) return;

    if (!perms.isRootAdmin) {
      toast.error("You don't have permission to delete this cohort.");
      return;
    }

    try {
      await dispatch(deleteOrgCohort(cohort.orgCohortHash)).unwrap();
      toast.success('Organization cohort deleted successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (handlePermissionError(error)) return;
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to delete organization cohort';
      toast.error(errorMessage);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Organization Cohort</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the cohort{' '}
            <span className="font-semibold">{cohort?.orgCohortName}</span>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
