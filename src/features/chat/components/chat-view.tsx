import { ChatHeader } from './chat-header';
import { MessageList, type ChatViewMessage } from './message-list';

interface ChatViewProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  messages: ChatViewMessage[];
  isStreaming?: boolean;
  loading?: boolean;
  copyEnabled?: boolean;
  input: React.ReactNode;
  endRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatView({
  title,
  subtitle,
  onBack,
  messages,
  isStreaming = false,
  loading = false,
  copyEnabled = false,
  input,
  endRef,
}: ChatViewProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border/60 bg-background shadow-sm">
      <ChatHeader title={title} subtitle={subtitle} onBack={onBack} />
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        loading={loading}
        copyEnabled={copyEnabled}
        endRef={endRef}
      />
      <div className="border-t border-border/60 bg-background/95 p-3 sm:p-4">
        {input}
      </div>
    </div>
  );
}
