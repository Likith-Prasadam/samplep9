import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DELETE_CAMERA_MUTATION } from '@/graphql/cameras_mutation';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import { getActiveCohortHash } from '@/utils/cohort-utils';

interface DeleteCameraDialogProps {
  camera: Camera | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

const DeleteCameraDialog: React.FC<DeleteCameraDialogProps> = ({
  camera,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();

  const [deleteCamera] = useMutation(DELETE_CAMERA_MUTATION, {
    onCompleted: () => {
      setIsDeleting(false);
      toast.success('Camera deleted successfully');
      onClose();
      if (onDeleted) {
        onDeleted();
      }
    },
    onError: (err) => {
      console.error('Delete error:', err);
      setIsDeleting(false);
      const errorMessage = err.message || 'Failed to delete camera';
      toast.error(errorMessage);
    },
  });

  const handleDelete = () => {
    if (camera) {
      const camHash = camera.cam_hash || '';
      const cohortHashFromQuery = new URLSearchParams(location.search).get(
        'cohort'
      );
      const cohortHash = cohortHashFromQuery || getActiveCohortHash() || '';

      if (!camHash) {
        toast.error('Camera hash is missing. Unable to delete camera.');
        return;
      }

      if (!cohortHash) {
        toast.error('Cohort hash is missing. Unable to delete camera.');
        return;
      }

      setIsDeleting(true);
      deleteCamera({
        variables: {
          input: { camHash, cohortHash },
        },
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Camera</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{camera?.cam_name}"?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteCameraDialog;
