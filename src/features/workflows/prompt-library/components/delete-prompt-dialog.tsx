import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { deletePrompt } from '@/store/slices/workflow-slice';
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
import { AlertTriangle } from 'lucide-react';
import type { PromptTemplate } from '@/types/workflow-types';

interface DeletePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: PromptTemplate;
  onSuccess?: () => void;
}

export function DeletePromptDialog({
  open,
  onOpenChange,
  prompt,
  onSuccess,
}: DeletePromptDialogProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!prompt.latest_version) {
      toast.error('Cannot delete prompt without a version');
      return;
    }

    setLoading(true);

    try {
      await dispatch(deletePrompt(prompt.latest_version.prompt_id)).unwrap();

      toast.success('Prompt deleted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Check if error is about active configurations
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to delete prompt';

      if (errorMessage.includes('active') || errorMessage.includes('in use')) {
        toast.error('Cannot delete prompt', {
          description:
            'This prompt is currently used in active workflows. Disable those configurations first.',
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Prompt Template</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to delete{' '}
              <strong>{prompt.prompt_name}</strong>?
            </p>
            <p className="text-sm">
              This will soft-delete the prompt template. If it's currently used
              in any active configurations, the deletion will be prevented.
            </p>
            <p className="text-sm font-medium text-destructive">
              This action can be reversed by restoring the prompt.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Deleting...' : 'Delete Prompt'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
