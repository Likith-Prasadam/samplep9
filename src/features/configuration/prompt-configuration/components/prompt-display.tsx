import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  type ForwardedRef,
} from 'react';
import ReactMarkdown from 'react-markdown';
import { sanitizeForMarkdown } from '@/lib/prompt';
import { Pencil, RefreshCw } from 'lucide-react';
import type { PromptDisplayRef } from '../types/types';

interface PromptDisplayProps {
  systemPrompt: string;
  isLoading: boolean;
  promptHash?: string;
  onRefresh?: () => void;
}

const PromptDisplay = forwardRef(
  (
    { systemPrompt, isLoading, promptHash, onRefresh }: PromptDisplayProps,
    ref: ForwardedRef<PromptDisplayRef>
  ) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(systemPrompt);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
      setEditContent(systemPrompt);
    }, [systemPrompt]);

    useImperativeHandle(ref, () => ({
      getEditedContent: () => editContent,
    }));

    const handleRefresh = async () => {
      if (!onRefresh) return;
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    };

    return (
      <div className="relative w-full min-h-[220px] rounded-lg">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : isEditing ? (
          <div className="flex flex-col h-full">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full flex-grow bg-background text-foreground border rounded-md p-4 h-[400px] max-h-[600px] font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring break-words overflow-wrap-anywhere overflow-y-auto prompt-scrollbar"
              placeholder="Enter prompt content..."
            />
            <div className="flex justify-end space-x-2 p-2">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 bg-muted hover:bg-accent text-foreground rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 right-0 z-10 m-2 flex gap-2">
              {promptHash && onRefresh && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-accent text-foreground rounded-md text-xs transition-colors disabled:opacity-50"
                  title="Refresh prompt content from Langfuse"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  <span>Refresh</span>
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-2 py-1 bg-muted hover:bg-accent text-foreground rounded-md text-xs transition-colors"
                title="Edit prompt content"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit</span>
              </button>
            </div>
            <div className="p-4 pt-8 text-foreground h-[400px] max-h-[600px] overflow-y-auto prompt-scrollbar">
              <ReactMarkdown>{sanitizeForMarkdown(systemPrompt)}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PromptDisplay.displayName = 'PromptDisplay';

export default PromptDisplay;
