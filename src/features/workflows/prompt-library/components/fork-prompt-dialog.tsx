import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/store';
import {
  forkPrompt,
  fetchLatestPromptVersion,
} from '@/store/slices/workflow-slice';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { PromptTemplate } from '@/types/workflow-types';

interface ForkPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourcePrompt: PromptTemplate;
  onSuccess?: () => void;
}

export function ForkPromptDialog({
  open,
  onOpenChange,
  sourcePrompt,
  onSuccess,
}: ForkPromptDialogProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  const [formData, setFormData] = useState({
    prompt_name: sourcePrompt.prompt_name,
    prompt_content: '',
  });

  // Fetch latest version content when dialog opens
  useEffect(() => {
    if (open && sourcePrompt.latest_version) {
      setLoadingContent(true);
      dispatch(fetchLatestPromptVersion(sourcePrompt.ref_prompt_key))
        .unwrap()
        .then((version) => {
          setFormData({
            prompt_name: sourcePrompt.prompt_name,
            prompt_content: version.prompt_content,
          });
        })
        .catch((error) => {
          toast.error('Failed to load prompt content');
          console.error(error);
        })
        .finally(() => {
          setLoadingContent(false);
        });
    }
  }, [open, sourcePrompt, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prompt_content.trim()) {
      toast.error('Please enter prompt content');
      return;
    }

    if (!sourcePrompt.latest_version) {
      toast.error('Cannot fork prompt without a version');
      return;
    }

    setLoading(true);

    try {
      await dispatch(
        forkPrompt({
          parent_prompt_id: sourcePrompt.latest_version.prompt_id,
          input: {
            prompt_name: formData.prompt_name,
            prompt_category: sourcePrompt.prompt_category,
            prompt_content: formData.prompt_content,
            access_level: sourcePrompt.access_level,
          },
        })
      ).unwrap();

      toast.success('Prompt forked successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to fork prompt'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fork Prompt Template</DialogTitle>
          <DialogDescription>
            Create a new version of "{sourcePrompt.prompt_name}". Make your
            changes below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fork_prompt_name">Prompt Name</Label>
            <Input
              id="fork_prompt_name"
              value={formData.prompt_name}
              onChange={(e) =>
                setFormData({ ...formData, prompt_name: e.target.value })
              }
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Forked prompts keep the same name and ref_prompt_key
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fork_prompt_content">Prompt Content *</Label>
            {loadingContent ? (
              <div className="flex items-center justify-center h-64 border rounded-md">
                <p className="text-muted-foreground">Loading content...</p>
              </div>
            ) : (
              <Textarea
                id="fork_prompt_content"
                placeholder="Modify the prompt content..."
                value={formData.prompt_content}
                onChange={(e) =>
                  setFormData({ ...formData, prompt_content: e.target.value })
                }
                rows={12}
                required
                className="font-mono text-sm"
              />
            )}
            <p className="text-xs text-muted-foreground">
              This will create version{' '}
              {(sourcePrompt.latest_version?.version_number || 0) + 1}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || loadingContent}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || loadingContent}>
              {loading ? 'Forking...' : 'Fork Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
