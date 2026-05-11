import { useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInputShell } from '@/features/chat/components/chat-input-shell';
import {
  MessageList,
  type ChatViewMessage,
} from '@/features/chat/components/message-list';
import type { ConnectedIntelligenceMessage } from '../types';
import { useAppSelector } from '@/store';
import { selectSelectedTimezoneIana } from '@/store/slices/timezone-slice';

interface ConnectedIntelligenceChatPanelProps {
  userName?: string;
  message: string;
  onMessageChange: (value: string) => void;
  messages: ConnectedIntelligenceMessage[];
  onSend: () => void;
  models?: Array<{ modelHash: string; modelName: string }>;
  selectedModel?: string;
  onModelChange?: (value: string) => void;
  modelsLoading?: boolean;
  isStreaming: boolean;
  isHistoryLoading: boolean;
  chatError: string | null;
}

type TimelineItem = {
  kind: 'user' | 'assistant';
  id: string;
  content: string;
  timestamp?: string;
};

const mapTimelineToChatMessages = (
  timelineItems: TimelineItem[]
): ChatViewMessage[] =>
  timelineItems.map((item) => ({
    id: item.id,
    role: item.kind,
    text: item.content,
  }));

const buildTimelineItems = (
  messages: ConnectedIntelligenceMessage[]
): TimelineItem[] =>
  messages.map((message) => ({
    kind: message.role === 'user' ? 'user' : 'assistant',
    id: message.id,
    content: message.content,
    timestamp: message.timestamp,
  }));

export function ConnectedIntelligenceChatPanel({
  userName,
  message,
  onMessageChange,
  messages,
  onSend,
  isStreaming,
  isHistoryLoading,
  chatError,
  models = [],
  selectedModel,
  onModelChange,
  modelsLoading = false,
}: ConnectedIntelligenceChatPanelProps) {
  const selectedTimezone = useAppSelector(selectSelectedTimezoneIana);
  const timelineItems = buildTimelineItems(messages);
  const shouldDockComposer =
    timelineItems.length > 0 ||
    Boolean(message.trim()) ||
    isStreaming ||
    isHistoryLoading;

  const greeting = useMemo(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone: selectedTimezone,
    });
    const hour = Number.parseInt(formatter.format(new Date()), 10);
    const salutation =
      hour < 12
        ? 'Good morning'
        : hour < 18
          ? 'Good afternoon'
          : 'Good evening';

    return `${salutation}${userName ? `, ${userName}` : ''}`;
  }, [selectedTimezone, userName]);

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-3xl p-4 pb-28 sm:p-6 sm:pb-32">
            {timelineItems.length > 0 || isHistoryLoading ? (
              <MessageList
                messages={mapTimelineToChatMessages(timelineItems)}
                loading={isHistoryLoading}
                isStreaming={isStreaming}
                copyEnabled
              />
            ) : null}

            {chatError ? (
              <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {chatError}
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <div
          className={`pointer-events-none absolute inset-x-0 z-20 px-3 transition-all duration-500 ease-out sm:px-5 ${
            shouldDockComposer
              ? 'bottom-4 translate-y-0 sm:bottom-5'
              : 'top-1/2 -translate-y-1/2'
          }`}
        >
          {!shouldDockComposer ? (
            <div className="mx-auto mb-4 w-full max-w-xl space-y-2 text-center transition-all duration-500 ease-out">
              <p className="text-sm font-medium text-muted-foreground">
                {greeting}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                What would you like to investigate?
              </h2>
            </div>
          ) : null}

          <ChatInputShell
            value={message}
            onChange={onMessageChange}
            onSend={onSend}
            isLoading={isHistoryLoading}
            isStreaming={isStreaming}
            placeholder="Ask about patterns, alerts, root causes, or request evidence clips..."
            models={models}
            selectedModel={selectedModel}
            onModelChange={onModelChange}
            modelsLoading={modelsLoading}
            showModelSelector
            className={`pointer-events-auto mx-auto w-full max-w-3xl bg-background shadow-none transition-all duration-500 ease-out focus-within:ring-0 ${
              shouldDockComposer
                ? 'rounded-none border-none px-0 py-0'
                : 'rounded-2xl  px-4 py-4 sm:px-5 sm:py-5'
            }`}
          />
        </div>
      </div>
    </div>
  );
}
