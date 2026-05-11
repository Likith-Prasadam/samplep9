import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Copy, Star, AlertCircle, RotateCcw } from 'lucide-react';
import {
  fetchPromptVersions,
  setSelectedVersionHash,
  getPromptByHashAPI,
  forkPromptAPI,
  // Selectors
  selectPromptVersions,
  selectVersionsLoading,
  selectVersionsError,
  selectCurrentVersionPage,
  selectVersionsItemsPerPage,
  selectSelectedVersionHash,
  selectLatestPromptVersion,
  selectFetchedPromptContent,
  selectFetchedPromptLoadingHash,
  selectFetchedPromptError,
} from '@/store/slices/prompt-configuration-slice';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';

interface PromptVersionsProps {
  parentPromptHash: string;
  onSelectVersion?: (version: SystemPrompt) => void;
}

const PromptVersions: React.FC<PromptVersionsProps> = ({
  parentPromptHash,
  onSelectVersion,
}) => {
  const dispatch = useAppDispatch();
  // Use selectors for better performance and cleaner code
  const versions = useAppSelector(selectPromptVersions);
  const loading = useAppSelector(selectVersionsLoading);
  const error = useAppSelector(selectVersionsError);
  const currentPage = useAppSelector(selectCurrentVersionPage);
  const itemsPerPage = useAppSelector(selectVersionsItemsPerPage);
  const selectedVersionHash = useAppSelector(selectSelectedVersionHash);
  const latestVersion = useAppSelector(selectLatestPromptVersion);
  const fetchedPromptContent = useAppSelector(selectFetchedPromptContent);
  const fetchedPromptLoadingHash = useAppSelector(
    selectFetchedPromptLoadingHash
  );
  const fetchedPromptError = useAppSelector(selectFetchedPromptError);

  // State for tracking edited prompt content
  const [editedContent, setEditedContent] = useState<{ [key: string]: string }>(
    {}
  );
  const [hasChanges, setHasChanges] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Fetch versions when component mounts or when parameters change
    dispatch(
      fetchPromptVersions({
        parentPromptHash,
        page: currentPage,
        itemsPerPage,
      })
    );
  }, [parentPromptHash, currentPage, itemsPerPage, dispatch]);

  // Set latest version as default ONLY on initial load (when no version is selected)
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionHash) {
      // Only set default on initial load
      const latestVersionPrompt = latestVersion;
      const defaultVersion =
        latestVersionPrompt &&
        versions.find((v) => v.promptHash === latestVersionPrompt.promptHash)
          ? latestVersionPrompt
          : versions[versions.length - 1]; // Use the last version in the array (most recent)

      const defaultVersionHash = defaultVersion.promptHash;

      dispatch(setSelectedVersionHash(defaultVersionHash));

      // Auto-fetch content for the latest version
      if (!fetchedPromptContent[defaultVersionHash]) {
        dispatch(
          getPromptByHashAPI({
            promptHash: defaultVersionHash,
            label: 'latest',
          })
        ).catch(() => {
          // Error already handled in Redux
        });
      }
    }
  }, [
    versions,
    latestVersion,
    dispatch,
    fetchedPromptContent,
    selectedVersionHash,
  ]); // Re-run if versions, latestVersion, or dependencies change

  // Auto-fetch content whenever selected version changes (for dropdown selection)
  useEffect(() => {
    if (selectedVersionHash && !fetchedPromptContent[selectedVersionHash]) {
      dispatch(
        getPromptByHashAPI({
          promptHash: selectedVersionHash,
          label: 'latest',
        })
      ).catch(() => {
        // Error already handled in Redux
      });
    }
  }, [selectedVersionHash, dispatch, fetchedPromptContent]);

  const handleSelectVersion = (version: SystemPrompt) => {
    dispatch(setSelectedVersionHash(version.promptHash));

    // Fetch the prompt content by hash
    dispatch(
      getPromptByHashAPI({
        promptHash: version.promptHash,
        label: 'latest',
      })
    ).catch(() => {
      // Error already handled in Redux
    });

    if (onSelectVersion) {
      onSelectVersion(version);
    }
  };

  const handleForkVersion = async (
    e: React.MouseEvent,
    version: SystemPrompt
  ) => {
    e.stopPropagation();

    const originalContent =
      fetchedPromptContent[version.promptHash]?.promptContent || '';
    const currentContent = editedContent[version.promptHash] || originalContent;

    try {
      // Use Redux thunk for fork which handles state updates immediately
      const forkResult = await dispatch(
        forkPromptAPI({
          parentPromptHash: version.promptHash,
          promptContent: currentContent,
        })
      ).unwrap();

      // Get the version index for display
      const versionIndex = versions.length;
      const newVersionNumber = `V${versionIndex + 1}`;

      toast.success(`✓ ${newVersionNumber} created successfully!`, {
        description: 'New version has been created and saved.',
        duration: 4000,
      });

      // Reset the edited content for the parent version
      setEditedContent((prev) => ({
        ...prev,
        [version.promptHash]: originalContent,
      }));
      setHasChanges((prev) => ({
        ...prev,
        [version.promptHash]: false,
      }));

      // Step 1: The Redux thunk has already updated state and selected the new version
      // Step 2: Now fetch the content for the newly created version
      if (forkResult.prompt?.promptHash) {
        await dispatch(
          getPromptByHashAPI({
            promptHash: forkResult.prompt.promptHash,
            label: 'latest',
          })
        )
          .then(() => {
            // Content loaded successfully
          })
          .catch(() => {
            // Error already handled in Redux
          });
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error: ${errorMsg}`, {
        duration: 4000,
      });
    }
  };

  const handleResetContent = (e: React.MouseEvent, version: SystemPrompt) => {
    e.stopPropagation();
    const originalContent =
      fetchedPromptContent[version.promptHash]?.promptContent || '';
    setEditedContent((prev) => ({
      ...prev,
      [version.promptHash]: originalContent,
    }));
    setHasChanges((prev) => ({
      ...prev,
      [version.promptHash]: false,
    }));
  };

  const handleContentChange = (
    promptHash: string,
    newContent: string,
    originalContent: string
  ) => {
    setEditedContent((prev) => ({
      ...prev,
      [promptHash]: newContent,
    }));
    // Mark as changed only if it's different from original
    const changed = newContent !== originalContent;
    setHasChanges((prev) => ({
      ...prev,
      [promptHash]: changed,
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No versions available</p>
      </div>
    );
  }

  // Get parent prompt name using parentPromptHash
  // For now, use the parentPromptHash as fallback since we don't have system prompts in this component
  const parentPromptName = parentPromptHash.substring(0, 20) + '...';

  // Get the display label for the dropdown based on selected version
  const getSelectedVersionLabel = () => {
    if (!selectedVersionHash || !versions.length) return 'Select version';

    const selectedVersion = versions.find(
      (v) => v.promptHash === selectedVersionHash
    );
    if (!selectedVersion) return 'Select version';

    // Check if this is the latest version
    const isLatestSelected = latestVersion?.promptHash === selectedVersionHash;
    const versionIndex = versions.findIndex(
      (v) => v.promptHash === selectedVersionHash
    );
    const totalVersions = versions.length;
    const versionNumber = totalVersions - versionIndex;

    return isLatestSelected
      ? `Latest (V${versionNumber})`
      : `V${versionNumber}`;
  };

  return (
    <div className="space-y-4">
      {/* Top Section: Prompt Name and Version Dropdown */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-lg font-semibold">{parentPromptName}</h3>
        <Select
          value={selectedVersionHash || ''}
          onValueChange={(hash) => {
            const version = versions.find((v) => v.promptHash === hash);
            if (version) handleSelectVersion(version);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue>{getSelectedVersionLabel()}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {versions.map((version, index) => {
              const isLatestItem =
                latestVersion?.promptHash === version.promptHash;
              const versionNum = versions.length - index;
              return (
                <SelectItem key={version.promptHash} value={version.promptHash}>
                  {isLatestItem ? `Latest (V${versionNum})` : `V${versionNum}`}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Grid - Display Only Selected Version (Full Width) */}
      <div className="grid grid-cols-1 gap-4">
        {versions
          .filter((version) => version.promptHash === selectedVersionHash)
          .map((version) => {
            // Check if this version is the latest
            const isLatest = latestVersion?.promptHash === version.promptHash;

            // Calculate version number based on reverse position
            // Since versions are sorted DESC (newest first): [V5, V4, V3, V2, V1]
            // V5 should have number 5, V4 should have 4, etc.
            // Formula: versionNumber = (totalVersions - currentIndex)
            const versionIndex = versions.findIndex(
              (v) => v.promptHash === version.promptHash
            );
            const totalVersions = versions.length;
            const versionNumber = `V${totalVersions - versionIndex}`;

            // IMPORTANT: Show content for selected version regardless of isLatest status
            // This allows editing and viewing any version, not just the latest
            const hasContent = fetchedPromptContent[version.promptHash];

            return (
              <Card
                key={version.promptHash}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedVersionHash === version.promptHash ? '' : ''
                } ${isLatest ? ' border-green-400' : ''}`}
                onClick={() => handleSelectVersion(version)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-lg truncate">
                        {versionNumber}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {version.promptType}
                        </Badge>
                      </div>
                      {/* <CardDescription className="text-xs mt-1">
                      {version.promptHash.substring(0, 16)}...
                    </CardDescription> */}
                    </div>
                    {isLatest && (
                      <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-700 flex-shrink-0">
                        <Star className="h-3 w-3" />
                        Latest
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {version.promptDescription && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                          {version.promptDescription}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-xs break-words"
                      >
                        {version.promptDescription}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {version.accessLevel}
                    </Badge>
                    {/* <Badge variant="secondary" className="text-xs">
                    Parent: {version.parentPromptHash.substring(0, 8)}...
                  </Badge> */}
                    {/* <Badge variant="secondary" className="text-xs">
                    Cohort: {version.userRoleCohortHash.substring(0, 8)}...
                  </Badge> */}
                  </div>

                  {/* Show Prompt Content only for Latest Version */}
                  {hasContent && isLatest && (
                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-green-700">
                          Prompt Content{' '}
                        </p>
                      </div>
                      <textarea
                        className="w-full p-3 text-sm font-mono border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-900 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-80 min-h-40 resize-none"
                        value={
                          editedContent[version.promptHash] ??
                          (fetchedPromptContent[version.promptHash]
                            ?.promptContent ||
                            '')
                        }
                        onChange={(e) =>
                          handleContentChange(
                            version.promptHash,
                            e.target.value,
                            fetchedPromptContent[version.promptHash]
                              ?.promptContent || ''
                          )
                        }
                      />
                    </div>
                  )}

                  {/* Show Loading State */}
                  {fetchedPromptLoadingHash === version.promptHash &&
                    isLatest && (
                      <div className="border-t pt-4 flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <p>Loading prompt content...</p>
                      </div>
                    )}

                  {/* Show Error State */}
                  {fetchedPromptError && (
                    <div className="border-t pt-4 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle className="h-3 w-3" />
                      <p>{fetchedPromptError}</p>
                    </div>
                  )}

                  {/* Action Buttons - Show only for latest version with content */}
                  {hasContent && isLatest && (
                    <div className="pt-2 border-t flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={(e) => handleResetContent(e, version)}
                        disabled={!hasChanges[version.promptHash]}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reset
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 flex items-center gap-2"
                        onClick={(e) => handleForkVersion(e, version)}
                        disabled={!hasChanges[version.promptHash]}
                      >
                        <Copy className="h-4 w-4" />
                        Create Version
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
};

export default PromptVersions;
