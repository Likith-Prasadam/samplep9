import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Bot, Check, Copy, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { AssistantThoughtProcess } from './assistant-thought-process';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: string;
  showCopyAction?: boolean;
  isStreaming?: boolean;
  isLastMessage?: boolean;
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border px-2 py-1 align-top">{children}</td>
  ),
};

const streamingToolPattern =
  /<(tool-thinking|tool-result)\b([^>]*)>([\s\S]*?)<\/\1>/gi;

type AssistantContentSegment =
  | {
      kind: 'text';
      content: string;
    }
  | {
      kind: 'tool';
      toolCallId?: string;
      toolName: string;
      status: 'thinking' | 'done';
      content: string;
      icon?: string;
    };

type ThoughtProcessStep = {
  id: string;
  toolCallId?: string;
  toolName: string;
  icon?: string;
  thinking?: string;
  result?: string;
  status: 'thinking' | 'done';
};

type AssistantRenderItem =
  | {
      kind: 'thought-process';
      steps: ThoughtProcessStep[];
      rawTextSegments: string[];
    }
  | {
      kind: 'final-answer';
      content: string;
    };

const parseTagAttributes = (rawAttributes: string) => {
  const attributes: Record<string, string> = {};
  const attributePattern = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(rawAttributes)) !== null) {
    attributes[match[1]] = match[2];
  }

  return attributes;
};

const splitAssistantContent = (content: string): AssistantContentSegment[] => {
  if (!content.trim()) {
    return [];
  }

  const segments: AssistantContentSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = streamingToolPattern.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);

    if (before.trim()) {
      segments.push({ kind: 'text', content: before });
    }

    const attrs = parseTagAttributes(match[2]);
    segments.push({
      kind: 'tool',
      toolCallId: attrs.tool_call_id,
      toolName: attrs.tool || 'tool',
      status: match[1] === 'tool-thinking' ? 'thinking' : 'done',
      content: match[3].trim(),
      icon: attrs.icon,
    });

    lastIndex = streamingToolPattern.lastIndex;
  }

  streamingToolPattern.lastIndex = 0;

  const trailingContent = content.slice(lastIndex);
  const incompleteToolIndex = trailingContent.search(
    /<(tool-thinking|tool-result)\b/i
  );
  const renderableTrailingContent =
    incompleteToolIndex >= 0
      ? trailingContent.slice(0, incompleteToolIndex)
      : trailingContent;

  if (renderableTrailingContent.trim()) {
    segments.push({ kind: 'text', content: renderableTrailingContent });
  }

  return segments;
};

const buildThoughtProcessSteps = (segments: AssistantContentSegment[]) => {
  const steps: ThoughtProcessStep[] = [];

  for (const segment of segments) {
    if (segment.kind !== 'tool') continue;

    if (segment.status === 'thinking') {
      steps.push({
        id: `${segment.toolName}-${steps.length}`,
        toolCallId: segment.toolCallId,
        toolName: segment.toolName,
        icon: segment.icon,
        thinking: segment.content,
        status: 'thinking',
      });
      continue;
    }

    const matchingStep = [...steps]
      .reverse()
      .find(
        (step) =>
          !step.result &&
          ((segment.toolCallId && step.toolCallId === segment.toolCallId) ||
            step.toolName === segment.toolName)
      );

    if (matchingStep) {
      matchingStep.result = segment.content;
      matchingStep.status = 'done';
      matchingStep.icon = segment.icon || matchingStep.icon;
      continue;
    }

    steps.push({
      id: `${segment.toolName}-${steps.length}`,
      toolCallId: segment.toolCallId,
      toolName: segment.toolName,
      icon: segment.icon,
      result: segment.content,
      status: 'done',
    });
  }

  return steps;
};

const splitAssistantRenderItems = (content: string): AssistantRenderItem[] => {
  const segments = splitAssistantContent(content);
  const lastToolIndex = segments.reduce((lastIndex, segment, index) => {
    return segment.kind === 'tool' ? index : lastIndex;
  }, -1);

  const thoughtSegments =
    lastToolIndex >= 0 ? segments.slice(0, lastToolIndex + 1) : [];
  const finalSegments =
    lastToolIndex >= 0 ? segments.slice(lastToolIndex + 1) : segments;

  const renderItems: AssistantRenderItem[] = [];

  const thoughtProcessText = thoughtSegments
    .filter(
      (
        segment
      ): segment is Extract<AssistantContentSegment, { kind: 'text' }> =>
        segment.kind === 'text'
    )
    .map((segment) => segment.content)
    .filter((entry) => entry.trim().length > 0);

  const thoughtSteps = buildThoughtProcessSteps(thoughtSegments);

  if (thoughtSteps.length > 0 || thoughtProcessText.length > 0) {
    renderItems.push({
      kind: 'thought-process',
      steps: thoughtSteps,
      rawTextSegments: thoughtProcessText,
    });
  }

  const finalAnswer = finalSegments
    .filter(
      (
        segment
      ): segment is Extract<AssistantContentSegment, { kind: 'text' }> =>
        segment.kind === 'text'
    )
    .map((segment) => segment.content)
    .join('')
    .trim();

  if (finalAnswer) {
    renderItems.push({ kind: 'final-answer', content: finalAnswer });
  }

  return renderItems;
};

const renderCustomSafetyTags = (content: string) => {
  const normalizeInlineContent = (value: string) =>
    value.replace(/\s+/g, ' ').trim();

  return content
    .replace(
      /<CRITICAL>([\s\S]*?)<\/CRITICAL>/gi,
      (_, body: string) => `**CRITICAL:** ${normalizeInlineContent(body)}`
    )
    .replace(
      /<IMPORTANT>([\s\S]*?)<\/IMPORTANT>/gi,
      (_, body: string) => `**IMPORTANT:** ${normalizeInlineContent(body)}`
    );
};

const renderMarkdown = (content: string) => {
  if (!content.trim()) return null;

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {renderCustomSafetyTags(content)}
    </ReactMarkdown>
  );
};

function AssistantContent({
  content,
  isStreaming = false,
  isLastMessage = false,
}: {
  content: string;
  isStreaming?: boolean;
  isLastMessage?: boolean;
}) {
  const renderItems = useMemo(
    () => splitAssistantRenderItems(content),
    [content]
  );

  const thoughtProcess = renderItems.find(
    (item): item is Extract<AssistantRenderItem, { kind: 'thought-process' }> =>
      item.kind === 'thought-process'
  );
  const finalAnswer = renderItems.find(
    (item): item is Extract<AssistantRenderItem, { kind: 'final-answer' }> =>
      item.kind === 'final-answer'
  );

  if (!thoughtProcess && !finalAnswer) {
    return null;
  }

  return (
    <div className="min-w-0 flex-1 space-y-3">
      {thoughtProcess ? (
        <AssistantThoughtProcess
          content={content}
          isStreaming={isStreaming}
          isLastMessage={isLastMessage}
          isThoughtFinished={Boolean(finalAnswer)}
          hasTextContent={Boolean(finalAnswer)}
        />
      ) : null}

      {finalAnswer ? (
        <div className="max-w-[780px] px-1 text-sm text-muted-foreground">
          {renderMarkdown(finalAnswer.content)}
        </div>
      ) : null}
    </div>
  );
}

export function MessageBubble({
  role,
  text,
  timestamp,
  showCopyAction = false,
  isStreaming = false,
  isLastMessage = false,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeoutId = window.setTimeout(() => {
      setCopied(false);
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copied]);

  const handleCopy = async () => {
    if (!text.trim()) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard permissions can fail in some browsers or environments.
    }
  };

  if (isUser) {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[780px]">
          <div className="rounded-2xl bg-primary px-4 py-3 text-sm text-primary-foreground shadow-sm">
            {renderMarkdown(text)}
            {timestamp ? (
              <p className="mt-2 text-[10px] text-primary-foreground/70">
                {timestamp}
              </p>
            ) : null}
          </div>
          {showCopyAction ? (
            <div className="mt-1.5 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                className="h-7 px-2 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-start gap-3">
      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
        <Bot className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <AssistantContent
          content={text}
          isStreaming={isStreaming}
          isLastMessage={isLastMessage}
        />
        {showCopyAction ? (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="mt-1 h-7 px-2 text-[11px] text-muted-foreground"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>
        ) : null}
        {timestamp ? (
          <p className="mt-2 text-[10px] text-muted-foreground">{timestamp}</p>
        ) : null}
      </div>
    </div>
  );
}
