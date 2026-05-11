import { useState, useRef, useEffect, useMemo } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { FORK_PROMPT, GET_PROMPT_VERSIONS } from '@/graphql/prompt_mutations';
import { GET_PROMPT_BY_HASH } from '@/graphql/workflow_queries';

export const PromptSelectionField = ({
  label,
  requiredTypes,
  accessiblePrompts,
  value,
  selectedParentHash,
  onChange,
}: {
  label: string;
  requiredTypes: string[];
  accessiblePrompts: Record<string, unknown>[];
  value: string;
  selectedParentHash?: string;
  onChange: (val: string, meta?: Record<string, unknown>) => void;
}) => {
  const [selectedParent, setSelectedParent] = useState<string>(
    selectedParentHash ?? ''
  );
  const [getVersions, { data: versionsData, loading: versionsLoading }] =
    useLazyQuery(GET_PROMPT_VERSIONS);
  const [getPromptContent, { data: contentData }] =
    useLazyQuery(GET_PROMPT_BY_HASH);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [isEditingEvents, setIsEditingEvents] = useState(false);
  const [newEventText, setNewEventText] = useState('');
  const [modifiedEvents, setModifiedEvents] = useState<string[]>([]);
  const [editingEventIndex, setEditingEventIndex] = useState<number>(-1);
  const [editedEventText, setEditedEventText] = useState('');
  const [forkPrompt, { loading: forkLoading }] = useMutation(FORK_PROMPT);
  const [pendingVersionHash, setPendingVersionHash] = useState<string>('');
  // Track manual version selections to prevent auto-selection interference
  const manualSelectionRef = useRef<string | null>(null);

  // Prompts that match the required types for this field
  const matchingPrompts = useMemo(() => {
    return accessiblePrompts.filter((p) => {
      const pType = p.promptType as string | undefined;
      return requiredTypes.some((t) => pType === t || pType?.startsWith(t));
    });
  }, [accessiblePrompts, requiredTypes]);

  // Build parent options.
  // Prefer templates (parentPromptHash === null). If none exist, fall back to grouping
  // versioned prompts by their parentPromptHash so we can still load versions by default.
  const parentOptions = useMemo(() => {
    const templates = matchingPrompts.filter(
      (p) =>
        ((p.parentPromptHash as string | null | undefined) ?? null) === null
    );

    if (templates.length > 0) {
      return templates.map((p) => ({
        parentHash: p.promptHash as string,
        label: (p.promptName as string) || (p.promptHash as string),
      }));
    }

    const byParent = new Map<string, Record<string, unknown>>();
    matchingPrompts.forEach((p) => {
      const parentHash =
        (p.parentPromptHash as string | null | undefined) ||
        (p.promptHash as string | undefined);
      if (!parentHash) return;
      if (!byParent.has(parentHash)) byParent.set(parentHash, p);
    });

    return Array.from(byParent.entries()).map(([parentHash, p]) => ({
      parentHash,
      label: (p.promptName as string) || parentHash,
    }));
  }, [matchingPrompts]);

  // Ensure we have a parent prompt selected:
  // - If a version is already selected, derive its parent from accessiblePrompts
  // - Otherwise auto-select the first available template/parent
  useEffect(() => {
    if (selectedParent) return;

    if (value) {
      const selected = matchingPrompts.find(
        (p) => (p.promptHash as string | undefined) === value
      );
      if (selected) {
        const parent =
          (selected.parentPromptHash as string | null | undefined) ||
          (selected.promptHash as string | undefined);
        if (parent) {
          setSelectedParent(parent);
          return;
        }
      }
    }

    if (parentOptions.length > 0) {
      setSelectedParent(parentOptions[0].parentHash);
    }
  }, [matchingPrompts, parentOptions, selectedParent, value]);

  // When a parent is selected, fetch versions
  useEffect(() => {
    if (selectedParent) {
      // Clear manual selection ref when parent changes
      manualSelectionRef.current = null;
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

  // When value changes (version selected), fetch content
  useEffect(() => {
    if (value) {
      // Force network fetch to ensure we get the latest forked content
      // This is especially important after fork operations
      // Use network-only for pending versions to ensure we get fresh content
      const fetchPolicy =
        pendingVersionHash === value ? 'network-only' : 'cache-and-network';

      console.log(
        'Fetching content for hash:',
        value,
        'with policy:',
        fetchPolicy,
        'pendingVersion:',
        pendingVersionHash
      );
      getPromptContent({
        variables: { promptHash: value },
        fetchPolicy: fetchPolicy,
      });
    }
  }, [value, getPromptContent, pendingVersionHash]);

  const versions = useMemo(() => {
    const rawVersions =
      (versionsData?.getPromptVersions as
        | Record<string, unknown>[]
        | undefined) || [];

    // Reverse to match the ordering expected by version display logic
    // This ensures newest versions appear first (index 0 = newest)
    return [...rawVersions].reverse();
  }, [versionsData]);

  // Auto-select a version when versions are loaded and current value is empty/invalid
  useEffect(() => {
    if (!selectedParent) return;
    if (versions.length === 0) return;

    const valueValid =
      !!value &&
      versions.some((v) => (v.promptHash as string | undefined) === value);

    // Don't auto-select if user just made a manual selection or created a new version
    const isRecentManualSelection = manualSelectionRef.current === value;

    if (!valueValid && !isRecentManualSelection) {
      // Find the latest version - could be first item or the most recently created
      // For safety, we'll assume the versions might not be properly ordered
      // and select based on the highest version number or first item
      const latest = versions[0] as Record<string, unknown>;
      const versionNumber = versions.length;
      const versionDisplay = `v${versionNumber} (Latest)`;

      onChange(latest.promptHash as string, { promptName: versionDisplay });
    } else {
      console.log('✅ Keeping existing selection:', {
        hash: value?.substring(0, 8) + '...',
        valid: valueValid,
        wasManualSelection: isRecentManualSelection,
      });
    }
  }, [versions, value, selectedParent]); // eslint-disable-line react-hooks/exhaustive-deps

  // When value exists and versions load, ensure we report version display for meta
  useEffect(() => {
    if (versions.length > 0 && value) {
      const selectedVersionIndex = versions.findIndex(
        (v: Record<string, unknown>) => v.promptHash === value
      );
      if (selectedVersionIndex !== -1) {
        const versionNumber = versions.length - selectedVersionIndex;
        const isLatest = selectedVersionIndex === 0;
        const versionDisplay = `v${versionNumber}${isLatest ? ' (Latest)' : ''}`;
        onChange(value, { promptName: versionDisplay });
      }
    }
  }, [versions, value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get display text for the currently selected version
  const getSelectedVersionDisplay = () => {
    if (!value || versions.length === 0) {
      return versionsLoading ? 'Loading versions...' : 'Select Version';
    }

    const selectedVersionIndex = versions.findIndex(
      (v: Record<string, unknown>) => v.promptHash === value
    );

    if (selectedVersionIndex === -1) {
      return 'Select Version';
    }

    const versionNumber = versions.length - selectedVersionIndex;
    const isLatest = selectedVersionIndex === 0;

    return `v${versionNumber}${isLatest ? ' (Latest)' : ''}`;
  };

  // Clear pending version state if user manually switches to a different version
  useEffect(() => {
    if (pendingVersionHash && value && value !== pendingVersionHash) {
      setPendingVersionHash('');
    }
  }, [value, pendingVersionHash]);

  // Restore selectedParent from value when navigating back
  useEffect(() => {
    if (
      value &&
      !selectedParent &&
      contentData?.getPromptByHash &&
      parentOptions.length > 0
    ) {
      const type = (contentData.getPromptByHash as Record<string, unknown>)
        .promptType as string;
      const parent = parentOptions.find((p) => {
        // best-effort match by type against matchingPrompts
        const any = matchingPrompts.find(
          (mp) =>
            (mp.promptHash as string | undefined) === p.parentHash ||
            (mp.parentPromptHash as string | null | undefined) === p.parentHash
        );
        return (any?.promptType as string | undefined) === type;
      });
      if (parent) {
        setSelectedParent(parent.parentHash);
      } else {
        // Fallback: if we can't map, just keep current selectedParent unset
      }
    }
  }, [value, selectedParent, contentData, parentOptions, matchingPrompts]);

  // Normalize to string (API may return object e.g. { content: "..." })
  const rawContent = contentData?.getPromptByHash?.promptContent;
  const promptContent =
    typeof rawContent === 'string'
      ? rawContent
      : typeof rawContent === 'object' &&
          rawContent !== null &&
          'content' in rawContent
        ? String((rawContent as { content: unknown }).content)
        : String(rawContent ?? '');

  // Keep draft content in sync with fetched content unless user is editing
  // This ensures the UI reflects the actual forked content
  useEffect(() => {
    console.log('Content sync effect triggered:', {
      isEditing,
      hasPromptContent: !!promptContent,
      pendingVersionHash,
      currentValue: value,
      contentPreview: promptContent?.substring(0, 50) + '...',
    });

    if (!isEditing && promptContent) {
      console.log(
        'Syncing draft content with fetched prompt content:',
        promptContent.substring(0, 100) + '...'
      );
      setDraftContent(promptContent);
    }

    // Handle case where we just created a new version and are waiting for its content
    if (pendingVersionHash && value === pendingVersionHash && promptContent) {
      console.log('New version content received, exiting editing mode');
      setDraftContent(promptContent);
      setIsEditing(false);
      setPendingVersionHash(''); // Clear pending state
    }
  }, [promptContent, isEditing, pendingVersionHash, value]);

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
      });

      const newPrompt = res.data?.forkPrompt?.prompt;
      const newHash = newPrompt?.promptHash as string | undefined;
      if (!newHash) throw new Error('Failed to create a new prompt version');

      // CRITICAL: Add retry logic in case backend needs time to index new version
      let contentResult;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          contentResult = await getPromptContent({
            variables: { promptHash: newHash },
            fetchPolicy: 'network-only', // Force fresh data for new version
            errorPolicy: 'all', // Get both data and errors
          });

          // If we got content, break out of retry loop
          if (contentResult.data?.getPromptByHash?.promptContent) {
            console.log(
              'Successfully fetched content on attempt:',
              attempts + 1
            );
            break;
          }

          console.log('No content on attempt:', attempts + 1, 'retrying...');
          attempts++;

          // Wait briefly before retry (exponential backoff)
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

      await getVersions({
        variables: {
          parentPromptHash: selectedParent,
          page: 1,
          itemsPerPage: 1000,
        },
        fetchPolicy: 'network-only', // Force fresh data
      });

      // Mark this as a manual selection to prevent auto-selection interference
      manualSelectionRef.current = newHash;
      onChange(newHash, { promptName: 'v1 (Latest)' });

      // Clear the manual selection flag after a short delay
      setTimeout(() => {
        if (manualSelectionRef.current === newHash) {
          manualSelectionRef.current = null;
        }
      }, 5000);

      // Set pending version to track that we're waiting for content
      setPendingVersionHash(newHash);
      console.log('Set pending version hash:', newHash);

      setIsEditing(false);
      setIsEditingEvents(false);
      toast.success('New prompt version created and selected.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to create version';
      console.error('Error in handleSaveAsNewVersion:', e);
      toast.error(msg);
    }
  };

  // Handle delete event (local only; save on Done – same as edit camera config)
  const handleDeleteEvent = (index: number) => {
    const updated = [...modifiedEvents];
    updated.splice(index, 1);
    setModifiedEvents(updated);
    if (editingEventIndex === index) {
      setEditingEventIndex(-1);
      setEditedEventText('');
    } else if (editingEventIndex > index) {
      setEditingEventIndex(editingEventIndex - 1);
    }
    toast.success('Event removed.');
  };

  // Handle add new event (local only; save on Done – same as edit camera config)
  const handleAddNewEvent = () => {
    const trimmed = newEventText.trim();
    if (!trimmed) {
      toast.error('Please enter event text.');
      return;
    }
    if (trimmed.includes(',')) {
      toast.error('Event text cannot contain commas.');
      return;
    }
    setModifiedEvents([trimmed, ...modifiedEvents]);
    setNewEventText('');
    toast.success('Event added.');
  };

  // Handle start editing event (pencil)
  const handleEditEvent = (index: number, eventText: string) => {
    setEditingEventIndex(index);
    setEditedEventText(eventText);
  };

  const handleCancelEditEvent = () => {
    setEditingEventIndex(-1);
    setEditedEventText('');
  };

  // Handle save edited event (local only; save on Done)
  const handleSaveEditedEvent = () => {
    const trimmed = editedEventText.trim();
    if (!trimmed) {
      toast.error('Event text cannot be empty.');
      return;
    }
    if (trimmed.includes(',')) {
      toast.error('Event text cannot contain commas.');
      return;
    }
    if (editingEventIndex < 0 || editingEventIndex >= modifiedEvents.length)
      return;
    const updated = [...modifiedEvents];
    updated[editingEventIndex] = trimmed;
    setModifiedEvents(updated);
    setEditingEventIndex(-1);
    setEditedEventText('');
    toast.success('Event updated.');
  };

  // Toggle Edit Events mode – enter: init from promptContent; exit (Done): fork once if changed (same as edit camera config)
  const handleToggleEditEvents = async () => {
    if (!isEditingEvents) {
      const events = promptContent
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
      setModifiedEvents(events);
      setIsEditingEvents(true);
    } else {
      if (!selectedParent) return;
      if (editingEventIndex !== -1) {
        toast.warning('Please save or cancel the current inline edit first.');
        return;
      }
      const originalEvents = promptContent
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
      const hasChanges =
        JSON.stringify(originalEvents) !== JSON.stringify(modifiedEvents);
      if (!hasChanges) {
        setIsEditingEvents(false);
        toast.info('No changes made.');
        return;
      }
      if (modifiedEvents.length === 0) {
        toast.error('Cannot save empty event list.');
        return;
      }
      const updatedContent = modifiedEvents.join(', ');
      const runFork = () =>
        forkPrompt({
          variables: {
            input: {
              parentPromptHash: selectedParent,
              promptContent: updatedContent,
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
      const isTimeoutError = (err: unknown) => {
        const m =
          err instanceof Error
            ? err.message
            : err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : '';
        return /timed out|timeout|Langfuse/i.test(m);
      };
      let lastError: unknown;
      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await runFork();
          const forkResult = res.data?.forkPrompt;
          const newPrompt = forkResult?.prompt;
          const newHash = newPrompt?.promptHash;
          if (!newHash) {
            const backendMsg = (forkResult as { message?: string } | undefined)
              ?.message;
            throw new Error(
              backendMsg ||
                'Server did not return the new prompt. Please try again.'
            );
          }
          manualSelectionRef.current = newHash;
          onChange(newHash, { promptName: 'v1 (Latest)' });
          setPendingVersionHash(newHash);
          void getVersions({
            variables: {
              parentPromptHash: selectedParent,
              page: 1,
              itemsPerPage: 1000,
            },
            fetchPolicy: 'network-only',
          }).catch(() => {});
          setTimeout(() => {
            if (manualSelectionRef.current === newHash)
              manualSelectionRef.current = null;
          }, 3000);
          setIsEditingEvents(false);
          setEditingEventIndex(-1);
          setEditedEventText('');
          setNewEventText('');
          toast.success('All changes saved and new version created.');
          return;
        } catch (e: unknown) {
          lastError = e;
          if (attempt < maxAttempts && isTimeoutError(e)) {
            toast.info(
              `Request timed out. Retrying (${attempt}/${maxAttempts - 1})...`
            );
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }
          break;
        }
      }
      let msg = 'Failed to save changes.';
      if (lastError instanceof Error) msg = lastError.message;
      else if (
        lastError &&
        typeof lastError === 'object' &&
        'graphQLErrors' in lastError
      ) {
        const g = (lastError as { graphQLErrors?: Array<{ message?: string }> })
          .graphQLErrors;
        if (g?.length) msg = g[0].message || msg;
      } else if (
        lastError &&
        typeof lastError === 'object' &&
        'message' in lastError
      )
        msg = String((lastError as { message: unknown }).message);
      if (/timed out|timeout|Langfuse/i.test(msg))
        toast.error(
          'Saving took too long (Langfuse timed out). Your changes are still in the list. Please click Done again in a moment, or try again later when the service is less busy.'
        );
      else toast.error(msg);
    }
  };

  return (
    <div className="space-y-3 py-3 pt-6 border-t border-border">
      <label className="text-xs font-medium text-muted-foreground capitalize flex items-center gap-2">
        <FileText className="w-3 h-3" /> {label}
      </label>

      {parentOptions.length === 0 &&
        !(
          requiredTypes.some((type) => type === 'events_list') ||
          label.toLowerCase().includes('events list')
        ) && (
          <div className="text-xs text-red-500 font-medium">
            No prompts available for {label}. Required types:{' '}
            {requiredTypes.join(', ')}.
            {accessiblePrompts.length > 0 && (
              <div className="text-xs mt-1 text-muted-foreground">
                Available prompt types:{' '}
                {accessiblePrompts.map((p) => p.promptType).join(', ')}
              </div>
            )}
          </div>
        )}

      <div className="grid gap-2">
        <div className="flex gap-2">
          <div className="flex-1">
            {/* Parent Prompt Selection */}
            <Select
              value={selectedParent}
              onValueChange={(val) => {
                setSelectedParent(val);
                // Reset value when parent changes
                onChange('');
                setIsEditing(false);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-full">
                <SelectValue placeholder="Select prompt" />
              </SelectTrigger>
              <SelectContent>
                {parentOptions.map((p) => (
                  <SelectItem
                    key={p.parentHash}
                    value={p.parentHash}
                    className="text-xs"
                  >
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Version Selection */}
          {selectedParent && (
            <div className="flex-1 flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                Version :
              </label>
              <Select
                value={String(value || '')}
                onValueChange={(val) => {
                  console.log(
                    '🖱️ Manual version selected:',
                    val?.substring(0, 8) + '...'
                  );
                  // Mark this as a manual selection to prevent auto-selection interference
                  manualSelectionRef.current = val;

                  // Clear the manual selection flag after a short delay
                  setTimeout(() => {
                    if (manualSelectionRef.current === val) {
                      manualSelectionRef.current = null;
                    }
                  }, 5000);

                  const selectedVersionIndex = versions.findIndex(
                    (v: Record<string, unknown>) => v.promptHash === val
                  );
                  const versionNumber =
                    selectedVersionIndex !== -1
                      ? versions.length - selectedVersionIndex
                      : 1;
                  const isLatest = selectedVersionIndex === 0;
                  const versionDisplay = `v${versionNumber}${isLatest ? ' (Latest)' : ''}`;

                  onChange(val, { promptName: versionDisplay });
                }}
                disabled={versionsLoading}
              >
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue>
                    <span className="text-xs">
                      {getSelectedVersionDisplay()}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {versions.length > 0 ? (
                    versions.map((v: Record<string, unknown>, idx: number) => {
                      const versionNumber = versions.length - idx;
                      const isCurrentlySelected =
                        (v.promptHash as string) === value;
                      const isLatest = idx === 0;

                      return (
                        <SelectItem
                          key={v.promptHash as string}
                          value={v.promptHash as string}
                          className="text-xs"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span
                              className={
                                isCurrentlySelected
                                  ? 'font-semibold text-blue-600'
                                  : ''
                              }
                            >
                              v{versionNumber}
                              {isLatest ? ' (Latest)' : ''}
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem
                      value="__default__"
                      className="text-xs"
                      disabled
                    >
                      Default Version
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Prompt Description - hidden for Events List prompts */}
        {contentData?.getPromptByHash?.promptDescription &&
          !(
            requiredTypes.some((type) => type === 'events_list') ||
            label.toLowerCase().includes('events list')
          ) && (
            <div className="mt-2">
              <p className="text-[10px] font-medium text-muted-foreground mb-1">
                Description:
              </p>
              <p className="text-xs text-foreground bg-muted/30 p-2 rounded">
                {contentData.getPromptByHash.promptDescription}
              </p>
            </div>
          )}

        {/* Prompt Content Preview */}
        {promptContent && (
          <div className="mt-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] font-medium text-muted-foreground">
                Content:
              </p>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
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
                      className="h-7 px-2 text-[10px]"
                      onClick={handleSaveAsNewVersion}
                      disabled={forkLoading || !selectedParent}
                    >
                      {forkLoading ? 'Saving...' : 'Save as new version'}
                    </Button>
                  </>
                ) : (
                  // Hide main Edit button for events_list prompts - they use Edit Events instead
                  !(
                    requiredTypes.some((type) => type === 'events_list') ||
                    label.toLowerCase().includes('events list')
                  ) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-[10px]"
                      onClick={() => setIsEditing(true)}
                      disabled={!value}
                    >
                      Edit
                    </Button>
                  )
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="h-40 w-full rounded bg-muted/30 p-3 text-xs whitespace-pre-wrap font-mono text-foreground spectra-scrollbar overflow-y-auto"
              />
            ) : (
              <div>
                {requiredTypes.some((type) => type === 'events_list') ||
                label.toLowerCase().includes('events list') ? (
                  <div>
                    {/* Edit Events – same as edit camera config */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-foreground">
                        Events (
                        {isEditingEvents
                          ? modifiedEvents.length
                          : promptContent
                              .split(/[,\n]/)
                              .filter((item) => item.trim()).length}
                        )
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-3 text-xs font-medium"
                        onClick={handleToggleEditEvents}
                        disabled={!selectedParent || forkLoading}
                      >
                        {forkLoading
                          ? 'Saving...'
                          : isEditingEvents
                            ? 'Done'
                            : 'Edit Events'}
                      </Button>
                    </div>

                    {/* Events container – same styling as live */}
                    <div
                      className={`space-y-2 w-full rounded-md border-2 border-border bg-muted/50 p-3 ${
                        (isEditingEvents
                          ? modifiedEvents.length
                          : promptContent
                              .split(/[,\n]/)
                              .filter((item) => item.trim()).length) > 5
                          ? 'max-h-[280px] overflow-y-auto'
                          : 'min-h-[120px]'
                      }`}
                    >
                      {/* Add new event – only when editing, same as live */}
                      {isEditingEvents && (
                        <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-md px-3 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add new event..."
                              value={newEventText}
                              onChange={(e) => setNewEventText(e.target.value)}
                              className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleAddNewEvent();
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={handleAddNewEvent}
                              disabled={!newEventText.trim()}
                            >
                              <Plus className="h-3 w-3 text-primary" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {(isEditingEvents
                        ? modifiedEvents
                        : promptContent
                            .split(/[,\n]/)
                            .map((item) => item.trim())
                            .filter(Boolean)
                      ).map((item, index) => (
                        <div
                          key={index}
                          className="bg-background border-2 border-border rounded-md px-3 py-2 flex items-center justify-between group hover:border-primary/40 transition-colors"
                        >
                          {editingEventIndex === index ? (
                            <>
                              <input
                                type="text"
                                value={editedEventText}
                                onChange={(e) =>
                                  setEditedEventText(e.target.value)
                                }
                                className="flex-1 text-sm bg-transparent border-none outline-none focus:ring-0 px-1"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveEditedEvent();
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    handleCancelEditEvent();
                                  }
                                }}
                              />
                              <div className="flex gap-1 ml-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={handleSaveEditedEvent}
                                  disabled={forkLoading}
                                >
                                  <Check className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={handleCancelEditEvent}
                                >
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <span className="text-sm text-foreground leading-relaxed flex-1">
                                {item}
                              </span>
                              {isEditingEvents && (
                                <div className="flex gap-1 ml-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 shrink-0"
                                    aria-label="Edit event"
                                    onClick={() => handleEditEvent(index, item)}
                                  >
                                    <Pencil className="h-3 w-3 text-blue-600" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0 shrink-0"
                                    aria-label="Delete event"
                                    onClick={() => handleDeleteEvent(index)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Display other prompts as regular text
                  <ScrollArea className="h-40 w-full rounded bg-muted/30 p-3">
                    <pre className="text-xs whitespace-pre-wrap font-mono text-foreground">
                      {promptContent}
                    </pre>
                  </ScrollArea>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
