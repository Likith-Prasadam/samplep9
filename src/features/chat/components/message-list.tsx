import { useEffect, useRef } from 'react';
import { MessageBubble } from './message-bubble';

export interface ChatViewMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
}

interface MessageListProps {
  messages: ChatViewMessage[];
  isStreaming?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  endRef?: React.RefObject<HTMLDivElement | null>;
  copyEnabled?: boolean;
}

function MessageLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted/70" />
        <div className="flex-1 space-y-2 rounded-2xl border border-border/50 bg-background/70 p-4">
          <div className="h-3 w-24 animate-pulse rounded-full bg-muted/70" />
          <div className="h-3 w-full animate-pulse rounded-full bg-muted/60" />
          <div className="h-3 w-5/6 animate-pulse rounded-full bg-muted/60" />
        </div>
      </div>

      <div className="flex items-start justify-end gap-3">
        <div className="min-w-0 max-w-[78%] rounded-2xl bg-primary/10 px-4 py-3">
          <div className="space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded-full bg-primary/20" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-primary/20" />
          </div>
        </div>
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted/70" />
      </div>

      <div className="flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted/70" />
        <div className="flex-1 space-y-2 rounded-2xl border border-border/50 bg-background/70 p-4">
          <div className="h-3 w-32 animate-pulse rounded-full bg-muted/70" />
          <div className="h-3 w-11/12 animate-pulse rounded-full bg-muted/60" />
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 pl-11 text-xs text-muted-foreground">
      {/* <span>Conversation loading</span> */}
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        <span className="animate-[pulse_1.1s_ease-in-out_infinite]">.</span>
        <span className="animate-[pulse_1.1s_ease-in-out_120ms_infinite]">
          .
        </span>
        <span className="animate-[pulse_1.1s_ease-in-out_240ms_infinite]">
          .
        </span>
      </span>
    </div>
  );
}

export function MessageList({
  messages,
  isStreaming = false,
  loading = false,
  // emptyTitle = 'Start a new conversation',
  // emptyDescription = 'Send a message to begin.',
  endRef,
  copyEnabled = false,
}: MessageListProps) {
  const internalEndRef = useRef<HTMLDivElement | null>(null);
  const scrollTargetRef = endRef ?? internalEndRef;
  const lastMessageSignature = messages.length
    ? `${messages[messages.length - 1].id}:${messages[messages.length - 1].text.length}`
    : '';

  useEffect(() => {
    scrollTargetRef.current?.scrollIntoView({
      block: 'end',
      behavior: messages.length > 0 || isStreaming ? 'smooth' : 'auto',
    });
  }, [
    loading,
    isStreaming,
    messages.length,
    lastMessageSignature,
    scrollTargetRef,
  ]);

  return (
    <div className="spectra-scrollbar-wide min-h-0 flex-1 overflow-y-auto">
      <div className="space-y-6 p-4 sm:p-6">
        {loading ? (
          <MessageLoadingSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center">
            {/* <div className="text-center">
              <p className="text-base font-semibold text-foreground">
                {emptyTitle}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {emptyDescription}
              </p>
            </div> */}
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              role={message.role}
              text={message.text}
              timestamp={message.timestamp}
              showCopyAction={copyEnabled}
              isStreaming={isStreaming}
              isLastMessage={index === messages.length - 1}
            />
          ))
        )}

        {isStreaming ? <LoadingDots /> : null}

        <div ref={scrollTargetRef} style={{ scrollMarginBottom: '10rem' }} />
      </div>
    </div>
  );
}
