import { useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { sanitizeForMarkdown } from '@/lib/prompt';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import type { RootState } from '@/store';

interface FetchedPromptDisplayProps {
  promptHash?: string;
}

/**
 * Component to display fetched prompt content after getPromptByHash call
 * Shows the prompt content returned from Langfuse
 */
export const FetchedPromptDisplay = ({
  promptHash,
}: FetchedPromptDisplayProps) => {
  const { fetchedPrompt } = useSelector(
    (state: RootState) => state.promptConfiguration
  );

  // If promptHash is provided, get content for that specific hash
  // Otherwise, get the first available content
  let prompt = null;
  let loading = false;

  if (promptHash) {
    prompt = fetchedPrompt.contentByHash[promptHash] || null;
    loading = fetchedPrompt.loadingHash === promptHash;
  } else if (Object.keys(fetchedPrompt.contentByHash).length > 0) {
    // Get first available prompt if no hash specified
    const firstHash = Object.keys(fetchedPrompt.contentByHash)[0];
    prompt = fetchedPrompt.contentByHash[firstHash];
    loading = fetchedPrompt.loadingHash === firstHash;
  }

  const error = fetchedPrompt.error;

  if (!prompt && !loading && !error) {
    return null; // Don't show anything if no prompt is fetched
  }

  return (
    <div className="border rounded-lg bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        {loading && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-semibold">Loading prompt content...</span>
          </>
        )}
        {error && (
          <>
            <AlertCircle className="h-5 w-5 text-destructive" />
            <span className="font-semibold text-destructive">
              Error: {error}
            </span>
          </>
        )}
        {prompt && !loading && (
          <>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <span className="font-semibold text-green-600">
                Prompt Loaded Successfully
              </span>
              {prompt.promptName && (
                <p className="text-xs text-muted-foreground">
                  {prompt.promptName}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {prompt && !loading && (
        <div className="space-y-4">
          {prompt.promptDescription && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Description
              </p>
              <p className="text-sm">{prompt.promptDescription}</p>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Prompt Content
            </p>
            <div className="bg-muted rounded-md p-4 max-h-[400px] overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>
                  {sanitizeForMarkdown(prompt.promptContent)}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground">Type</p>
              <p>{prompt.promptType}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">
                Reference Key
              </p>
              <p className="font-mono break-all">{prompt.refPromptKey}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold text-muted-foreground">Hash</p>
              <p className="font-mono break-all text-xs">{prompt.promptHash}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FetchedPromptDisplay;
