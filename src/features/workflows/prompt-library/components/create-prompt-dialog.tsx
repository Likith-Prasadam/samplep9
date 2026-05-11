import { useState } from 'react';
import { useAppDispatch } from '@/store';
import { createPrompt } from '@/store/slices/workflow-slice';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { PromptCategory, AccessLevel } from '@/types/workflow-types';

interface CreatePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreatePromptDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePromptDialogProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prompt_name: '',
    prompt_category: 'system' as PromptCategory,
    prompt_content: '',
    access_level: 'organization' as AccessLevel,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.prompt_name.trim()) {
      toast.error('Please enter a prompt name');
      return;
    }

    if (!formData.prompt_content.trim()) {
      toast.error('Please enter prompt content');
      return;
    }

    setLoading(true);

    try {
      await dispatch(
        createPrompt({
          prompt_name: formData.prompt_name,
          prompt_category: formData.prompt_category,
          prompt_content: formData.prompt_content,
          access_level: formData.access_level,
        })
      ).unwrap();

      toast.success('Prompt created successfully');
      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setFormData({
        prompt_name: '',
        prompt_category: 'system',
        prompt_content: '',
        access_level: 'organization',
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create prompt'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Prompt Template</DialogTitle>
          <DialogDescription>
            Create a new reusable prompt template. This will be version 1.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt_name">Prompt Name *</Label>
            <Input
              id="prompt_name"
              placeholder="e.g., event_detection_system"
              value={formData.prompt_name}
              onChange={(e) =>
                setFormData({ ...formData, prompt_name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt_category">Category *</Label>
              <Select
                value={formData.prompt_category}
                onValueChange={(value: PromptCategory) =>
                  setFormData({ ...formData, prompt_category: value })
                }
              >
                <SelectTrigger id="prompt_category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Prompt</SelectItem>
                  <SelectItem value="user">User Prompt</SelectItem>
                  <SelectItem value="events_list">Events List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_level">Access Level *</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value: AccessLevel) =>
                  setFormData({ ...formData, access_level: value })
                }
              >
                <SelectTrigger id="access_level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt_content">Prompt Content *</Label>
            <Textarea
              id="prompt_content"
              placeholder="Enter your prompt instructions here..."
              value={formData.prompt_content}
              onChange={(e) =>
                setFormData({ ...formData, prompt_content: e.target.value })
              }
              rows={10}
              required
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              This content will be stored in Langfuse and versioned.
            </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
