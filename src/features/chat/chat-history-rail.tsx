import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  // History,
  ChevronDown,
  ChevronUp,
  Clock3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import type { ChatThreadSummary } from './thread-api';

interface ChatHistoryRailProps {
  mode: 'home' | 'conversation';
  title: string;
  subtitle: string;
  homeLabel: string;
  onHome: () => void;
  threads: ChatThreadSummary[];
  selectedThreadId: string | null;
  loading?: boolean;
  onSelectThread: (threadId: string) => void;
  surface?: 'card' | 'embedded';
}

const getThreadTitle = (thread: ChatThreadSummary) => {
  if (thread.thread_title?.trim()) return thread.thread_title.trim();
  if (thread.title?.trim()) return thread.title.trim();
  if (thread.entity_hash?.trim()) return thread.entity_hash.trim();
  if (thread.selected_source?.trim()) return thread.selected_source.trim();
  return 'Untitled conversation';
};

export function ChatHistoryRail({
  mode,
  title,
  subtitle,
  homeLabel,
  onHome,
  threads,
  selectedThreadId,
  loading,
  onSelectThread,
  surface = 'card',
}: ChatHistoryRailProps) {
  const [expanded, setExpanded] = useState(false);
  const visibleThreads = useMemo(
    () => (expanded ? threads : threads.slice(0, 3)),
    [expanded, threads]
  );
  const isEmbedded = surface === 'embedded';

  if (mode === 'conversation') {
    return (
      <div
        className={
          isEmbedded
            ? 'flex items-center gap-3 border-b border-border/60 px-4 py-4 sm:px-6'
            : 'flex items-center gap-3 border-b border-border/60 bg-card/90 px-4 py-4 backdrop-blur-sm sm:px-6'
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          onClick={onHome}
          aria-label={homeLabel}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-semibold text-foreground">
            {title}
          </p>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isEmbedded
          ? 'flex min-h-0 flex-1 flex-col'
          : 'flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm'
      }
    >
      <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="space-y-1">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Chat history
          </p>
          {/* <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p> */}
        </div>

        {/* <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-2 py-1 text-xs text-muted-foreground">
          <History className="h-3.5 w-3.5" />
          <span>Latest 3</span>
        </div> */}
      </div>

      <div className="flex items-center gap-3  px-4 py-3 sm:px-6">
        <div className="h-px flex-1 bg-border/60" />
        {threads.length > 3 && (
          <Button
            type="button"
            variant="ghost"
            className="h-auto rounded-none px-0 py-0 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? (
              <>
                <ChevronUp className="mr-1 h-3.5 w-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3.5 w-3.5" />
                Load more
              </>
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="min-h-0 flex-1 px-4 py-4 sm:px-6">
        <div className="space-y-2">
          {loading ? (
            <div className="px-1 py-2 text-sm text-muted-foreground">
              Loading conversations...
            </div>
          ) : visibleThreads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-background/60 px-4 py-8 text-center text-sm text-muted-foreground">
              No prior conversations yet. Start by typing below.
            </div>
          ) : (
            visibleThreads.map((thread) => {
              const threadId = thread.thread_hash ?? thread.thread_id;
              if (!threadId) return null;

              const isActive = threadId === selectedThreadId;
              const updatedAt = thread.updated_at
                ? formatTimeInTimezone(
                    new Date(thread.updated_at),
                    getUserTimezone(),
                    'datetime'
                  )
                : 'Recently updated';

              return (
                <button
                  key={threadId}
                  type="button"
                  onClick={() => onSelectThread(threadId)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                    isActive
                      ? 'border-primary/40 bg-primary/10 shadow-sm'
                      : 'border-border/60 bg-background/70 hover:bg-muted/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {getThreadTitle(thread)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {/* {thread.thread_type?.replace('_', ' ')}
                        {thread.selected_source
                          ? ` · ${thread.selected_source}`
                          : ''} */}
                      </p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {thread.message_count ?? 0}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock3 className="h-3 w-3" />
                    <span>{updatedAt}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
