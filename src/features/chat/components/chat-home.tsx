import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatList } from './chat-list';
import type { ChatItemData } from './chat-item';

interface ChatHomeProps {
  title?: string;
  subtitle?: string;
  items: ChatItemData[];
  selectedId: string | null;
  deletingConversationIds?: Set<string>;
  loading?: boolean;
  hasMore: boolean;
  onSelect: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  onLoadMore: () => void;
  input: React.ReactNode;
}

export function ChatHome({
  title,
  subtitle,
  items,
  selectedId,
  deletingConversationIds,
  loading = false,
  hasMore,
  onSelect,
  onDeleteConversation,
  onLoadMore,
  input,
}: ChatHomeProps) {
  const showHeader = Boolean(title || subtitle);

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-background shadow-sm">
      {showHeader ? (
        <div className="border-b border-border/60 px-3 py-1.5 sm:px-4">
          {title ? (
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          ) : null}
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      ) : null}

      <ScrollArea className="min-h-0 flex-1 px-3 py-1.5 sm:px-4">
        <ChatList
          items={items}
          selectedId={selectedId}
          deletingConversationIds={deletingConversationIds}
          loading={loading}
          onSelect={onSelect}
          onDelete={onDeleteConversation}
        />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/60" />
          {hasMore ? (
            <button
              type="button"
              onClick={onLoadMore}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Load more
            </button>
          ) : null}
          <div className="h-px flex-1 bg-border/60" />
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 bg-background/95 p-3 sm:p-4">
        {input}
      </div>
    </div>
  );
}
