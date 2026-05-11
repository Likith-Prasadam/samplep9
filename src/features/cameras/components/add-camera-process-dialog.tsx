/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import {
  GET_PROCESS_WITH_MODELS,
  GET_PROMPT_BY_HASH,
} from '@/graphql/workflow_queries';
import { FORK_PROMPT, GET_PROMPT_VERSIONS } from '@/graphql/prompt_mutations';

interface AddCameraProcessDialogProps {
  process?: any | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onAdd: (processHash: string, configInput: any) => Promise<void>;
  trigger?: ReactNode;
}

// Prompt field component with edit/fork functionality
const PromptField = ({
  label,
  promptType,
  prompts,
  value,
  onChange,
  onPromptsRefetch,
}: {
  label: string;
  promptType: string;
  prompts: any[];
  value: string;
  onChange: (val: string) => void;
  onPromptsRefetch: () => void;
}) => {
  const [getVersions, { data: versionsData, loading: versionsLoading }] =
    useLazyQuery(GET_PROMPT_VERSIONS);
  const [getPromptContent, { data: contentData }] =
    useLazyQuery(GET_PROMPT_BY_HASH);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [forkPrompt, { loading: forkLoading }] = useMutation(FORK_PROMPT);

  const matchingPrompts = useMemo(
    () => prompts.filter((p) => p.prompt_type === promptType),
    [prompts, promptType]
  );

  const parentOptions = useMemo(() => {
    const templates = matchingPrompts.filter(
      (p) =>
        ((p.parentPromptHash as string | null | undefined) ?? null) === null
    );

    if (templates.length > 0) {
      return templates.map((p) => ({
        parentHash: p.promptHash,
        label: p.promptName || p.promptHash,
      }));
    }

    const byParent = new Map<string, any>();
    matchingPrompts.forEach((p) => {
      const parentHash =
        (p.parentPromptHash as string | null | undefined) || p.promptHash;
      if (!parentHash) return;
      if (!byParent.has(parentHash)) byParent.set(parentHash, p);
    });

    return Array.from(byParent.entries()).map(([parentHash, p]) => ({
      parentHash,
      label: p.promptName || parentHash,
    }));
  }, [matchingPrompts]);

  // Determine initial parent from value or default to first option
  const [selectedParent, setSelectedParent] = useState<string>(() => {
    if (value) {
      const selected = matchingPrompts.find((p) => p.promptHash === value);
      if (selected) {
        const parentHash =
          (selected.parentPromptHash as string | null | undefined) || value;
        // Verify this parent is in parentOptions, otherwise use first option
        const isValidParent = parentOptions.some(
          (p) => p.parentHash === parentHash
        );
        if (isValidParent) return parentHash;
      }
    }
    return parentOptions.length > 0 ? parentOptions[0].parentHash : '';
  });

  // Update parent when value changes externally
  useEffect(() => {
    if (value) {
      const selected = matchingPrompts.find((p) => p.promptHash === value);
      if (selected) {
        const parentHash =
          (selected.parentPromptHash as string | null | undefined) || value;
        // Verify parent is valid, otherwise use first option
        const isValidParent = parentOptions.some(
          (p) => p.parentHash === parentHash
        );
        setSelectedParent(
          isValidParent && parentHash
            ? parentHash
            : parentOptions.length > 0
              ? parentOptions[0].parentHash
              : ''
        );
      }
    }
  }, [value, matchingPrompts, parentOptions]);

  useEffect(() => {
    if (selectedParent) {
      getVersions({
        variables: {
          parentPromptHash: selectedParent,
          page: 1,
          itemsPerPage: 1000,
        },
        fetchPolicy: 'network-only',
      });
    }
  }, [selectedParent, getVersions]);

  useEffect(() => {
    if (value) {
      // Force network fetch to ensure we get the latest forked content
      // This is especially important after fork operations
      getPromptContent({
        variables: { promptHash: value },
        fetchPolicy: 'cache-and-network', // Ensures fresh data while using cache as backup
        errorPolicy: 'all',
      });
    }
  }, [value, getPromptContent]);

  const versions = useMemo(
    () => (versionsData?.getPromptVersions as any[]) || [],
    [versionsData]
  );

  // Auto-select first version when loaded - should be latest version
  useEffect(() => {
    if (!value && versions.length > 0) {
      // Select the first version (assumed to be latest)
      const latestVersion = versions[0];
      onChange(latestVersion.promptHash);
    }
  }, [versions, value, onChange]);

  const promptContent =
    (contentData?.getPromptByHash?.promptContent as string) || '';

  // Sync draft content with fetched prompt content when not editing
  // This ensures the UI reflects the actual forked content
  useEffect(() => {
    if (!isEditing && promptContent) {
      console.log(
        'Syncing draft content with fetched prompt content:',
        promptContent.substring(0, 100) + '...'
      );
      setDraftContent(promptContent);
    }
  }, [promptContent, isEditing]);

  const handleSaveAsNewVersion = async () => {
    if (!selectedParent) return;
    if (!draftContent.trim()) {
      toast.error('Prompt content cannot be empty.');
      return;
    }

    try {
      const res = await forkPrompt({
        variables: {
          input: {
            parentPromptHash: selectedParent,
            promptContent: draftContent,
          },
        },
        refetchQueries: [
          {
            query: GET_PROMPT_VERSIONS,
            variables: {
              parentPromptHash: selectedParent,
              page: 1,
              itemsPerPage: 1000,
            },
          },
        ],
        awaitRefetchQueries: true,
      });

      const newPrompt = res.data?.forkPrompt?.prompt;
      const newHash = newPrompt?.promptHash;
      if (!newHash) throw new Error('Failed to create a new prompt version');

      console.log('New version created with hash:', newHash);

      // CRITICAL: Add retry logic for content fetching
      let contentResult;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          contentResult = await getPromptContent({
            variables: { promptHash: newHash },
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
          });

          if (contentResult.data?.getPromptByHash?.promptContent) {
            console.log(
              'Successfully fetched content on attempt:',
              attempts + 1
            );
            break;
          }

          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
          }
        } catch (fetchError) {
          console.error(
            'Error fetching content on attempt:',
            attempts + 1,
            fetchError
          );
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * attempts));
          }
        }
      }

      // Extract fresh content from forked version
      const freshContent = contentResult?.data?.getPromptByHash?.promptContent;

      if (freshContent) {
        console.log('Successfully retrieved forked content from server');
        // Update draft content with forked data
        setDraftContent(freshContent);
      } else {
        console.log('Using original draft content as fallback');
        // Keep original draftContent as fallback
      }

      // Select the newly created version - this will trigger fresh content fetch
      onChange(newHash);

      // End editing mode
      setIsEditing(false);
      onPromptsRefetch(); // Refetch prompts to show updated counts
      toast.success('New prompt version created and selected.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create version';
      console.error('Error in handleSaveAsNewVersion:', e);
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <FileText className="w-4 h-4" /> {label} *
      </label>

      {/* Parent and Version Selection */}
      <div className="flex gap-2">
        <Select
          value={selectedParent}
          onValueChange={(val) => {
            setSelectedParent(val);
            onChange(''); // Reset value when parent changes
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select prompt" />
          </SelectTrigger>
          <SelectContent>
            {parentOptions.map((p) => (
              <SelectItem key={p.parentHash} value={p.parentHash}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedParent && (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={versionsLoading}
          >
            <SelectTrigger className="flex-1">
              <SelectValue
                placeholder={
                  versionsLoading
                    ? 'Loading versions...'
                    : versions.length > 0
                      ? 'Select version'
                      : 'No versions'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {versions.length > 0 ? (
                versions.map((v: any) => (
                  <SelectItem key={v.promptHash} value={v.promptHash}>
                    {v.promptName} ({v.promptHash.substring(0, 8)}...)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__default__" disabled>
                  Default Version
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Content Preview and Edit */}
      {promptContent && (
        <div className="border rounded p-2 bg-muted/20">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Content:
            </span>
            {!isEditing ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => setIsEditing(true)}
                disabled={!selectedParent}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => {
                    setIsEditing(false);
                    setDraftContent(promptContent);
                  }}
                  disabled={forkLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={handleSaveAsNewVersion}
                  disabled={forkLoading}
                >
                  {forkLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              className="w-full h-24 rounded border bg-background p-2 text-xs font-mono overflow-y-auto"
            />
          ) : (
            <ScrollArea className="h-24 w-full rounded border bg-background p-2">
              <pre className="text-xs font-mono whitespace-pre-wrap">
                {promptContent}
              </pre>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
};

export const AddCameraProcessDialog: React.FC<AddCameraProcessDialogProps> = ({
  process,
  open: controlledOpen,
  onOpenChange,
  onAdd,
  trigger,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string>('');
  const [selectedUserPrompt, setSelectedUserPrompt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [getProcessDetails, { data: processData, loading: processLoading }] =
    useLazyQuery(GET_PROCESS_WITH_MODELS);

  React.useEffect(() => {
    if (open && process) {
      getProcessDetails({
        variables: { orgProcessHash: process.orgProcessHash },
      });
    }
  }, [open, process, getProcessDetails]);

  const handleAdd = async () => {
    if (!selectedModel || !selectedSystemPrompt || !selectedUserPrompt) {
      toast.error('Please select model and required prompts');
      return;
    }

    setIsSubmitting(true);
    try {
      const configInput = {
        model_hash: selectedModel,
        prompt_hashes: {
          system_prompt_hash: selectedSystemPrompt,
          user_prompt_hash: selectedUserPrompt,
          events_list_prompt_hash: undefined,
        },
        parameters: {},
      };

      await onAdd(process?.orgProcessHash, configInput);

      // Reset form
      setSelectedModel('');
      setSelectedSystemPrompt('');
      setSelectedUserPrompt('');
      setOpen(false);
    } catch (error) {
      console.error('Error adding process:', error);
      toast.error('Failed to add process configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const models = useMemo(
    () => processData?.getProcessWithModels?.accessibleModels || [],
    [processData]
  );
  const prompts = useMemo(
    () => processData?.getProcessWithModels?.accessiblePrompts || [],
    [processData]
  );
  const requiredPrompts = useMemo(
    () => processData?.getProcessWithModels?.required_prompt_types || [],
    [processData]
  );

  // Auto-select model when there's only one available and none selected
  React.useEffect(() => {
    if (models.length === 1 && !selectedModel) {
      setSelectedModel((models[0] as any).model_hash);
    }
  }, [models, selectedModel]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Process Configuration</DialogTitle>
          <DialogDescription>
            Configure {process?.orgProcessName || 'the process'} for this camera
          </DialogDescription>
        </DialogHeader>

        {processLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Model *</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model: any) => (
                    <SelectItem key={model.model_hash} value={model.model_hash}>
                      {model.model_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* System Prompt Selection */}
            {requiredPrompts.includes('system') && (
              <PromptField
                label="System Prompt"
                promptType="system"
                prompts={prompts}
                value={selectedSystemPrompt}
                onChange={setSelectedSystemPrompt}
                onPromptsRefetch={() =>
                  getProcessDetails({
                    variables: { orgProcessHash: process?.orgProcessHash },
                  })
                }
              />
            )}

            {/* User Prompt Selection */}
            {requiredPrompts.includes('user') && (
              <PromptField
                label="User Prompt"
                promptType="user"
                prompts={prompts}
                value={selectedUserPrompt}
                onChange={setSelectedUserPrompt}
                onPromptsRefetch={() =>
                  getProcessDetails({
                    variables: { orgProcessHash: process?.orgProcessHash },
                  })
                }
              />
            )}

            {!processLoading && models.length === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No models available for this process
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isSubmitting || processLoading || !selectedModel}
          >
            {isSubmitting ? 'Adding...' : 'Add Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCameraProcessDialog;
