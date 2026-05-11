import React, { useMemo } from 'react';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import { useFetchPromptVersions } from '@/hooks/use-fetch-prompt-versions';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, AlertCircle } from 'lucide-react';
import type { PromptTemplate, AccessiblePrompt } from '@/types/workflow-types';

interface PromptVersionSelectorProps {
  selectedPrompt: (PromptTemplate | AccessiblePrompt) | undefined;
  currentPromptHash: string | undefined;
  onVersionSelect: (versionHash: string) => void;
}

export const PromptVersionSelector: React.FC<PromptVersionSelectorProps> = ({
  selectedPrompt,
  currentPromptHash,
  onVersionSelect,
}) => {
  // Use promptHash from the selected prompt (from AccessiblePrompt)
  // or ref_prompt_key if available (from PromptTemplate)
  const promptKey =
    'promptHash' in (selectedPrompt || {})
      ? (selectedPrompt as AccessiblePrompt).promptHash
      : (selectedPrompt as PromptTemplate)?.ref_prompt_key || null;

  const { versions, loading, error } = useFetchPromptVersions(promptKey);

  // Filter versions to only show ones different from the current selection
  const differentVersions = useMemo(() => {
    return versions.filter((v) => v.prompt_hash !== currentPromptHash);
  }, [versions, currentPromptHash]);

  // If no different versions available, don't show selector
  if (!selectedPrompt || (versions.length === 0 && !loading)) {
    return null;
  }

  return (
    <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2 mb-3">
        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
            Version History Available
          </h4>
          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
            {differentVersions.length} other version
            {differentVersions.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-2 mb-3 rounded bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300">
            Failed to load versions: {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-300 dark:border-blue-700 border-t-blue-600 dark:border-t-blue-300 rounded-full animate-spin" />
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Loading versions...
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-xs font-medium text-blue-900 dark:text-blue-100">
            Switch to different version:
          </label>
          <Select onValueChange={onVersionSelect}>
            <SelectTrigger className="h-9 bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800">
              <SelectValue placeholder="Select a version..." />
            </SelectTrigger>
            <SelectContent>
              {differentVersions.map((version) => (
                <SelectItem
                  key={version.prompt_hash}
                  value={version.prompt_hash}
                  className="flex flex-col"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      v{version.version_number}
                    </span>
                    {version.is_latest && (
                      <Badge variant="default" className="text-xs">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Created:{' '}
                    {formatTimeInTimezone(
                      version.created_at,
                      getUserTimezone(),
                      'date'
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    By: {version.created_by}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">
        Current: v
        {versions.find((v) => v.prompt_hash === currentPromptHash)
          ?.version_number || '?'}
        {versions.find((v) => v.prompt_hash === currentPromptHash)
          ?.is_latest && (
          <Badge variant="secondary" className="ml-2 text-xs">
            Latest
          </Badge>
        )}
      </p>
    </div>
  );
};
