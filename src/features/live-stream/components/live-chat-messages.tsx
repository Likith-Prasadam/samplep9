import React, { useEffect, useState } from 'react';
import { formatTimeInTimezone } from '@/utils/timeUtils';
import { useAppSelector } from '@/store/index';
import { selectSelectedTimezoneIana } from '@/store/slices/timezone-slice';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { HTMLAttributes, JSX } from 'react';
import {
  convertElementDescriptionToMarkdownTable,
  extractTextFromSseDataLines,
} from '@/utils/chat-table-format';

interface MarkdownComponents {
  div?: (props: HTMLAttributes<HTMLDivElement>) => JSX.Element;
  h1?: (props: HTMLAttributes<HTMLHeadingElement>) => JSX.Element;
  h2?: (props: HTMLAttributes<HTMLHeadingElement>) => JSX.Element;
  p?: (props: HTMLAttributes<HTMLParagraphElement>) => JSX.Element;
  ul?: (props: HTMLAttributes<HTMLUListElement>) => JSX.Element;
  ol?: (props: HTMLAttributes<HTMLOListElement>) => JSX.Element;
  li?: (props: HTMLAttributes<HTMLLIElement>) => JSX.Element;
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
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  message_id: string;
  tool_call_id?: string | null;
  tool_name?: string | null;
}

interface ChatHistoryResponse {
  thread_id: string;
  thread_type: string;
  inference_modality: string;
  selected_source?: string | null;
  title?: string | null;
  messages: ChatMessage[];
  message_count: number;
}

interface LiveChatMessagesProps {
  camHash: string;
  threadId?: string;
  token?: string;
}

const customSanitizeSchema = {
  ...defaultSchema,
  // Ensure table-related tags and custom tags are allowed
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
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'style', 'class'],
  },
};

const markdownComponents: MarkdownComponents = {
  div: ({ children, ...props }) => (
    <div className="prose prose-xs dark:prose-invert max-w-none" {...props}>
      {children}
    </div>
  ),
  h1: ({ children }) => (
    <h1 className="text-base font-bold mt-3 mb-1.5 text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="text-sm font-semibold mt-2 mb-1 text-foreground" {...props}>
      {children}
    </h2>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-1 leading-relaxed text-foreground" {...props}>
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-1 space-y-0.5 text-foreground">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-1 space-y-0.5 text-foreground">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed text-foreground" {...props}>
      {children}
    </li>
  ),
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
      <div className="inline-block min-w-full align-middle rounded-xl border border-border/70 border-l-4 border-l-primary/60 bg-muted/60 shadow-sm">
        <table
          className="w-max min-w-full border-collapse text-[11px] text-left"
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
      className="px-2 py-1 font-semibold border border-border/40 whitespace-normal break-words"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td
      className="px-2 py-1 border border-border/40 align-top whitespace-normal break-words"
      {...props}
    >
      {children}
    </td>
  ),
};

const LiveChatMessages: React.FC<LiveChatMessagesProps> = ({
  camHash,
  threadId,
  token,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedTimezone = useAppSelector(selectSelectedTimezoneIana);

  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!threadId && !camHash) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const apiUrl = import.meta.env.VITE_CHAT_HISTORY_API_URL;
        if (!apiUrl) {
          throw new Error('Chat history API URL not configured');
        }

        const url = threadId
          ? `${apiUrl}?thread_hash=${threadId}&thread_id=${threadId}`
          : `${apiUrl}?live_cam_hash=${camHash}`;
        const headers: HeadersInit = {
          Accept: 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch chat history: ${response.statusText}`
          );
        }

        const data: ChatHistoryResponse = await response.json();
        setMessages(data.messages || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load chat history';
        setError(errorMessage);
        console.error('Error fetching chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [camHash, threadId, token]);

  const parseContent = (content: string | unknown): string => {
    if (typeof content === 'string') {
      // Try to parse JSON-style message arrays, but otherwise
      // preserve the original markdown (including tables).
      try {
        const trimmed = content.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          const parsed = JSON.parse(trimmed.replace(/'/g, '"'));
          if (Array.isArray(parsed)) {
            return parsed
              .map((item: unknown) => {
                if (
                  typeof item === 'object' &&
                  item !== null &&
                  'text' in item
                ) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return (item as any).text;
                } else if (
                  typeof item === 'object' &&
                  item !== null &&
                  'name' in item
                ) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  return `[Tool: ${(item as any).name}]`;
                }
                return '';
              })
              .filter(Boolean)
              .join('\n');
          }
        }
      } catch {
        // If parsing fails, fall through and return original content
      }
      const decoded = extractTextFromSseDataLines(content);
      return convertElementDescriptionToMarkdownTable(decoded);
    }
    const decoded = extractTextFromSseDataLines(String(content));
    return convertElementDescriptionToMarkdownTable(decoded);
  };

  const formatTimestamp = (): string => {
    // Format current time for display using selected timezone
    const now = new Date();
    return formatTimeInTimezone(now, selectedTimezone, 'time');
  };

  const getRoleColor = (
    role: string
  ): { bg: string; text: string; border: string } => {
    switch (role) {
      case 'user':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950',
          text: 'text-blue-900 dark:text-blue-100',
          border: 'border-blue-200 dark:border-blue-800',
        };
      case 'assistant':
        return {
          bg: 'bg-green-50 dark:bg-green-950',
          text: 'text-green-900 dark:text-green-100',
          border: 'border-green-200 dark:border-green-800',
        };
      case 'tool':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950',
          text: 'text-amber-900 dark:text-amber-100',
          border: 'border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          bg: 'bg-muted',
          text: 'text-foreground',
          border: 'border-border',
        };
    }
  };

  if (loading) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Chat History</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-xs">Loading chat history...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Chat History</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <Alert variant="destructive" className="h-full">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Chat History</CardTitle>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {messages.length} messages
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
        <ScrollArea className="flex-1 h-full">
          <div className="space-y-3 p-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                <p>No chat messages yet</p>
              </div>
            ) : (
              messages.map((message) => {
                const { bg, text, border } = getRoleColor(message.role);
                return (
                  <div
                    key={message.message_id}
                    className={`rounded-lg border ${border} ${bg} p-3 space-y-1`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold uppercase ${text}`}
                      >
                        {message.role}
                        {message.tool_name && ` • ${message.tool_name}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp()}
                      </span>
                    </div>
                    <div
                      className={`text-xs leading-relaxed break-words ${text}`}
                    >
                      <ReactMarkdown
                        components={markdownComponents}
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[
                          rehypeRaw,
                          [rehypeSanitize, customSanitizeSchema],
                        ]}
                      >
                        {parseContent(message.content)}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveChatMessages;
