import { useState } from 'react';
import {
  Plus,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppSelector } from '@/store';
import { selectSelectedTimezoneIana } from '@/store/slices/timezone-slice';
import { formatTimeInTimezone } from '@/utils/timeUtils';

import type { ConnectedIntelligenceConversationThread } from '../types';

interface ConnectedIntelligenceConversationSidebarProps {
  conversationThreads: ConnectedIntelligenceConversationThread[];
  activeConversationId: string | null;
  deletingConversationIds: Set<string>;
  onSelectConversation: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (threadId: string) => void;
  isConversationThreadsLoading: boolean;
  isStreaming: boolean;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

const formatTimestamp = (value: string | undefined, timezone: string) => {
  if (!value) return 'No activity yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No activity yet';

  return formatTimeInTimezone(date, timezone, 'datetime');
};

export function ConnectedIntelligenceConversationSidebar({
  conversationThreads,
  activeConversationId,
  deletingConversationIds,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  isConversationThreadsLoading,
  isStreaming,
  collapsed = false,
  onToggleCollapsed,
}: ConnectedIntelligenceConversationSidebarProps) {
  const [deleteThreadId, setDeleteThreadId] = useState<string | null>(null);
  const selectedTimezone = useAppSelector(selectSelectedTimezoneIana);

  if (collapsed) {
    return (
      <div className="flex h-full w-12 min-h-0 flex-col overflow-hidden bg-background">
        <div className="group flex shrink-0 flex-col items-center gap-2 border-b border-border/70 px-1.5 py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-md"
            onClick={onToggleCollapsed}
            aria-label="Expand conversations"
          >
            <span className="text-[10px] font-semibold tracking-wide transition-opacity duration-200 group-hover:opacity-0">
              CI
            </span>
            <PanelLeftOpen className="absolute h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={onNewChat}
            disabled={isStreaming}
            aria-label="New chat"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="sticky top-0 z-10 shrink-0 border-b border-border/70 bg-background px-3 py-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center rounded-md px-1">
            <span className="text-xs font-semibold tracking-wide text-foreground/90">
              Connected Intelligence
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-md"
            onClick={onToggleCollapsed}
            aria-label="Collapse conversations"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-2">
          <Button
            variant="default"
            className="h-10 w-full justify-start gap-2 rounded-lg border border-border/70 bg-background px-3 text-sm font-medium text-foreground shadow-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2"
            onClick={onNewChat}
            disabled={isStreaming}
          >
            <Plus className="h-4 w-4" />
            <span>New chat</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {isConversationThreadsLoading ? (
            <div className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
              Loading conversations...
            </div>
          ) : conversationThreads.length > 0 ? (
            conversationThreads.map((thread) => {
              const isActive = thread.id === activeConversationId;
              const isDeleting = deletingConversationIds.has(thread.id);

              return (
                <div
                  key={thread.id}
                  className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${
                    isDeleting
                      ? 'bg-muted/70 opacity-70'
                      : isActive
                        ? 'bg-primary/10'
                        : 'bg-background hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      disabled={isDeleting}
                      onClick={() => {
                        if (!isDeleting) {
                          onSelectConversation(thread.id);
                        }
                      }}
                    >
                      <div className="line-clamp-1 text-sm font-medium text-foreground">
                        {thread.title}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          {formatTimestamp(thread.updatedAt, selectedTimezone)}
                        </span>
                      </div>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-md text-muted-foreground"
                          onClick={(event) => event.stopPropagation()}
                          disabled={isDeleting}
                          aria-label="Conversation actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteThreadId(thread.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-border/70 px-3 py-4 text-center text-xs text-muted-foreground">
              No saved conversations yet.
            </div>
          )}
        </div>
      </ScrollArea>

      <AlertDialog
        open={Boolean(deleteThreadId)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteThreadId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected thread.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteThreadId) {
                  onDeleteConversation(deleteThreadId);
                }
                setDeleteThreadId(null);
              }}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
