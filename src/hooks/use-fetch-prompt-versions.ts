import { useQuery } from '@apollo/client';
import { GET_PROMPT_VERSIONS } from '@/graphql/workflow_queries';
import type { PromptVersion } from '@/types/workflow-types';

interface UsePromptVersionsResult {
  versions: PromptVersion[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch all available versions of a prompt
 * @param promptHash - The hash of the prompt to fetch versions for
 * @returns Object containing versions, loading state, and error
 */
export function useFetchPromptVersions(
  promptHash: string | null
): UsePromptVersionsResult {
  const { data, loading, error } = useQuery(GET_PROMPT_VERSIONS, {
    variables: { parentPromptHash: promptHash || '' },
    skip: !promptHash, // Skip query if no promptHash provided
    fetchPolicy: 'network-only',
  });

  // Map the response fields to PromptVersion interface
  const versions: PromptVersion[] = (data?.getPromptVersions || []).map(
    (item: {
      promptHash: string;
      parentPromptHash: string;
      promptName: string;
      promptType: string;
    }) => ({
      prompt_id: item.promptHash,
      prompt_hash: item.promptHash,
      ref_prompt_key: item.parentPromptHash,
      prompt_name: item.promptName,
      prompt_category: item.promptType,
      version_number: 1, // Default since not provided by API
      prompt_content: '',
      created_by: 'unknown',
      created_at: new Date().toISOString(),
      is_latest: true,
      parent_prompt_id: item.parentPromptHash,
    })
  );
  const errorMessage = error?.message || null;

  return {
    versions,
    loading,
    error: errorMessage,
  };
}
