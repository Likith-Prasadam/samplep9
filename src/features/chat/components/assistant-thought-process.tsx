import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleDotDashed,
} from 'lucide-react';
import { LayoutGroup, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <div className="text-sm leading-relaxed text-foreground">{children}</div>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
};

const TOOL_TAG_PATTERN =
  /<(tool-thinking|tool-result)\b([^>]*)>([\s\S]*?)<\/\1>/gi;

type ThoughtProcessStep = {
  id: string;
  toolCallId?: string;
  toolName: string;
  thinking?: string;
  result?: string;
  status: 'thinking' | 'done';
};

type ParsedThoughtProcess = {
  introText: string;
  steps: ThoughtProcessStep[];
};

interface AssistantThoughtProcessProps {
  content: string;
  isStreaming?: boolean;
  isLastMessage: boolean;
  isThoughtFinished?: boolean;
  hasTextContent?: boolean;
}

const parseAttributes = (rawAttributes: string) => {
  const attributes: Record<string, string> = {};
  const attributePattern = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = attributePattern.exec(rawAttributes)) !== null) {
    attributes[match[1]] = match[2];
  }

  return attributes;
};

const normalizeThoughtProcessContent = (value: string) => {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\sicon="[^"]*"/gi, '');
};

const formatToolName = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());

const parseThoughtProcess = (content: string): ParsedThoughtProcess => {
  const normalizedContent = normalizeThoughtProcessContent(content);
  const steps: ThoughtProcessStep[] = [];
  let introText = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOOL_TAG_PATTERN.exec(normalizedContent)) !== null) {
    const leadingText = normalizedContent.slice(lastIndex, match.index).trim();
    if (!introText && leadingText) {
      introText = leadingText;
    }

    const attrs = parseAttributes(match[2]);
    const toolName = attrs.tool || attrs.name || 'tool';
    const toolCallId = attrs.tool_call_id;
    const body = match[3].trim();

    if (match[1] === 'tool-thinking') {
      steps.push({
        id: `${toolName}-${steps.length}`,
        toolCallId,
        toolName,
        thinking: body,
        status: 'thinking',
      });
    } else {
      const matchingStep = [...steps]
        .reverse()
        .find(
          (step) =>
            !step.result &&
            ((toolCallId && step.toolCallId === toolCallId) ||
              step.toolName === toolName)
        );

      if (matchingStep) {
        matchingStep.result = body;
        matchingStep.status = 'done';
      } else {
        steps.push({
          id: `${toolName}-${steps.length}`,
          toolCallId,
          toolName,
          result: body,
          status: 'done',
        });
      }
    }

    lastIndex = TOOL_TAG_PATTERN.lastIndex;
  }

  TOOL_TAG_PATTERN.lastIndex = 0;

  return {
    introText,
    steps,
  };
};

const renderMarkdown = (content: string) => {
  if (!content.trim()) {
    return null;
  }

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
};

function ThoughtTimeline({ introText, steps }: ParsedThoughtProcess) {
  const visibleSteps = useMemo(() => steps.filter(Boolean), [steps]);

  if (visibleSteps.length === 0) {
    return introText ? (
      <div className="rounded-2xl bg-muted/20 px-4 py-3">
        {renderMarkdown(introText)}
      </div>
    ) : null;
  }

  return (
    <LayoutGroup>
      <div className="space-y-3">
        {introText ? (
          <motion.div
            layout
            className="rounded-2xl bg-muted/20 px-4 py-3"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderMarkdown(introText)}
          </motion.div>
        ) : null}

        <div className="space-y-3">
          {visibleSteps.map((step, index) => {
            const isLast = index === visibleSteps.length - 1;
            const statusIcon =
              step.status === 'thinking' ? (
                <CircleDotDashed className="h-4 w-4 text-blue-500" />
              ) : step.result ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <CircleAlert className="h-4 w-4 text-yellow-500" />
              );

            return (
              <motion.div
                key={step.id}
                layout
                className="relative pl-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
              >
                <div className="absolute left-1.5 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                {!isLast ? (
                  <div className="absolute bottom-[-12px] left-[7px] top-6 w-px bg-border/50" />
                ) : null}

                <div className="rounded-2xl bg-card/70 px-4 py-3 shadow-none backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {formatToolName(step.toolName)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {step.status === 'thinking' ? 'Thinking' : 'Completed'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      {statusIcon}
                      <span>
                        {step.status === 'thinking' ? 'Working' : 'Done'}
                      </span>
                    </div>
                  </div>

                  {step.thinking ? (
                    <div className="mt-3 rounded-xl bg-muted/20 px-3 py-2.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Thought
                      </p>
                      {renderMarkdown(step.thinking)}
                    </div>
                  ) : null}

                  {step.result ? (
                    <div className="mt-3 rounded-xl bg-background/90 px-3 py-2.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Result
                      </p>
                      {renderMarkdown(step.result)}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}

export function AssistantThoughtProcess({
  content,
  isStreaming,
  isLastMessage,
  isThoughtFinished,
  hasTextContent,
}: AssistantThoughtProcessProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isFinished =
    !isStreaming || !isLastMessage || (isThoughtFinished && hasTextContent);
  const isToolCallActive = !isFinished;

  const parsedThoughtProcess = useMemo(
    () => parseThoughtProcess(content),
    [content]
  );

  useEffect(() => {
    // Keep accordion open while tool calls are active.
    // Collapse when assistant textual response starts.
    setIsOpen(isToolCallActive);
  }, [isToolCallActive, content]);

  return (
    <div className="mb-2 w-full">
      <button
        type="button"
        onClick={() => {
          if (!isToolCallActive) {
            setIsOpen(!isOpen);
          }
        }}
        className="flex cursor-pointer items-center gap-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span>Thought Process</span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="mt-2 rounded-2xl bg-background/75 p-3 shadow-none"
        >
          <ThoughtTimeline {...parsedThoughtProcess} />
        </motion.div>
      ) : null}
    </div>
  );
}
