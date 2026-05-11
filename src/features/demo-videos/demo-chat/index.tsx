import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery } from '@apollo/client';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  BarChart3,
  Bell,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppDispatch, RootState } from '@/store';
import {
  fetchDemoTranscript,
  fetchDemoEvents,
} from '@/store/slices/demo-videos-slice';
import { getUserSession } from '@/lib/ssemanager';
import { GET_ORG_MODELS } from '@/graphql/mutations';
import type { Message, Event } from '@/features/demo-videos/types';
import {
  buildHybridChatPayload,
  runBackendChatStream,
} from '@/features/chat/chat-agent';
import {
  fetchChatHistoryByThreadId,
  resolveChatThreadId,
} from '@/features/chat/thread-api';
import { VideoPlayer } from './components/video-player';
import ChatMessages from './components/chat-messages';
import ChatInput from './components/chat-input';
import { DemoTranscriptModal } from './components/demo-transcript-modal';
import { ManufacturingInsightsDialog } from './components/manufacturing-insights-dialog';
import { selectDefaultChatModelHash } from '@/utils/chat-model-default';

const apiUrl = import.meta.env.VITE_CHAT_API_URL;

const escapeToolAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const escapeToolText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function DemoChatInterface() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const videoId = searchParams.get('video_id') || params.videoId;

  const { transcript, events } = useSelector(
    (state: RootState) => state.demoVideos
  );

  // Fetch all available models
  const { data: modelsData, loading: modelsLoading } = useQuery(
    GET_ORG_MODELS,
    {
      fetchPolicy: 'network-only',
    }
  );

  const [userQuery, setUserQuery] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [presignedUrl, setPresignedUrl] = useState('');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const resolvedThreadKeyRef = useRef<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant' | 'system'; content: string }[]
  >([]);

  // Filter events for current video
  const videoEvents = useMemo(() => {
    return events.filter((event: Event) => event.demo_id === Number(videoId));
  }, [events, videoId]);

  // Format relative time helper
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1)
      return `${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'year' : 'years'} ago`;
    interval = seconds / 2592000;
    if (interval > 1)
      return `${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'month' : 'months'} ago`;
    interval = seconds / 86400;
    if (interval > 1)
      return `${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'day' : 'days'} ago`;
    interval = seconds / 3600;
    if (interval > 1)
      return `about ${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'hour' : 'hours'} ago`;
    interval = seconds / 60;
    if (interval > 1)
      return `${Math.floor(interval)} ${Math.floor(interval) === 1 ? 'minute' : 'minutes'} ago`;
    return 'just now';
  };

  // Model selection state
  const [models, setModels] = useState<
    Array<{ modelHash: string; modelName: string }>
  >([]);
  const [selectedModel, setSelectedModel] = useState<string>('');

  const systemPrompt =
    'You are an AI assistant helping with video analysis. Answer questions about the video content based on the transcript provided.';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const assistantIndexRef = useRef<number | null>(null);

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
      }));

      setModels(mappedModels);
      if (mappedModels.length > 0 && !selectedModel) {
        setSelectedModel(selectDefaultChatModelHash(mappedModels));
      }
    }
  }, [modelsData, selectedModel]);

  useEffect(() => {
    if (videoId) {
      setVideoLoading(true);
      dispatch(fetchDemoTranscript(Number(videoId))).then((result) => {
        if (
          result.payload &&
          typeof result.payload === 'object' &&
          'presigned_url' in result.payload
        ) {
          setPresignedUrl(
            (result.payload as { presigned_url?: string }).presigned_url || ''
          );
        }
        setVideoLoading(false);
      });
      // Fetch events for notifications
      dispatch(fetchDemoEvents());
    }
  }, [videoId, dispatch]);

  useEffect(() => {
    if (systemPrompt && !chatMessages.some((m) => m.role === 'system')) {
      setChatMessages([{ role: 'system', content: systemPrompt }]);
    }
  }, [systemPrompt, chatMessages]);

  useEffect(() => {
    if (
      transcript &&
      transcript !== 'No transcript available for this video.' &&
      transcript !== 'Error fetching transcript data.'
    ) {
      const updatedSystemPrompt = `${systemPrompt}\nTRANSCRIPT:\n${transcript}`;
      setChatMessages((prev) => {
        return prev.map((message) => {
          if (message.role === 'system') {
            return { ...message, content: updatedSystemPrompt };
          }
          return message;
        });
      });
    }
  }, [transcript, systemPrompt]);

  const fetchHistory = useCallback(async () => {
    const { token } = getUserSession();
    if (!token || !threadId) return;

    try {
      const data = await fetchChatHistoryByThreadId({
        chatApiUrl: apiUrl,
        token,
        threadId,
      });

      const historyMessages: Message[] = (data.messages || []).map(
        (message, index) => ({
          id: message.message_id || `${threadId}-${index}`,
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content: [{ text: message.content }],
          timestamp: message.created_at || new Date().toISOString(),
        })
      );

      setConversation(historyMessages);
    } catch (error) {
      console.error('Error fetching demo history:', error);
    }
  }, [threadId]);

  useEffect(() => {
    const contextKey = videoId ? String(videoId) : null;
    if (!apiUrl || !contextKey) return;
    if (resolvedThreadKeyRef.current === contextKey && threadId) return;

    let isMounted = true;

    const resolveThread = async () => {
      const { token } = getUserSession();
      if (!token) return;

      try {
        const resolvedThreadId = await resolveChatThreadId({
          chatApiUrl: apiUrl,
          token,
          threadType: 'demo',
          inferenceModality: 'demo',
          entityHash: String(videoId),
          threadTitle: 'Demo video chat',
        });

        if (!isMounted) return;
        resolvedThreadKeyRef.current = contextKey;
        setThreadId(resolvedThreadId);
      } catch (error) {
        console.error('Error resolving demo chat thread:', error);
      }
    };

    resolveThread();

    return () => {
      isMounted = false;
    };
  }, [threadId, videoId]);

  useEffect(() => {
    if (threadId) {
      fetchHistory();
    }
  }, [fetchHistory, threadId]);

  // Auto-scroll
  const scrollToBottom = useCallback(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, []);

  const isUserNearBottom = () => {
    if (!messagesContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  useEffect(() => {
    if (isUserNearBottom()) {
      scrollToBottom();
    }
  }, [conversation, isStreaming, scrollToBottom]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setUserQuery(e.target.value);
  };

  const handleSendMessage = () => {
    sendMessage();
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const sendMessage = useCallback(async () => {
    if (!userQuery.trim()) return;

    if (!threadId) {
      toast.error('Conversation is still loading. Please try again.');
      return;
    }

    const { token } = getUserSession();
    if (!token) {
      console.error('No auth token found for demo chat');
      return;
    }

    const nowISO = new Date().toISOString();
    setChatMessages((prev) => [...prev, { role: 'user', content: userQuery }]);

    const userConv = {
      role: 'user' as const,
      content: [{ text: userQuery }],
      timestamp: nowISO,
    };

    const assistantPlaceholder = {
      role: 'assistant' as const,
      content: [{ text: '' }],
      timestamp: nowISO,
    };

    setConversation((prev) => {
      const next = [...prev, userConv, assistantPlaceholder];
      assistantIndexRef.current = next.length - 1;
      return next;
    });

    setUserQuery('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const payload = buildHybridChatPayload({
        threadHash: threadId,
        modelHash: selectedModel,
        message: userQuery,
        modelType: 'chat',
      });
      let fullAssistantText = '';

      const updateAssistantContent = (nextText: string) => {
        setConversation((prev) => {
          const idx = assistantIndexRef.current;
          if (idx === null) return prev;

          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            content: [{ text: nextText }],
          };
          return updated;
        });
      };

      await runBackendChatStream(
        {
          chatApiUrl: apiUrl,
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

      setConversation((prev) => {
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
      console.error('Streaming error:', err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Sorry, something went wrong. Please try again.';

      setConversation((prev) => {
        const idx = assistantIndexRef.current;
        const errorMsg: Message = {
          role: 'assistant',
          content: [{ text: `Error: ${errorMessage}` }],
          timestamp: new Date().toISOString(),
        };

        if (idx === null || idx < 0 || idx >= prev.length) {
          return [...prev, errorMsg];
        }

        const updated = [...prev];
        updated[idx] = errorMsg;
        assistantIndexRef.current = null;
        return updated;
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [userQuery, selectedModel, threadId]);

  return (
    <div className="flex flex-col h-full">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main fixed className="flex-1 px-6 pt-0 pr-15 pl-15">
        {/* Page Header */}
        <div className="sticky top-0 z-10 bg-background">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              {videoId && (
                <p className="text-sm text-muted-foreground mt-1">
                  Video ID: {videoId}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex gap-6 h-[calc(100vh-120px)] mt-4">
          {/* Left Side - 40% - Video & Transcript */}
          <div className="w-[40%] flex flex-col gap-6 overflow-y-auto">
            {/* Video Player */}
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold mb-3">Video</h2>
              {videoLoading ? (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin" />
                    <p className="text-sm">Loading video...</p>
                  </div>
                </div>
              ) : presignedUrl ? (
                <>
                  <div className="aspect-video rounded-lg overflow-hidden bg-black">
                    <VideoPlayer presignedUrl={presignedUrl} />
                  </div>
                  {isLoadingInsights ? (
                    <Skeleton className="mt-4 w-full h-11 rounded-md" />
                  ) : (
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => {
                          setIsLoadingInsights(true);
                          setIsInsightsOpen(true);
                          setTimeout(() => setIsLoadingInsights(false), 300);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-100 border dark:border-purple-900 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/50 dark:text-purple-300 dark:hover:bg-purple-900 text-purple-700 "
                        size="lg"
                      >
                        <BarChart3 className="w-5 h-5" />
                        View Insights
                      </Button>
                      <Button
                        size="lg"
                        onClick={() =>
                          setIsNotificationsOpen(!isNotificationsOpen)
                        }
                        className={`flex-1 flex items-center justify-center gap-2 border-2 transition-colors ${
                          isNotificationsOpen
                            ? 'bg-green-50 dark:bg-green-900/50 border-green-200 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950 dark:border-green-900'
                            : 'bg-green-50 dark:bg-green-900/50 border-green-200 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-950 dark:border-green-900'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                        Notifications
                        {videoEvents.length > 0 && (
                          <span className="ml-1 px-1.5 py-0.5 bg-green-600 dark:bg-green-500 text-white text-[10px] font-medium rounded-full">
                            {videoEvents.length}
                          </span>
                        )}
                        {isNotificationsOpen ? (
                          <ChevronUp className="w-4 h-4 ml-1" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Inline Alerts Panel */}
                  {isNotificationsOpen && (
                    <Card className="mt-3">
                      <CardContent className="p-0 pt-0">
                        <ScrollArea className="h-[300px] px-4 pb-4 pt-1">
                          {videoEvents.length > 0 ? (
                            <div className="space-y-3">
                              {videoEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className="rounded-lg border border-border bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                                >
                                  <div className="flex gap-3">
                                    {/* Info Icon */}
                                    <div className="flex-shrink-0">
                                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                      {/* Title and Timestamp */}
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <h4 className="text-[15px] font-semibold text-foreground leading-tight">
                                          {event.event_name || 'Alert'}
                                        </h4>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {event.created_at
                                              ? formatRelativeTime(
                                                  event.created_at
                                                )
                                              : ''}
                                          </span>
                                          <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                                        </div>
                                      </div>

                                      {/* Description */}
                                      <p className="text-sm text-muted-foreground leading-relaxed">
                                        {event.event_description?.replace(
                                          /^"|"$/g,
                                          ''
                                        ) || ''}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                              <Bell className="w-8 h-8 text-muted-foreground/40 mb-2" />
                              <p className="text-sm text-muted-foreground">
                                No notifications for this video
                              </p>
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Video not available
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - 60% - Chat */}
          <div className="w-[60%] flex flex-col min-h-0 pl-2">
            <h2 className="text-lg font-semibold mb-3">Chat</h2>
            <div className="flex-1 flex flex-col rounded-md overflow-hidden min-h-0 bg-background border border-gray-200 dark:border-gray-800 border-rounded-lg">
              {/* Messages */}
              <div className="flex-1 min-h-0">
                <div
                  ref={messagesContainerRef}
                  className="h-full overflow-y-auto p-6"
                >
                  {conversation.length === 0 ? (
                    <div className="h-full sticky flex items-center justify-center pb-6">
                      <div className="text-center max-w-md">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                          <svg
                            className="w-8 h-8"
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
                        <h3 className="text-lg font-semibold mb-2">
                          Start a conversation
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Ask questions about the video or request analysis
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ChatMessages
                        conversation={
                          conversation.filter(
                            (msg) => msg.role !== 'system'
                          ) as Array<{
                            role: 'user' | 'assistant';
                            content: { text: string }[];
                            timestamp?: string;
                          }>
                        }
                        isLoading={isLoading}
                        isStreaming={isStreaming}
                      />
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Input */}
              <div className="p-6 bg-background">
                <ChatInput
                  userQuery={userQuery}
                  onInputChange={handleInputChange}
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  onOpenTranscript={() => setIsTranscriptOpen(true)}
                  models={models}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  modelsLoading={modelsLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </Main>
      {/* Transcript Modal */}
      <DemoTranscriptModal
        isOpen={isTranscriptOpen}
        transcript={transcript || ''}
        onClose={() => setIsTranscriptOpen(false)}
      />
      {/* Manufacturing Insights Dialog */}
      <ManufacturingInsightsDialog
        open={isInsightsOpen}
        onOpenChange={setIsInsightsOpen}
        videoId={videoId ?? '16'}
      />{' '}
    </div>
  );
}

export default memo(DemoChatInterface);
