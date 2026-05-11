import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import {
  Bot,
  User,
  Search,
  Video,
  Wrench,
  AlertTriangle,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { JSX, HTMLAttributes } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ORG_MODELS } from '@/graphql/mutations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import ChatInput from '@/features/playground/components/chat-input';
import {
  ChatContainer,
  ChatHeader,
  ChatHome,
  type ChatItemData,
} from '@/features/chat/components';
import {
  createChatThread,
  deleteChatThreadById,
  fetchChatHistoryByThreadId,
  listChatThreads,
  type ChatThreadSummary,
} from '@/features/chat/thread-api';
import {
  formatTimeInTimezone,
  getUTCOffsetString,
  getUserTimezone,
} from '@/utils/timeUtils';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';
import { getUserSession } from '@/lib/ssemanager';
import {
  buildHybridChatPayload,
  runBackendChatStream,
} from '@/features/chat/chat-agent';
import { AssistantThoughtProcess } from '@/features/chat/components/assistant-thought-process';
import { useAppDispatch, useAppSelector } from '@/store/index';
import {
  selectChatPanelState,
  setChatPanelActiveChat,
  setChatPanelDraft,
} from '@/store/slices/chat-panel-slice';
import { selectSelectedTimezoneIana } from '@/store/slices/timezone-slice';
import {
  convertElementDescriptionToMarkdownTable,
  extractTextFromSseDataLines,
} from '@/utils/chat-table-format';
import { selectDefaultChatModelHash } from '@/utils/chat-model-default';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: { text: string }[];
  timestamp?: string;
  id: number;
}

interface ChatInterfaceProps {
  camHash?: string;
  onOpenConfiguration?: () => void;
  defaultModelHash?: string;
  defaultDurationMinutes?: string;
}

const escapeToolAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const escapeToolText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

interface ToolThinkingProps extends HTMLAttributes<HTMLElement> {
  icon?: string;
  tool?: string;
  name?: string;
}

interface ToolResultProps extends HTMLAttributes<HTMLElement> {
  icon?: string;
  tool?: string;
  name?: string;
  status?: string;
  count?: string | number;
}

interface MarkdownComponents {
  div?: (props: HTMLAttributes<HTMLDivElement>) => JSX.Element;
  h1?: (props: HTMLAttributes<HTMLHeadingElement>) => JSX.Element;
  h2?: (props: HTMLAttributes<HTMLHeadingElement>) => JSX.Element;
  p?: (props: HTMLAttributes<HTMLParagraphElement>) => JSX.Element;
  ul?: (props: HTMLAttributes<HTMLUListElement>) => JSX.Element;
  ol?: (props: HTMLAttributes<HTMLOListElement>) => JSX.Element;
  li?: (props: HTMLAttributes<HTMLLIElement>) => JSX.Element;
  hr?: () => null;
  highlight?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  important?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  critical?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  warning?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  alert?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  note?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  span?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  strong?: (props: HTMLAttributes<HTMLElement>) => JSX.Element;
  table?: (props: HTMLAttributes<HTMLTableElement>) => JSX.Element;
  thead?: (props: HTMLAttributes<HTMLTableSectionElement>) => JSX.Element;
  tbody?: (props: HTMLAttributes<HTMLTableSectionElement>) => JSX.Element;
  tr?: (props: HTMLAttributes<HTMLTableRowElement>) => JSX.Element;
  th?: (props: HTMLAttributes<HTMLTableCellElement>) => JSX.Element;
  td?: (props: HTMLAttributes<HTMLTableCellElement>) => JSX.Element;
  'tool-thinking'?: (props: ToolThinkingProps) => JSX.Element;
  'tool-result'?: (props: ToolResultProps) => JSX.Element;
}

const customSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'highlight',
    'important',
    'critical',
    'warning',
    'alert',
    'note',
    'tool-thinking',
    'tool-result',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] || []),
      'style',
      'class',
      'icon',
      'tool',
      'status',
      'count',
      'name',
      'tool_call_id',
    ],
  },
};

const ToolThinking = ({
  icon,
  tool,
  name,
  children,
}: ToolThinkingProps & { children?: React.ReactNode }) => {
  const Icon =
    icon === 'video'
      ? Video
      : icon === 'search'
        ? Search
        : icon === 'tool'
          ? Wrench
          : Loader2;

  return (
    <div className="my-2 flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      <Icon className="w-3.5 h-3.5 animate-pulse" />
      <span className="font-medium opacity-90">
        {children || `Using ${tool || name || 'tool'}...`}
      </span>
    </div>
  );
};

const ToolResult = ({
  icon,
  tool,
  name,
  status,
  count,
  children,
}: ToolResultProps & { children?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon =
    icon === 'video'
      ? Video
      : icon === 'search'
        ? Search
        : icon === 'tool'
          ? Wrench
          : CheckCircle2;

  const contentStr = String(children || '').trim();
  const hasContent = contentStr && contentStr !== '[]' && contentStr !== 'null';

  return (
    <div className="my-2 text-xs">
      <div
        className={`flex items-center gap-2 rounded-md bg-muted/20 px-3 py-2 ${
          hasContent ? 'cursor-pointer hover:bg-muted/30' : ''
        }`}
        onClick={() => hasContent && setIsOpen(!isOpen)}
      >
        <Icon className="w-3.5 h-3.5 text-green-500" />
        <span className="flex-1 font-medium text-muted-foreground">
          {status === 'complete' ? 'Finished' : 'Processed'}{' '}
          {tool || name || 'tool'}
          {count ? ` (${count} items)` : ''}
        </span>
        {hasContent && (
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>
      {isOpen && hasContent && (
        <div className="mt-1 overflow-x-auto rounded-md bg-muted/25 p-2">
          <pre className="text-[10px] text-muted-foreground font-mono whitespace-pre-wrap break-all">
            {contentStr}
          </pre>
        </div>
      )}
    </div>
  );
};

const markdownComponents: MarkdownComponents = {
  div: ({ children, ...props }) => (
    <div className="prose prose-sm dark:prose-invert max-w-none" {...props}>
      {children}
    </div>
  ),
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>
      {children}
    </h2>
  ),
  p: ({ children, ...props }) => (
    <p className="text-sm leading-relaxed mb-2" {...props}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
  ),
  li: ({ children, ...props }) => (
    <li className="text-sm leading-relaxed" {...props}>
      {children}
    </li>
  ),
  hr: () => null,
  highlight: ({ children }) => (
    <span className="font-bold text-blue-600 dark:text-blue-400">
      {children}
    </span>
  ),
  important: ({ children, style, ...props }: HTMLAttributes<HTMLElement>) => (
    <span className="font-semibold" style={style} {...props}>
      {children}
    </span>
  ),
  critical: ({ children, style, ...props }: HTMLAttributes<HTMLElement>) => (
    <span className="font-bold" style={style} {...props}>
      {children}
    </span>
  ),
  warning: ({ children, style, ...props }: HTMLAttributes<HTMLElement>) => (
    <span className="font-medium" style={style} {...props}>
      {children}
    </span>
  ),
  alert: ({ children, style, ...props }: HTMLAttributes<HTMLElement>) => (
    <span className="font-semibold" style={style} {...props}>
      {children}
    </span>
  ),
  note: ({ children, style, ...props }: HTMLAttributes<HTMLElement>) => (
    <span className="font-normal" style={style} {...props}>
      {children}
    </span>
  ),
  span: ({ children, style, ...props }: HTMLAttributes<HTMLSpanElement>) => {
    if (style && typeof style === 'object' && 'color' in style) {
      return (
        <span style={style} {...props}>
          {children}
        </span>
      );
    }
    return <span {...props}>{children}</span>;
  },
  strong: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold" {...props}>
      {children}
    </strong>
  ),
  table: ({ children, ...props }) => (
    <div className="my-4 w-full max-w-full overflow-x-auto spectra-scrollbar">
      <div className="inline-block min-w-full align-middle rounded-xl border border-border/70 border-l-4 border-l-primary/60 bg-muted/60 shadow-sm">
        <table
          className="w-max min-w-full border-collapse text-xs text-left"
          {...props}
        >
          {children}
        </table>
      </div>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-muted" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }) => (
    <tr className="border-b last:border-0 border-border/40" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th
      className="px-3 py-1.5 font-semibold border border-border/40 whitespace-normal break-words"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-3 py-1.5 border border-border/40 align-top whitespace-normal break-words"
      {...props}
    >
      {children}
    </td>
  ),
  'tool-thinking': ToolThinking,
  'tool-result': ToolResult,
};
const highlightTags = (text: string): string => {
  const standardTags = [
    'span',
    'div',
    'p',
    'strong',
    'em',
    'b',
    'i',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'a',
    'code',
    'pre',
    'blockquote',
    'hr',
    'br',
    'img',
    'table',
    'tr',
    'td',
    'th',
    'thead',
    'tbody',
    'tfoot',
    'header',
    'footer',
    'nav',
    'section',
    'article',
    'aside',
    'main',
    'highlight',
    'important',
    'critical',
    'warning',
    'alert',
    'note',
    'tool-thinking',
    'tool-result',
  ];

  const processed = text.replace(
    /<(\w+)(?:\s[^>]*)?>(.*?)<\/\1>/gi,
    (match, tagName, content) => {
      if (standardTags.includes(tagName.toLowerCase())) {
        return match;
      }
      return `<strong style="color: #3b82f6; font-weight: 700;">&lt;${tagName}&gt;${content}&lt;/${tagName}&gt;</strong>`;
    }
  );

  return processed.replace(
    /<(\w+)(?:\s[^>]*)?\/?>(?![^<]*<\/\1>)/gi,
    (match, tagName) => {
      if (standardTags.includes(tagName.toLowerCase())) {
        return match;
      }
      return `<strong style="color: #3b82f6; font-weight: 700;">${match}</strong>`;
    }
  );
};

// Normalize "flattened" markdown tables where table rows were concatenated
// into a single line. This turns patterns like "| ... | | ... |" back into
// proper line breaks so ReactMarkdown can render a real table.
const normalizeTableMarkdown = (text: string): string => {
  if (!text.includes('|') || !text.includes('---')) return text;
  return text.replace(/\|\s*\|(?=\s*\S)/g, '|\n|');
};

// Note: timestamp formatting is done per-message inside MessageItem

const MessageItem: React.FC<{
  message: ChatMessage;
  isLastMessage: boolean;
  showSpinner: boolean;
  isStreaming?: boolean;
}> = ({ message, isLastMessage, showSpinner, isStreaming }) => {
  const selectedTimezone = useAppSelector(selectSelectedTimezoneIana);

  const renderTimestamp = (time?: string) => {
    if (!time) return '';
    const isLambdaFormat = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(time);
    if (isLambdaFormat) {
      const toUTC = `${time.replace(' ', 'T')}Z`;
      return formatTimeInTimezone(toUTC, selectedTimezone, 'time');
    }
    const isISOFormat = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z/.test(time);
    if (isISOFormat) {
      return formatTimeInTimezone(time, selectedTimezone, 'time');
    }
    return time;
  };
  const processMessageText = (text: string): string => {
    const decoded = extractTextFromSseDataLines(text);
    const tabular = convertElementDescriptionToMarkdownTable(decoded);
    const processed = highlightTags(tabular);
    return normalizeTableMarkdown(processed);
  };

  const [copied, setCopied] = useState(false);
  const fullText = message.content.map((c) => String(c.text ?? '')).join('\n');

  // Check if message contains an error
  const isErrorMessage = message.content.some((content) =>
    String(content.text).startsWith('Error:')
  );

  const handleCopy = async () => {
    if (!fullText.trim() || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      logger.error('Failed to copy chat message', e);
    }
  };

  const splitContent = (text: string) => {
    // Find the last closing tag of a tool
    const closeRegex = /<\/tool-(?:thinking|result)>/g;
    let lastCloseMatch;
    let lastCloseIndex = -1;
    while ((lastCloseMatch = closeRegex.exec(text)) !== null) {
      lastCloseIndex = lastCloseMatch.index + lastCloseMatch[0].length;
    }

    // Check for any opening tag after the last closing tag (or from start if none closed)
    const openRegex = /<tool-(?:thinking|result)/g;
    openRegex.lastIndex = lastCloseIndex === -1 ? 0 : lastCloseIndex;
    const hasOpenTag = openRegex.test(text);

    if (hasOpenTag) {
      // We have an unclosed tool tag, or a tool tag after the last closed one.
      // Everything is part of the thought process until the tool chain finishes.
      return { toolsPart: text, textPart: '', hasOpenTag: true };
    }

    if (lastCloseIndex !== -1) {
      // We have closed tools and no open ones after.
      const toolsPart = text.slice(0, lastCloseIndex);
      const textPart = text.slice(lastCloseIndex).trim();
      return { toolsPart, textPart, hasOpenTag: false };
    }

    // No tools found.
    return { toolsPart: '', textPart: text, hasOpenTag: false };
  };

  const isAssistant = message.role === 'assistant';

  return (
    <div
      className={`flex flex-col gap-1 ${
        isAssistant ? 'items-start' : 'items-end'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
          isAssistant
            ? isErrorMessage
              ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
              : 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {isAssistant ? (
          isErrorMessage ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      <div
        className={`flex flex-col ${
          isAssistant ? 'items-start' : 'items-end'
        } max-w-[92%] xl:max-w-[80%]`}
      >
        {message.role === 'assistant' ? (
          <>
            {message.content.map((t, idx) => {
              const text = String(t.text);
              if (message.role === 'assistant') {
                const { toolsPart, textPart, hasOpenTag } = splitContent(text);
                return (
                  <React.Fragment key={idx}>
                    {toolsPart && (
                      <AssistantThoughtProcess
                        content={toolsPart}
                        isStreaming={isStreaming}
                        isLastMessage={isLastMessage}
                        isThoughtFinished={!hasOpenTag}
                        hasTextContent={!!textPart}
                      />
                    )}
                    {textPart && (
                      <div
                        className={`rounded-2xl px-4 py-3 shadow-sm rounded-tl-sm w-[110%] ${
                          textPart.startsWith('Error:')
                            ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800'
                            : 'bg-muted/50 text-foreground'
                        }`}
                      >
                        <div
                          className={`text-xs font-medium mb-1.5 flex items-center gap-1 ${
                            textPart.startsWith('Error:')
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {textPart.startsWith('Error:') && (
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                          Spectra
                        </div>
                        <div
                          className={`text-sm leading-relaxed ${
                            textPart.startsWith('Error:')
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-foreground'
                          }`}
                        >
                          <ReactMarkdown
                            components={markdownComponents}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[
                              rehypeRaw,
                              [rehypeSanitize, customSanitizeSchema],
                            ]}
                          >
                            {processMessageText(textPart)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              }
            })}
            {showSpinner ? (
              <div className="rounded-2xl rounded-tl-sm border border-border/60 bg-card px-4 py-3 text-foreground shadow-sm">
                <div className="text-xs font-medium mb-1.5 text-muted-foreground">
                  Spectra
                </div>
                <span className="inline-block align-middle ml-2">
                  <div className="w-3 h-3 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <div className="max-w-full rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground shadow-sm overflow-hidden">
            <div className="text-xs font-medium mb-1.5 text-white/90">You</div>
            <div
              className="text-sm leading-relaxed text-primary-foreground break-words whitespace-pre-wrap"
              style={{ overflowWrap: 'anywhere' }}
            >
              <ReactMarkdown
                components={markdownComponents}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[
                  rehypeRaw,
                  [rehypeSanitize, customSanitizeSchema],
                ]}
              >
                {processMessageText(String(message.content[0]?.text || ''))}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {(message.timestamp || fullText.trim()) && (
          <div
            className={`mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground ${
              isAssistant ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.timestamp && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help hover:text-foreground transition-colors">
                      {renderTimestamp(message.timestamp)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <div className="space-y-1">
                      <p>{renderTimestamp(message.timestamp)}</p>
                      <p>
                        {getUTCOffsetString(
                          new Date(message.timestamp),
                          selectedTimezone
                        )}
                      </p>
                      <p className="text-muted-foreground">
                        {selectedTimezone}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {fullText.trim() && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-muted text-[11px]"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MemoizedMessageItem = React.memo(MessageItem);

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  camHash,
  onOpenConfiguration,
  defaultModelHash,
  defaultDurationMinutes,
}) => {
  // Fetch all available models (like playground chat does)
  const { data: modelsData, loading: modelsLoading } = useQuery(
    GET_ORG_MODELS,
    {
      fetchPolicy: 'network-only',
    }
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  // Model selection state
  const [models, setModels] = useState<
    Array<{ modelHash: string; modelName: string; modelType: string }>
  >([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  // Duration selection state (in minutes)
  const [selectedDuration, setSelectedDuration] = useState<string>('60');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState('');
  useEffect(() => {
    if (!defaultDurationMinutes) return;
    const minutes = parseFloat(defaultDurationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    setSelectedDuration(defaultDurationMinutes);
  }, [defaultDurationMinutes]);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const assistantIndexRef = useRef<number | null>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const lastScrollTopRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadHistory, setThreadHistory] = useState<ChatThreadSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [threadMessagesLoading, setThreadMessagesLoading] = useState(false);
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(3);
  const [threadPreviews, setThreadPreviews] = useState<Record<string, string>>(
    {}
  );
  const [deletingConversationIds, setDeletingConversationIds] = useState<
    Set<string>
  >(new Set());
  const dispatch = useAppDispatch();
  const panelKey = useMemo(() => `live:${camHash || 'unknown'}`, [camHash]);
  const panelState = useAppSelector((state) =>
    selectChatPanelState(state, panelKey)
  );

  const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;

  const activeThread = threadHistory.find(
    (thread) => (thread.thread_hash ?? thread.thread_id) === threadId
  );

  useEffect(() => {
    setThreadId(panelState.activeChatId);
    setUserQuery(panelState.draft);
  }, [panelState.activeChatId, panelState.draft, panelKey]);

  const updateThreadId = useCallback(
    (value: string | null) => {
      setThreadId(value);
      dispatch(setChatPanelActiveChat({ panelKey, activeChatId: value }));
    },
    [dispatch, panelKey]
  );

  const updateUserQuery = useCallback(
    (value: string) => {
      setUserQuery(value);
      dispatch(setChatPanelDraft({ panelKey, draft: value }));
    },
    [dispatch, panelKey]
  );

  const touchThreadHistory = useCallback(
    (threadHash: string, shouldCreate: boolean, threadTitle?: string) => {
      setThreadHistory((prev) => {
        const now = new Date().toISOString();
        const existingIndex = prev.findIndex(
          (thread) => (thread.thread_hash ?? thread.thread_id) === threadHash
        );

        if (existingIndex >= 0) {
          const next = [...prev];
          const existing = next[existingIndex];
          next[existingIndex] = {
            ...existing,
            thread_hash: threadHash,
            thread_id: existing.thread_id ?? threadHash,
            thread_title:
              existing.thread_title ?? threadTitle ?? existing.title,
            title: existing.title ?? threadTitle ?? existing.thread_title,
            updated_at: now,
          };

          return next.sort((left, right) => {
            const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
            const rightTime = right.updated_at
              ? Date.parse(right.updated_at)
              : 0;
            return rightTime - leftTime;
          });
        }

        if (!shouldCreate) {
          return prev;
        }

        const nextThread: ChatThreadSummary = {
          thread_hash: threadHash,
          thread_id: threadHash,
          thread_type: 'live_camera',
          inference_modality: 'live',
          entity_hash: camHash ?? null,
          thread_title: threadTitle ?? 'Live camera chat',
          title: threadTitle ?? 'Live camera chat',
          created_at: now,
          updated_at: now,
        };

        return [nextThread, ...prev];
      });
    },
    [camHash]
  );

  const handleBackToHome = useCallback(() => {
    updateThreadId(null);
    setMessages([]);
    setThreadMessagesLoading(false);
    updateUserQuery('');
    assistantIndexRef.current = null;
  }, [updateThreadId, updateUserQuery]);

  const activeThreadSubtitle = activeThread?.updated_at
    ? formatTimeInTimezone(
        new Date(activeThread.updated_at),
        getUserTimezone(),
        'datetime'
      )
    : '';
  const isConversationActive =
    Boolean(threadId) || messages.length > 0 || isLoading || isStreaming;

  const visibleThreads = useMemo<ChatItemData[]>(() => {
    return threadHistory.slice(0, visibleHistoryCount).map((thread) => {
      const key = thread.thread_hash ?? thread.thread_id;
      const preview = threadPreviews[key] || '';
      return {
        id: key,
        title: thread.thread_title || thread.title || 'Untitled conversation',
        preview,
        updatedAt: thread.updated_at,
      };
    });
  }, [threadHistory, visibleHistoryCount, threadPreviews]);

  const hasMoreThreads = visibleHistoryCount < threadHistory.length;
  const durationOptions = [
    { label: 'Last 1 hour', value: '60' },
    { label: 'Last 3 hours', value: '180' },
    { label: 'Last 6 hours', value: '360' },
    { label: 'Last 12 hours', value: '720' },
    { label: 'Last 24 hours', value: '1440' },
  ];

  // Load available models from GraphQL
  useEffect(() => {
    if (modelsData?.getOrgModels) {
      const allModels = modelsData.getOrgModels as Array<{
        modelHash: string;
        modelName: string;
        modelType: string;
      }>;
      const chatModels = allModels.filter((m) => m.modelType === 'chat');

      const mappedModels = chatModels.map((m) => ({
        modelHash: m.modelHash,
        modelName: m.modelName,
        modelType: m.modelType,
      }));

      setModels(mappedModels);
      if (mappedModels.length > 0 && !selectedModel) {
        const preferredModelHash = selectDefaultChatModelHash(
          mappedModels,
          defaultModelHash
        );
        setSelectedModel(preferredModelHash);
      }
    }
  }, [modelsData, selectedModel, defaultModelHash]);

  // Fetch chat history for live camera
  const fetchHistory = useCallback(async () => {
    try {
      const { token } = getUserSession();
      if (!token || !threadId) {
        setThreadMessagesLoading(false);
        return;
      }

      setThreadMessagesLoading(true);

      const data = await fetchChatHistoryByThreadId({
        chatApiUrl,
        token,
        threadId,
      });

      if (data.messages && Array.isArray(data.messages)) {
        // Map messages from history API
        const historyMessages: ChatMessage[] = data.messages.map(
          (m: {
            content: string | unknown[];
            role: string;
            message_id?: string | number;
            created_at?: string;
          }) => {
            let contentText =
              typeof m.content === 'string'
                ? m.content
                : Array.isArray(m.content)
                  ? JSON.stringify(m.content)
                  : String(m.content ?? '');
            const role = m.role === 'assistant' ? 'assistant' : 'user';

            if (typeof m.content === 'string') {
              const trimmed = m.content.trim();

              // Try standard JSON parse if it looks like a list
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed)) {
                    const textParts = parsed
                      .filter(
                        (p: { type?: string; text?: string }) =>
                          p.type === 'text'
                      )
                      .map((p: { type?: string; text?: string }) => p.text)
                      .join('');
                    if (textParts) contentText = textParts;
                  }
                } catch {
                  // Not valid JSON, fall through
                }
              }

              // Cleanup of literal newlines
              if (typeof contentText === 'string') {
                contentText = contentText.replace(/\\n/g, '\n');

                // Unescape HTML entities for tool tags if present
                if (
                  role === 'assistant' &&
                  (contentText.includes('&lt;tool-thinking') ||
                    contentText.includes('&lt;tool-result'))
                ) {
                  contentText = contentText
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"');
                }
              }
            }

            return {
              id:
                typeof m.message_id === 'number'
                  ? m.message_id
                  : Number(m.message_id) || Date.now(),
              role: role,
              content: [{ text: contentText }],
              timestamp: m.created_at,
            };
          }
        );

        // Merge consecutive assistant messages
        const mergedMessages: ChatMessage[] = [];
        historyMessages.forEach((msg: ChatMessage) => {
          const lastMsg = mergedMessages[mergedMessages.length - 1];

          if (
            lastMsg &&
            lastMsg.role === 'assistant' &&
            msg.role === 'assistant'
          ) {
            lastMsg.content[0].text += '\n' + msg.content[0].text;
          } else {
            mergedMessages.push(msg);
          }
        });

        setMessages(mergedMessages);

        const lastMessage = mergedMessages[mergedMessages.length - 1];
        if (lastMessage?.content?.[0]?.text && threadId) {
          const preview = lastMessage.content[0].text.trim().slice(0, 120);
          setThreadPreviews((prev) => ({ ...prev, [threadId]: preview }));
        }
      }
    } catch (err) {
      logger.error('Error fetching chat history:', err);
    } finally {
      setThreadMessagesLoading(false);
    }
  }, [chatApiUrl, threadId]);

  useEffect(() => {
    if (!threadId) {
      setThreadMessagesLoading(false);
      return;
    }
    if (isLoading || isStreaming) return;
    if (messages.length > 0) {
      setThreadMessagesLoading(false);
      return;
    }

    fetchHistory();
  }, [fetchHistory, threadId, isLoading, isStreaming, messages.length]);

  const loadThreadHistory = useCallback(async () => {
    if (!chatApiUrl || !camHash) {
      setThreadHistory([]);
      return;
    }

    const { token } = getUserSession();
    if (!token) return;

    setHistoryLoading(true);
    try {
      const threads = await listChatThreads({
        chatApiUrl,
        token,
        threadType: 'live_camera',
        entityHash: camHash,
      });
      const sortedThreads = [...threads].sort((left, right) => {
        const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
        const rightTime = right.updated_at ? Date.parse(right.updated_at) : 0;
        return rightTime - leftTime;
      });
      setThreadHistory(sortedThreads);
      setVisibleHistoryCount(3);
    } catch (error) {
      logger.error('Error loading live chat history list:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [camHash, chatApiUrl]);

  useEffect(() => {
    void loadThreadHistory();
  }, [loadThreadHistory]);

  const handleSelectThread = useCallback(
    (selectedThreadId: string) => {
      setThreadMessagesLoading(true);
      updateThreadId(selectedThreadId);
      setMessages([]);
      updateUserQuery('');
    },
    [updateThreadId, updateUserQuery]
  );

  // Add scroll event listener to detect manual scrolling
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    // Use wheel event to detect user intent to scroll up
    const handleWheel = (e: WheelEvent) => {
      // deltaY < 0 means scrolling up
      if (e.deltaY < 0) {
        setIsUserScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      }
    };

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

      // If user scrolled back to bottom, re-enable auto-scroll
      if (isAtBottom) {
        setIsUserScrolling(false);
      }

      lastScrollTopRef.current = scrollTop;
    };

    const timeoutId = scrollTimeoutRef.current;
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive (respects user scrolling)
  useEffect(() => {
    if (!isUserScrolling && endOfMessagesRef.current) {
      const timer = setTimeout(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages, isStreaming, isUserScrolling]);

  const handleDeleteThread = useCallback(
    async (threadToDelete: string) => {
      if (!threadToDelete) return;
      setDeletingConversationIds((prev) => {
        const next = new Set(prev);
        next.add(threadToDelete);
        return next;
      });

      try {
        const { token } = getUserSession();
        if (!token) return;

        await deleteChatThreadById({
          chatApiUrl,
          token,
          threadId: threadToDelete,
        });

        setThreadHistory((prev) =>
          prev.filter(
            (thread) =>
              (thread.thread_hash ?? thread.thread_id) !== threadToDelete
          )
        );
        setThreadPreviews((prev) => {
          const next = { ...prev };
          delete next[threadToDelete];
          return next;
        });

        if (threadId === threadToDelete) {
          setMessages([]);
          updateUserQuery('');
          updateThreadId(null);
        }

        toast.success('Conversation deleted');
      } catch (e) {
        logger.error('Error deleting thread:', e);
        toast.error('Failed to delete conversation');
      } finally {
        setDeletingConversationIds((prev) => {
          const next = new Set(prev);
          next.delete(threadToDelete);
          return next;
        });
      }
    },
    [chatApiUrl, threadId, updateThreadId, updateUserQuery]
  );

  // Send message handler
  const sendMessage = useCallback(async () => {
    if (!userQuery.trim() || isLoading) return;

    if (!selectedModel) {
      toast.error('Please select a model to start chatting');
      return;
    }

    const { token } = getUserSession();
    if (!token) {
      logger.error('No token found');
      return;
    }

    const nowISO = new Date().toISOString();

    const userConv: ChatMessage = {
      role: 'user',
      content: [{ text: userQuery }],
      timestamp: nowISO,
      id: Date.now(),
    };

    const assistantPlaceholder: ChatMessage = {
      role: 'assistant',
      content: [{ text: '' }],
      timestamp: nowISO,
      id: Date.now() + 1,
    };

    setMessages((prev) => {
      const next = [...prev, userConv, assistantPlaceholder];
      assistantIndexRef.current = next.length - 1;
      return next;
    });

    updateUserQuery('');
    setIsLoading(true);
    setIsStreaming(true);

    const hadActiveThread = Boolean(threadId);
    const nextThreadTitle = 'Live camera chat';
    let activeThreadId = threadId;

    try {
      if (!activeThreadId) {
        activeThreadId = await createChatThread({
          chatApiUrl,
          token,
          threadType: 'live_camera',
          inferenceModality: 'live',
          entityHash: camHash,
          threadTitle: nextThreadTitle,
        });
        updateThreadId(activeThreadId);
        touchThreadHistory(activeThreadId, true, nextThreadTitle);
      }

      const selectedModelObj = models.find(
        (m) => m.modelHash === selectedModel
      );

      const threadPreviewKey = activeThreadId;
      if (threadPreviewKey) {
        setThreadPreviews((prev) => ({
          ...prev,
          [threadPreviewKey]: userQuery.trim().slice(0, 120),
        }));
      }

      const payload = buildHybridChatPayload({
        threadHash: activeThreadId,
        modelHash: selectedModel,
        message: userQuery,
        modelName: selectedModelObj?.modelName,
        modelType: 'chat',
        liveWindowMinutes: parseInt(selectedDuration), // ✅ Use selectedDuration
      });

      let fullAssistantText = '';
      const updateAssistantContent = (nextText: string) => {
        setMessages((prev) => {
          const idx = assistantIndexRef.current;
          if (idx === null) return prev;

          const updated = [...prev];
          if (updated[idx]) {
            updated[idx] = {
              ...updated[idx],
              content: [{ text: nextText }],
            };
          }
          return updated;
        });
      };

      await runBackendChatStream(
        {
          chatApiUrl,
          token,
          payload,
        },
        {
          onTextDelta: ({ delta }) => {
            fullAssistantText += delta;
            updateAssistantContent(fullAssistantText);
          },
          onToolCallStart: ({ toolCallId, toolCallName, description }) => {
            const toolName = toolCallName || 'tool';
            const normalizedToolId = toolCallId || `${toolName}-${Date.now()}`;
            const thinkingText = description || `Using ${toolName}...`;
            const toolTag = `<tool-thinking tool_call_id="${escapeToolAttr(normalizedToolId)}" tool="${escapeToolAttr(toolName)}">${escapeToolText(thinkingText)}</tool-thinking>`;

            fullAssistantText = `${fullAssistantText}${
              fullAssistantText ? '\n\n' : ''
            }${toolTag}`;
            updateAssistantContent(fullAssistantText);
          },
          onToolCallEnd: ({ toolCallId, toolCallName }) => {
            const toolName = toolCallName || 'tool';
            const normalizedToolId = toolCallId || `${toolName}-${Date.now()}`;
            const toolTag = `<tool-result tool_call_id="${escapeToolAttr(normalizedToolId)}" tool="${escapeToolAttr(toolName)}" status="complete"></tool-result>`;

            fullAssistantText = `${fullAssistantText}${
              fullAssistantText ? '\n\n' : ''
            }${toolTag}`;
            updateAssistantContent(fullAssistantText);
          },
        }
      );

      // Finalize assistant message
      setMessages((prev) => {
        const idx = assistantIndexRef.current;
        if (idx === null) return prev;

        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          content: [{ text: fullAssistantText }],
        };
        assistantIndexRef.current = null;
        return updated;
      });
    } catch (err) {
      logger.error('Error sending message:', err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An error occurred while processing your message';

      setMessages((prev) => {
        const idx = assistantIndexRef.current;

        // If we have a valid assistant index, update the existing message
        if (idx !== null && idx >= 0 && idx < prev.length) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            content: [{ text: `Error: ${errorMessage}` }],
          };
          assistantIndexRef.current = null;
          return updated;
        }

        // Fallback: Create a new error message if assistant index is invalid
        const errorMsg: ChatMessage = {
          role: 'assistant',
          content: [{ text: `Error: ${errorMessage}` }],
          timestamp: new Date().toISOString(),
          id: Date.now(),
        };
        assistantIndexRef.current = null;
        return [...prev, errorMsg];
      });
    } finally {
      if (activeThreadId) {
        touchThreadHistory(activeThreadId, !hadActiveThread, nextThreadTitle);
      }
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [
    userQuery,
    isLoading,
    selectedModel,
    models,
    camHash,
    chatApiUrl,
    selectedDuration,
    threadId,
    touchThreadHistory,
    updateThreadId,
    updateUserQuery,
  ]);

  const handleSend = useCallback(() => {
    sendMessage();
  }, [sendMessage]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateUserQuery(event.target.value);
    },
    [updateUserQuery]
  );

  const handleDurationChange = useCallback((value: string) => {
    setSelectedDuration(value);
    setIsCustomDuration(false);
    setCustomDuration('');
  }, []);

  const handleCustomDurationChange = useCallback((value: string) => {
    setCustomDuration(value);
  }, []);

  const handleApplyCustomDuration = useCallback(() => {
    const hours = parseFloat(customDuration);
    if (hours > 0) {
      const minutes = Math.round(hours * 60);
      setSelectedDuration(minutes.toString());
      setIsCustomDuration(true);
      return;
    }

    toast.error('Please enter a valid duration');
  }, [customDuration]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="px-1 pb-2 text-base font-semibold text-foreground">
        Chat
      </div>
      <div className="flex min-h-0 flex-1">
        <ChatContainer
          isConversationActive={isConversationActive}
          home={
            <ChatHome
              title="Sessions"
              items={visibleThreads}
              selectedId={threadId}
              deletingConversationIds={deletingConversationIds}
              loading={historyLoading}
              hasMore={hasMoreThreads}
              onSelect={handleSelectThread}
              onDeleteConversation={handleDeleteThread}
              onLoadMore={() => setVisibleHistoryCount((prev) => prev + 3)}
              input={
                <ChatInput
                  userQuery={userQuery}
                  onInputChange={handleInputChange}
                  onSend={handleSend}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  onOpenConfig={onOpenConfiguration}
                  canConfigure={true}
                  hasConversation={
                    messages.length > 0 || Boolean(userQuery.trim())
                  }
                  models={models}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  modelsLoading={modelsLoading}
                  durationOptions={durationOptions}
                  selectedDuration={selectedDuration}
                  isCustomDuration={isCustomDuration}
                  customDuration={customDuration}
                  onDurationChange={handleDurationChange}
                  onCustomDurationChange={handleCustomDurationChange}
                  onApplyCustomDuration={handleApplyCustomDuration}
                  durationControlPlacement="right"
                  showTranscriptAction={false}
                />
              }
            />
          }
          conversation={
            <div className="flex min-h-0 flex-1 flex-col bg-background">
              <ChatHeader
                title="Chat"
                subtitle={activeThreadSubtitle}
                onBack={handleBackToHome}
              />

              <div
                ref={chatContainerRef}
                className="spectra-scrollbar-wide flex-1 space-y-5 overflow-y-auto p-3 sm:p-4"
              >
                {messages.map((msg, idx) => {
                  const showSpinner =
                    msg.role === 'assistant' &&
                    (msg.content[0]?.text ?? '') === '';
                  return (
                    <MemoizedMessageItem
                      key={msg.id}
                      message={msg}
                      isLastMessage={idx === messages.length - 1}
                      showSpinner={showSpinner}
                      isStreaming={isStreaming}
                    />
                  );
                })}

                {messages.length === 0 && (
                  <div className="flex min-h-full items-center justify-center">
                    {threadMessagesLoading ? (
                      <div className="w-full max-w-2xl space-y-4 px-4">
                        <div className="h-16 animate-pulse rounded-2xl bg-muted/40" />
                        <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
                        <div className="h-16 animate-pulse rounded-2xl bg-muted/40" />
                      </div>
                    ) : (
                      <div className="max-w-md text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <svg
                            className="h-8 w-8"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                            />
                          </svg>
                        </div>
                        <h3 className="mt-4 mb-2 text-lg font-semibold">
                          Start a conversation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ask questions about the live camera.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div ref={endOfMessagesRef} />
              </div>

              <div className="border-t border-border/60 bg-background/95 p-3 sm:p-4">
                <ChatInput
                  userQuery={userQuery}
                  onInputChange={handleInputChange}
                  onSend={handleSend}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  onOpenConfig={onOpenConfiguration}
                  canConfigure={true}
                  hasConversation={
                    messages.length > 0 || Boolean(userQuery.trim())
                  }
                  models={models}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  modelsLoading={modelsLoading}
                  durationOptions={durationOptions}
                  selectedDuration={selectedDuration}
                  isCustomDuration={isCustomDuration}
                  customDuration={customDuration}
                  onDurationChange={handleDurationChange}
                  onCustomDurationChange={handleCustomDurationChange}
                  onApplyCustomDuration={handleApplyCustomDuration}
                  durationControlPlacement="right"
                  showTranscriptAction={false}
                />
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ChatInterface;