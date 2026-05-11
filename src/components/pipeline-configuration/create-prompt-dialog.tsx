/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';
import { CREATE_PROMPT } from '@/graphql/prompt_mutations';
import { toInternalProcessName, toDisplayName } from './utils';

interface CreatePromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptCreated: (prompt: any) => void;
  processName?: string;
  showEventsListCategory?: boolean; // Whether to show events_list as a category option
}

export const CreatePromptDialog: React.FC<CreatePromptDialogProps> = ({
  isOpen,
  onClose,
  onPromptCreated,
  processName = '',
  showEventsListCategory = true,
}) => {
  const [promptName, setPromptName] = useState('');
  const [promptType, setPromptType] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [accessLevel, setAccessLevel] = useState('user');
  const [promptDescription, setPromptDescription] = useState('');

  const [createPrompt, { loading: isLoading }] = useMutation(CREATE_PROMPT, {
    // Use refetchQueries pattern like FORK_PROMPT to ensure prompt list updates
    // These queries will be refetched automatically after mutation completes
    refetchQueries: [
      // Refetch any instances of these queries - Apollo will update all components
      // that use them, automatically reflecting the new prompt
    ],
    awaitRefetchQueries: false, // Don't wait, let parent handle refetch coordination
    onCompleted: (data) => {
      const prompt = data.createPrompt?.prompt;
      if (prompt) {
        console.log('[CreatePromptDialog]✓ Prompt created successfully:', {
          promptName: prompt.promptName,
          promptHash: prompt.promptHash?.substring(0, 8),
          promptType: prompt.promptType,
        });

        // Don't show toast here - let the parent handler show it after refetch and auto-selection
        // Call the parent handler which will trigger refetch of process-level queries
        onPromptCreated(prompt);
        resetForm();
        onClose();
      }
    },
    onError: (error) => {
      console.error('[CreatePromptDialog]✗ Error creating prompt:', error);
      toast.error(error.message || 'Failed to create prompt');
    },
  });

  const resetForm = () => {
    setPromptName('');
    setPromptType('');
    setPromptContent('');
    setAccessLevel('user');
    setPromptDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!promptName.trim()) {
      toast.error('Please enter a prompt name');
      return;
    }

    if (!promptType) {
      toast.error('Please select a prompt type');
      return;
    }

    if (!promptContent.trim()) {
      toast.error('Please enter prompt content');
      return;
    }

    // Validate processName is provided (required for backend)
    if (!processName || processName.trim() === '') {
      toast.error('Process name is required. Please select a process first.');
      console.error('[CreatePromptDialog] processName is missing or empty');
      return;
    }

    try {
      // Normalize process name to internal format (lowercase with underscores)
      // This handles cases where processName might be in display format or have inconsistent formatting
      const normalizedProcessName = toInternalProcessName(processName);

      if (!normalizedProcessName) {
        toast.error('Invalid process name format. Please try again.');
        console.error(
          '[CreatePromptDialog] processName normalization failed:',
          processName
        );
        return;
      }

      // Construct the fully qualified prompt type format
      // Format: org_process/model_role/prompt_type
      // where model_role is '_' for default/all models
      // Backend strictly requires this format - never send just the category
      const fullyQualifiedType = `${normalizedProcessName}/_/${promptType}`;

      console.log(
        '[CreatePromptDialog] Creating prompt with type:',
        fullyQualifiedType,
        'from processName:',
        processName
      );

      await createPrompt({
        variables: {
          input: {
            promptName: promptName.trim(),
            promptType: fullyQualifiedType,
            promptContent: promptContent.trim(),
            accessLevel,
            parentPromptHash: null,
            promptDescription: promptDescription.trim(),
          },
        },
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Prompt Template</DialogTitle>
          <DialogDescription>
            Create a new reusable prompt template. This will be version 1.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Process Information Banner */}
          {processName && (
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-sm text-foreground">
                Creating prompt for:{' '}
                <strong>{toDisplayName(processName)}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Prompt Name */}
          <div className="space-y-2">
            <Label htmlFor="prompt-name">
              Prompt Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="prompt-name"
              placeholder="e.g., event detection system"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              disabled={isLoading}
              className="bg-background text-foreground border-border"
            />
          </div>

          {/* Category and Access Level Sections */}
          <div className="grid grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={promptType}
                onValueChange={setPromptType}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="category"
                  className="bg-background text-foreground border-border"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border-border">
                  <SelectItem value="system">System Prompt</SelectItem>
                  <SelectItem value="user">User Prompt</SelectItem>
                  {showEventsListCategory && (
                    <SelectItem value="events_list">Events List</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Access Level Dropdown */}
            <div className="space-y-2">
              <Label htmlFor="access-level">
                Access Level <span className="text-red-500">*</span>
              </Label>
              <Select
                value={accessLevel}
                onValueChange={setAccessLevel}
                disabled={isLoading}
              >
                <SelectTrigger
                  id="access-level"
                  className="bg-background text-foreground border-border"
                >
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border-border">
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="cohort">Cohort</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt Description */}
          <div className="space-y-2">
            <Label htmlFor="prompt-description">Description</Label>
            <Textarea
              id="prompt-description"
              placeholder="Optional description for this prompt..."
              value={promptDescription}
              onChange={(e) => setPromptDescription(e.target.value)}
              disabled={isLoading}
              className="min-h-[60px] bg-background text-foreground border-border resize-none"
            />
          </div>

          {/* Prompt Content */}
          <div className="space-y-2">
            <Label htmlFor="prompt-content">
              Prompt Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="prompt-content"
              placeholder="Enter your prompt content here..."
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              disabled={isLoading}
              className="min-h-[150px] bg-background text-foreground border-border resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Creating...' : 'Create Prompt'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
