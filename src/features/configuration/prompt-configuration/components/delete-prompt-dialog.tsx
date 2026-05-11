import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { DELETE_PROMPT } from '@/graphql/prompt_mutations';
import { usePromptConfiguration } from '@/providers/prompt-configuration-provider';
import {
  setSelectedPromptType,
  selectSystemPrompts,
} from '@/store/slices/prompt-configuration-slice';

interface DeletePromptResponse {
  deletePrompt: {
    success: boolean;
    message: string;
  };
}

const DeletePromptDialog: React.FC = () => {
  const dispatch = useAppDispatch();
  const systemPrompts = useAppSelector(selectSystemPrompts);
  const {
    open,
    setOpen,
    triggerRefetch,
    selectedPromptForDelete,
    setSelectedPromptForDelete,
  } = usePromptConfiguration();
  const [isForceDelete, setIsForceDelete] = useState(false);

  // Get the selected prompt from the dialog context
  const selectedPrompt = selectedPromptForDelete;

  // Check if this prompt has any child versions
  const childVersions = selectedPrompt
    ? systemPrompts.filter(
        (prompt) =>
          prompt.parentPromptHash === selectedPrompt.promptHash &&
          prompt.promptHash !== selectedPrompt.promptHash
      )
    : [];
  const hasVersions = childVersions.length > 0;

  const [deletePromptMutation, { loading: deleteLoading }] =
    useMutation<DeletePromptResponse>(DELETE_PROMPT, {
      onCompleted: (data) => {
        if (data.deletePrompt.success) {
          toast.success('Prompt deleted successfully!', {
            position: 'bottom-center',
          });
          setOpen(null);

          // Clear the selected prompt type so it will be reset to default on refetch
          dispatch(setSelectedPromptType(''));
          localStorage.removeItem('selectedPromptType');

          // Trigger refetch to reload all prompts and prompt types
          triggerRefetch();
        } else {
          toast.error(data.deletePrompt.message, {
            position: 'bottom-center',
          });
        }
      },
      onError: (error) => {
        toast.error('Failed to delete prompt', {
          position: 'bottom-center',
          description: error.message,
        });
      },
    });

  const isOpen = open === 'delete';

  const handleClose = () => {
    setOpen(null);
    setIsForceDelete(false);
    setSelectedPromptForDelete(null);
  };

  const handleConfirm = async () => {
    if (!selectedPrompt) {
      toast.error('No prompt selected');
      return;
    }

    if (isDeleteBlocked) {
      toast.error('Cannot delete this prompt', {
        description: deleteBlockedReason || 'This prompt cannot be deleted.',
        position: 'bottom-center',
      });
      return;
    }

    try {
      await deletePromptMutation({
        variables: {
          promptHash: selectedPrompt.promptHash,
        },
      });
    } catch {
      // Error handled elsewhere
    }
  };

  const isRootPrompt =
    selectedPrompt?.parentPromptHash === null ||
    selectedPrompt?.parentPromptHash === '';

  const isDeleteBlocked = !isRootPrompt || hasVersions;
  const deleteBlockedReason = !isRootPrompt
    ? 'Only root prompts (templates) can be deleted. This is a versioned prompt.'
    : hasVersions
      ? `This template has ${childVersions.length} version${childVersions.length !== 1 ? 's' : ''}. Delete all versions first before deleting the template.`
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Delete Prompt
          </DialogTitle>
          <DialogDescription>
            Soft-delete confirmation for the prompt &quot;
            {selectedPrompt?.promptName}
            &quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Blocked Warning */}
          {isDeleteBlocked && deleteBlockedReason && (
            <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
              <p className="text-sm text-warning font-medium mb-1">
                🚫 Deletion Blocked
              </p>
              <p className="text-xs text-muted-foreground">
                {deleteBlockedReason}
              </p>
            </div>
          )}

          {/* Cascade Delete Info */}
          {isRootPrompt && hasVersions && (
            <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
              <p className="text-sm text-blue-600 font-medium mb-1">
                ℹ️ Cascade Deletion
              </p>
              <p className="text-xs text-muted-foreground">
                This template has versions. All subtree versions will be cascade
                deleted together.
              </p>
            </div>
          )}

          {/* Prompt Details */}
          {selectedPrompt && (
            <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-lg">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <span className="ml-2 font-medium">
                  {selectedPrompt.promptName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-medium text-xs bg-primary/20 px-2 py-1 rounded">
                  {selectedPrompt.promptType}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Access Level:</span>
                <span className="ml-2 font-medium capitalize">
                  {selectedPrompt.accessLevel}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-medium">
                  {isRootPrompt ? '✓ Root Template' : '→ Versioned Prompt'}
                </span>
              </div>
            </div>
          )}

          {/* Force Delete Option (for admins) */}
          {hasVersions && isRootPrompt && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isForceDelete}
                onChange={(e) => setIsForceDelete(e.target.checked)}
                className="rounded border-input"
                disabled={deleteLoading}
              />
              <span className="text-sm text-muted-foreground">
                Force delete entire tree (ROOT_ADMIN only)
              </span>
            </label>
          )}

          {/* Confirmation Text */}
          <p className="text-sm text-muted-foreground italic">
            Are you sure? This action soft-deletes the prompt permanently.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            variant="destructive"
            disabled={isDeleteBlocked || deleteLoading}
            className="gap-2"
          >
            {deleteLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {deleteLoading ? 'Deleting...' : 'Delete Prompt'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeletePromptDialog;
