import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import client from '@/lib/apollo-client';
import { GET_ORG_COHORTS } from '@/graphql/org_cohort_queries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/use-permissions';
import { handlePermissionError } from '@/utils/handle-permission-error';
import {
  createOrgCohort,
  updateOrgCohort,
} from '@/store/slices/org-cohorts-slice';
import type { OrgCohort } from '@/types/org-cohort-types';

interface CohortFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  cohort: OrgCohort | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CohortFormDialog({
  open,
  mode,
  cohort,
  onOpenChange,
  onSuccess,
}: CohortFormDialogProps) {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.orgCohorts);

  const perms = usePermissions();

  const [formData, setFormData] = useState({
    orgCohortName: '',
  });
  const [hasChanged, setHasChanged] = useState(false);
  const [allCohorts, setAllCohorts] = useState<OrgCohort[]>([]);

  useEffect(() => {
    if (open) {
      const fetchAllCohorts = async () => {
        try {
          const { data } = await client.query({
            query: GET_ORG_COHORTS,
            variables: {
              page: 1,
              itemsPerPage: 1000,
              filters: undefined,
            },
            fetchPolicy: 'network-only',
          });
          const cohortsData = data.getOrgCohorts?.orgCohorts || [];
          setAllCohorts(cohortsData);
        } catch (error) {
          console.error(
            'Failed to fetch all cohorts for duplicate check:',
            error
          );
          setAllCohorts([]);
        }
      };

      fetchAllCohorts();

      if (mode === 'edit' && cohort) {
        setFormData({
          orgCohortName: cohort.orgCohortName,
        });
        setHasChanged(false);
      } else if (mode === 'create') {
        setFormData({
          orgCohortName: '',
        });
        setHasChanged(false);
      }
      // Prevent non-root admins/users from opening create/edit dialogs
      if (!perms.isRootAdmin) {
        toast.error(
          mode === 'create'
            ? "You don't have permission to create organization cohorts."
            : "You don't have permission to edit organization cohorts."
        );
        onOpenChange(false);
      }
    }
  }, [open, mode, cohort, onOpenChange, perms.isRootAdmin]);

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, orgCohortName: value });
    if (mode === 'edit' && cohort) {
      setHasChanged(value !== cohort.orgCohortName);
    } else {
      setHasChanged(value.trim().length > 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.orgCohortName.trim()) {
      toast.error('Please enter a cohort name');
      return;
    }

    const newNameLower = formData.orgCohortName.toLowerCase().trim();
    const isDuplicate = allCohorts.some((c) => {
      // In edit mode, exclude the current cohort from duplication check
      if (
        mode === 'edit' &&
        cohort &&
        c.orgCohortHash === cohort.orgCohortHash
      ) {
        return false;
      }
      return c.orgCohortName.toLowerCase().trim() === newNameLower;
    });

    if (isDuplicate) {
      toast.error('Cohort name already exists');
      return;
    }

    try {
      if (mode === 'create') {
        if (!perms.isRootAdmin) {
          toast.error("You don't have permission to create cohorts.");
          return;
        }
        await dispatch(
          createOrgCohort({
            orgCohortName: formData.orgCohortName,
          })
        ).unwrap();
        toast.success('Organization cohort created successfully');
      } else if (mode === 'edit' && cohort) {
        if (!perms.isRootAdmin) {
          toast.error("You don't have permission to update this cohort.");
          return;
        }
        await dispatch(
          updateOrgCohort({
            orgCohortHash: cohort.orgCohortHash,
            orgCohortName: formData.orgCohortName,
          })
        ).unwrap();
        toast.success('Organization cohort updated successfully');
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      if (handlePermissionError(error)) return;

      let errorMessage = 'Cohort name already exists';
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (
          message.includes('already exists') ||
          message.includes('duplicate')
        ) {
          errorMessage = 'Cohort name already exists';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? 'Create Organization Cohort'
              : 'Edit Organization Cohort'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Add a new organization cohort (team/department) to the system.'
              : 'Update the organization cohort details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cohortName">
                Cohort Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cohortName"
                placeholder="e.g., Engineering, Sales, Marketing"
                value={formData.orgCohortName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                (mode === 'edit' && !hasChanged) ||
                (mode === 'edit' && !perms.isRootAdmin)
              }
            >
              {loading ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
