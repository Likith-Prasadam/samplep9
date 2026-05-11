import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import {
  forkPromptAPI,
  getPromptByHashAPI,
  setSelectedVersionHash,
  fetchLatestPromptVersion,
  selectForkPromptLoading,
} from '@/store/slices/prompt-configuration-slice';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';

interface ForkPromptDialogProps {
  selectedPrompt: SystemPrompt | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ForkPromptDialog: React.FC<ForkPromptDialogProps> = ({
  selectedPrompt,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const forkLoading = useAppSelector(selectForkPromptLoading);

  const [formData, setFormData] = useState({
    promptContent: '',
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen && selectedPrompt) {
      setFormData({
        promptContent: '',
      });
    }
  }, [isOpen, selectedPrompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.promptContent.trim()) {
      toast.error('Please enter prompt content');
      return;
    }

    if (!selectedPrompt) {
      toast.error('No prompt selected');
      return;
    }

    try {
      // Step 1: Fork the prompt
      const forkResult = await dispatch(
        forkPromptAPI({
          parentPromptHash: selectedPrompt.promptHash,
          promptContent: formData.promptContent,
        })
      ).unwrap();

      // Step 2: Fetch the newly created prompt by hash to get updated content
      if (forkResult.prompt?.promptHash) {
        try {
          await dispatch(
            getPromptByHashAPI({
              promptHash: forkResult.prompt.promptHash,
              label: 'latest',
            })
          ).unwrap();

          // Content fetched successfully
        } catch {
          // If getPromptByHash fails, show warning but don't fail the entire operation
        }
      }

      // Step 3: Refresh the versions list to show the newly created version
      // NOTE: We DON'T call fetchPromptVersions here because:
      // 1. forkPromptAPI already added the new version to Redux state (it prepends to the array)
      // 2. The backend might not have the new version immediately
      // 3. Calling fetchPromptVersions would overwrite our correct state with stale data
      // Instead, we just fetch the latest version to keep latestVersion.prompt in sync
      if (selectedPrompt?.promptHash) {
        try {
          await dispatch(
            fetchLatestPromptVersion({
              parentPromptHash: selectedPrompt.promptHash,
            })
          ).unwrap();
        } catch {
          // Error already handled in Redux
        }
      }

      // Step 4: Select the newly created version to display its content immediately
      if (forkResult.prompt?.promptHash) {
        dispatch(setSelectedVersionHash(forkResult.prompt.promptHash));
      }

      // Show success toast with version created info
      toast.success('✓ Prompt version created successfully!');

      setFormData({ promptContent: '' });
      onClose();
      onSuccess?.();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to fork prompt';

      toast.error(errorMsg);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Version</DialogTitle>
          {/* <DialogDescription>
            Create a new version of "{selectedPrompt?.promptName}". Modify the content below.
          </DialogDescription> */}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fetched Prompt Display */}
          {/* <FetchedPromptDisplay /> */}

          <div className="space-y-2">
            {/* <Label htmlFor="fork_prompt_content">Modified Prompt Content *</Label> */}
            <Textarea
              id="fork_prompt_content"
              placeholder="Enter the modified prompt content for this new version..."
              value={formData.promptContent}
              onChange={(e) => setFormData({ promptContent: e.target.value })}
              rows={12}
              required
              disabled={forkLoading}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This creates a new version linked to the parent prompt. The new
              version will be accessible in the version history.
            </p>
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={forkLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={forkLoading || !formData.promptContent.trim()}
              className="flex items-center gap-2"
            >
              {forkLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {forkLoading ? 'Creating Version...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ForkPromptDialog;
