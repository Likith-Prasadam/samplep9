interface ChatContainerProps {
  isConversationActive: boolean;
  home: React.ReactNode;
  conversation: React.ReactNode;
}

export function ChatContainer({
  isConversationActive,
  home,
  conversation,
}: ChatContainerProps) {
  return (
    <div className="flex min-h-0 flex-1">
      {isConversationActive ? conversation : home}
    </div>
  );
}
