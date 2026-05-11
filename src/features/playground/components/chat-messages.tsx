import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  // useMemo,
} from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { JSX, HTMLAttributes } from 'react';
import {
  Bot,
  User,
  Loader2,
  Search,
  Video,
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react';
import { ChartRenderer } from '@/components/chat/ChartRenderer';
import type { VizPayload } from '@/types/viz';
import {
  convertElementDescriptionToMarkdownTable,
  extractTextFromSseDataLines,
} from '@/utils/chat-table-format';
import { AssistantThoughtProcess } from '@/features/chat/components/assistant-thought-process';

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
  span?: (props: HTMLAttributes<HTMLSpanElement>) => JSX.Element;
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

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: { text: string }[];
  timestamp?: string;
  viz?: VizPayload;
}

interface ChatMessagesProps {
  conversation: Message[];
  isLoading: boolean;
  isStreaming?: boolean;
}

export interface ChatMessagesRef {
  scrollToBottom: () => void;
  isUserNearBottom: () => boolean;
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

// Function to highlight tags in bold blue
const highlightTags = (text: string): string => {
  // Standard HTML tags to skip
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

  // Pattern to match HTML tags like <tag>content</tag> or <tag />
  const processed = text.replace(
    /<(\w+)(?:\s[^>]*)?>(.*?)<\/\1>/gi,
    (match, tagName, content) => {
      const lowerTagName = tagName.toLowerCase();

      // Skip standard HTML tags
      if (standardTags.includes(lowerTagName)) {
        return match;
      }

      // Highlight custom tags in bold blue
      return `<strong style="color: #3b82f6; font-weight: 700;">&lt;${tagName}&gt;${content}&lt;/${tagName}&gt;</strong>`;
    }
  );

  // Also highlight standalone tag mentions like <tag> or <tag/> (self-closing)
  const finalProcessed = processed.replace(
    /<(\w+)(?:\s[^>]*)?\/?>(?![^<]*<\/\1>)/gi,
    (match, tagName) => {
      const lowerTagName = tagName.toLowerCase();

      // Skip standard HTML tags
      if (standardTags.includes(lowerTagName)) {
        return match;
      }

      // Highlight custom tags in bold blue
      return `<strong style="color: #3b82f6; font-weight: 700;">${match}</strong>`;
    }
  );

  return finalProcessed;
};

// Normalize "flattened" markdown tables where rows got concatenated,
// e.g. "| h1 | h2 | |---|---| | r1 | r2 |" -> each "| |" becomes a newline.
const normalizeTableMarkdown = (text: string): string => {
  if (!text.includes('|') || !text.includes('---')) return text;
  return text.replace(/\|\s*\|(?=\s*\S)/g, '|\n|');
};

// Convert common "Category  Details" plain-text sections into real markdown tables.
// This handles model outputs where rows are emitted as:
// Category[spaces]Details
// Vehicles
// 7 cars ...
const normalizeCategoryDetailsBlocks = (text: string): string => {
  if (!/category\s+details/i.test(text)) return text;

  const lines = text.split('\n');
  const out: string[] = [];
  let i = 0;

  const isLikelySectionBoundary = (line: string) => {
    const t = line.trim();
    return (
      t === '' ||
      /^[-*]\s+/.test(t) ||
      /^[\u2705\u26A0\u{1F4CA}\u{1F4C8}\u{1F4CB}]/u.test(t) ||
      /^[A-Z][A-Za-z\s&]{1,40}:$/.test(t)
    );
  };

  const isLikelyCategory = (line: string) => {
    const t = line.trim();
    if (!t) return false;
    if (t.length > 28) return false;
    if (/[:.;,!?]/.test(t)) return false;
    // 1-4 words, title-ish or short labels.
    return (
      /^[A-Za-z][A-Za-z\s&/-]{0,27}$/.test(t) && t.split(/\s+/).length <= 4
    );
  };

  while (i < lines.length) {
    const current = lines[i];
    if (!/^\s*category\s+details\s*$/i.test(current.trim())) {
      out.push(current);
      i += 1;
      continue;
    }

    const rows: Array<[string, string]> = [];
    i += 1; // move after header

    while (i < lines.length) {
      const line = lines[i];
      const t = line.trim();

      if (isLikelySectionBoundary(line)) break;
      if (/^\s*category\s+details\s*$/i.test(t)) break;

      // Row already present in one line separated by multiple spaces/tabs.
      const splitCols = t
        .split(/\t+|\s{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (splitCols.length >= 2) {
        const [cat, ...rest] = splitCols;
        rows.push([cat, rest.join(' ')]);
        i += 1;
        continue;
      }

      // Category on one line, details on next line.
      if (isLikelyCategory(t)) {
        let detail = '—';
        if (i + 1 < lines.length) {
          const next = lines[i + 1]?.trim() ?? '';
          if (
            next &&
            !isLikelySectionBoundary(next) &&
            !isLikelyCategory(next)
          ) {
            detail = next;
            i += 1;
          }
        }
        rows.push([t, detail]);
        i += 1;
        continue;
      }

      // Fallback: append miscellaneous text to previous row detail.
      if (rows.length > 0) {
        rows[rows.length - 1][1] = `${rows[rows.length - 1][1]} ${t}`.trim();
      }
      i += 1;
    }

    if (rows.length > 0) {
      out.push('| Category | Details |');
      out.push('| --- | --- |');
      rows.forEach(([cat, detail]) => {
        const safeCat = cat.replace(/\|/g, '\\|');
        const safeDetail = detail.replace(/\|/g, '\\|');
        out.push(`| ${safeCat} | ${safeDetail} |`);
      });
    } else {
      out.push(current);
    }
  }

  return out.join('\n');
};

const ToolThinking = ({
  icon,
  tool,
  name,
  children,
}: {
  icon?: string;
  tool?: string;
  name?: string;
  children?: React.ReactNode;
}) => {
  const Icon =
    icon === 'video'
      ? Video
      : icon === 'search'
        ? Search
        : icon === 'tool'
          ? Wrench
          : Loader2;

  return (
    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 px-3 py-2 rounded-md my-2 text-xs border border-border/50">
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
}: {
  icon?: string;
  tool?: string;
  name?: string;
  status?: string;
  count?: string | number;
  children?: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon =
    icon === 'video'
      ? Video
      : icon === 'search'
        ? Search
        : icon === 'tool'
          ? Wrench
          : CheckCircle2;

  // If children is empty or just "[]", don't show expand option
  const contentStr = String(children || '').trim();
  const hasContent = contentStr && contentStr !== '[]' && contentStr !== 'null';

  return (
    <div className="my-2 text-xs">
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 bg-muted/10 ${
          hasContent ? 'cursor-pointer hover:bg-muted/20' : ''
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
        <div className="mt-1 p-2 bg-muted/20 rounded-md overflow-x-auto">
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
    <h1 className="text-xl font-bold mt-4 mb-2 text-foreground">{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold mt-3 mb-2 text-foreground" {...props}>
      {children}
    </h2>
  ),
  p: ({ children, ...props }) => (
    <p className="text-sm leading-relaxed mb-2 text-foreground" {...props}>
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
    // Preserve inline styles for colored spans
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
    <strong className="font-bold text-foreground" {...props}>
      {children}
    </strong>
  ),
  table: ({ children, ...props }) => (
    <div className="my-4 w-full max-w-full overflow-x-auto spectra-scrollbar">
      <div className="min-w-[680px] w-full align-middle rounded-xl border border-border/70 border-l-4 border-l-primary/60 bg-muted/60 shadow-sm">
        <table
          className="w-full table-fixed border-collapse text-xs text-left"
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
      className="px-3 py-1.5 font-semibold border border-border/40 whitespace-normal break-words align-top"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-3 py-1.5 border border-border/40 align-top whitespace-normal break-words"
      style={{ overflowWrap: 'anywhere' }}
      {...props}
    >
      {children}
    </td>
  ),
  'tool-thinking': ToolThinking,
  'tool-result': ToolResult,
};

// Markdown components for user bubbles — inherits white text from the bubble
// instead of overriding with text-foreground (which would render as dark text)
const userMarkdownComponents: MarkdownComponents = {
  ...markdownComponents,
  h1: ({ children }) => (
    <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-lg font-semibold mt-3 mb-2" {...props}>
      {children}
    </h2>
  ),
  p: ({ children, ...props }) => (
    <p
      className="text-sm leading-relaxed mb-2 last:mb-0 break-words whitespace-pre-wrap"
      style={{ overflowWrap: 'anywhere' }}
      {...props}
    >
      {children}
    </p>
  ),
  strong: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
    <strong className="font-bold" {...props}>
      {children}
    </strong>
  ),
  highlight: ({ children }) => (
    <span className="font-bold opacity-90">{children}</span>
  ),
};

const ThoughtProcess = ({
  content,
  isStreaming,
  isLastMessage,
  isThoughtFinished,
  hasTextContent,
}: {
  content: string;
  isStreaming?: boolean;
  isLastMessage: boolean;
  isThoughtFinished?: boolean;
  hasTextContent?: boolean;
}) => {
  return (
    <AssistantThoughtProcess
      content={content}
      isStreaming={isStreaming}
      isLastMessage={isLastMessage}
      isThoughtFinished={isThoughtFinished}
      hasTextContent={hasTextContent}
    />
  );
};

const Message: React.FC<{
  message: Message;
  isLastMessage: boolean;
  isStreaming?: boolean;
}> = ({ message, isLastMessage, isStreaming }) => {
  const [copied, setCopied] = useState(false);
  const [chartExpanded, setChartExpanded] = useState(true);
  const fullText = message.content.map((c) => String(c.text ?? '')).join('\n');

  // Process text to highlight tags before rendering
  const processMessageText = (text: string): string => {
    const decoded = extractTextFromSseDataLines(text);
    const tabular = convertElementDescriptionToMarkdownTable(decoded);
    const processed = highlightTags(tabular);
    const normalized = normalizeTableMarkdown(processed);
    return normalizeCategoryDetailsBlocks(normalized);
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

  const handleCopy = async () => {
    if (!fullText.trim() || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore copy errors
    }
  };

  return (
    <div
      className={`flex flex-col gap-1 w-full min-w-0 ${
        isAssistant ? 'items-start' : 'items-end'
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
          isAssistant
            ? 'bg-primary text-primary-foreground'
            : 'bg-blue-500 text-white dark:bg-blue-500'
        }`}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4" />
        ) : (
          <User className="w-4 h-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={`flex flex-col ${
          isAssistant
            ? message.viz
              ? 'items-start w-full'
              : 'items-start max-w-[80%]'
            : 'items-end max-w-[75%]'
        }`}
      >
        {/* Message Bubble */}
        {message.content.map((t, idx) => {
          const text = String(t.text);
          if (message.role === 'assistant') {
            const { toolsPart, textPart, hasOpenTag } = splitContent(text);
            const canCopyAssistantMessage =
              !isStreaming && !hasOpenTag && Boolean(textPart.trim());
            return (
              <React.Fragment key={idx}>
                {toolsPart && (
                  <ThoughtProcess
                    content={toolsPart}
                    isStreaming={isStreaming}
                    isLastMessage={isLastMessage}
                    isThoughtFinished={!hasOpenTag}
                    hasTextContent={!!textPart}
                  />
                )}
                {textPart && (
                  <div className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm bg-card text-foreground border border-border/60">
                    <div className="text-xs font-semibold mb-1.5 text-primary">
                      Spectra
                    </div>
                    <div className="text-sm leading-relaxed text-foreground break-words">
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
                {canCopyAssistantMessage && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 hover:bg-muted"
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
                  </div>
                )}
              </React.Fragment>
            );
          }
          return (
            <div
              key={idx}
              className="max-w-full min-w-0 rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-primary-foreground shadow-sm overflow-hidden"
            >
              <div className="mb-1.5 text-xs font-medium text-primary-foreground/80">
                You
              </div>
              <div
                className="text-sm leading-relaxed text-primary-foreground break-words whitespace-pre-wrap"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                <ReactMarkdown
                  components={userMarkdownComponents}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[
                    rehypeRaw,
                    [rehypeSanitize, customSanitizeSchema],
                  ]}
                >
                  {processMessageText(text)}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        {/* Chart card */}
        {isAssistant && message.viz && (
          <div className="mt-3 w-full rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 cursor-pointer select-none hover:bg-muted/30 transition-colors"
              onClick={() => setChartExpanded((v) => !v)}
            >
              <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">
                Detection Chart
              </span>
              {chartExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            {chartExpanded && (
              <div className="p-4">
                <ChartRenderer viz={message.viz} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MemoizedMessage = React.memo(Message);

const ChatMessages = forwardRef<ChatMessagesRef, ChatMessagesProps>(
  ({ conversation, isLoading, isStreaming }, ref) => {
    const scrollAreaWrapperRef = useRef<HTMLDivElement>(null);
    const scrollViewportRef = useRef<HTMLDivElement | null>(null);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const [isUserScrolling, setIsUserScrolling] = useState(false);
    const autoScrollEnabledRef = useRef(true);

    // Helper to get the viewport element
    const getViewport = (): HTMLDivElement | null => {
      if (scrollViewportRef.current) {
        return scrollViewportRef.current;
      }
      if (scrollAreaWrapperRef.current) {
        const viewport = scrollAreaWrapperRef.current.querySelector(
          '[data-slot="scroll-area-viewport"]'
        ) as HTMLDivElement;
        if (viewport) {
          scrollViewportRef.current = viewport;
          return viewport;
        }
      }
      return null;
    };

    // Find the ScrollArea viewport element after render
    useEffect(() => {
      getViewport();
    }, [conversation]);

    // Add scroll event listener to detect manual scrolling
    useEffect(() => {
      const viewport = getViewport();
      if (!viewport) return;

      const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = viewport;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;

        // Auto-scroll stays enabled only while user is near bottom.
        autoScrollEnabledRef.current = isAtBottom;
        setIsUserScrolling(!isAtBottom);
      };

      viewport.addEventListener('scroll', handleScroll);
      // Initialize state once on mount.
      handleScroll();
      return () => {
        viewport.removeEventListener('scroll', handleScroll);
      };
    }, []);

    const scrollToBottom = useCallback(() => {
      const viewport = getViewport();
      if (viewport) {
        viewport.scrollTo({
          top: viewport.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, []);

    const isUserNearBottom = () => {
      const viewport = getViewport();
      if (!viewport) return false;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      return scrollHeight - scrollTop - clientHeight < 100;
    };

    useImperativeHandle(ref, () => ({
      scrollToBottom,
      isUserNearBottom,
    }));

    // Auto-scroll to bottom when new messages arrive.
    // Only auto-scroll if the user is already near the bottom.
    useEffect(() => {
      if (conversation.length === 0) return;
      if (!autoScrollEnabledRef.current) return;

      // Small delay to ensure DOM has updated
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      return () => clearTimeout(timer);
    }, [conversation, isUserScrolling, isStreaming, scrollToBottom]);

    return (
      <div ref={scrollAreaWrapperRef} className="h-full min-w-0 flex-1">
        <ScrollArea className="h-full">
          <div
            className="h-full space-y-6 px-3 py-4 sm:px-4 xl:px-6"
            style={{ minHeight: '100%' }}
          >
            {conversation.length > 0 ? (
              conversation.map((c, i) => (
                <MemoizedMessage
                  key={c.id || i}
                  message={c}
                  isLastMessage={i === conversation.length - 1}
                  isStreaming={isStreaming}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center">
                  {/* Add your bot icon/component here */}
                </div>
                <h2>Welcome to Spectra</h2>
                <p>
                  Ask anything about the video or start a conversation. I’m here
                  to assist you!
                </p>
              </div>
            )}
            {isLoading && !isStreaming && (
              <div className="flex items-start space-x-3 justify-start">
                <div>
                  <span className="block mt-1 text-sm">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: '0s' }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      ></div>
                    </div>
                  </span>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>
      </div>
    );
  }
);

ChatMessages.displayName = 'ChatMessages';

export default ChatMessages;
