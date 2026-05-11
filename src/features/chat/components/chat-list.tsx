import { ChatItem, type ChatItemData } from './chat-item';

interface ChatListProps {
  items: ChatItemData[];
  selectedId: string | null;
  deletingConversationIds?: Set<string>;
  loading?: boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ChatList({
  items,
  selectedId,
  deletingConversationIds,
  loading = false,
  onSelect,
  onDelete,
}: ChatListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
        <div className="h-12 animate-pulse rounded-xl bg-muted/40" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-2 py-8 text-center text-sm text-muted-foreground">
        Start a new conversation
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ChatItem
          key={item.id}
          item={item}
          isActive={selectedId === item.id}
          isDeleting={deletingConversationIds?.has(item.id)}
          onClick={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
