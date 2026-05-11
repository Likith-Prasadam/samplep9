/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import VideoPlayer from './video-player';
import ChatInput from './chat-input';
import TranscriptModal from './playground-transcript-modal';
import ModelParametersForm from './playground-params-form';
import ChatMessages, {
  type ChatMessagesRef,
} from '@/features/playground/components/chat-messages';
import { BatchInsightsPopover } from './batch-insights-popover';
import { AnalysisCardPopover } from './analysis-card-popover';
import { useLazyQuery, useQuery, useMutation } from '@apollo/client';
import {
  GET_BATCHES_VIDEOS,
  GET_BATCH_TRANSCRIPTS,
  PROCESS_BATCH,
  GET_BATCH_INSIGHTS,
} from '@/graphql/batch_mutations';
import { GET_ORG_MODELS } from '@/graphql/mutations';
import { ArrowLeft, BarChart3, Bell, Loader2, Maximize2 } from 'lucide-react';
import type { BatchVideo } from '../types/batch-analysis';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';
import { toast } from 'sonner';
import { getUserSession } from '@/lib/ssemanager';
import {
  buildHybridChatPayload,
  runBackendChatStream,
} from '@/features/chat/chat-agent';
import {
  ChatContainer,
  ChatHome,
  ChatView,
  type ChatItemData,
  type ChatViewMessage,
} from '@/features/chat/components';
import type { ChatThreadSummary } from '@/features/chat/thread-api';
import {
  createChatThread,
  deleteChatThreadById,
  listChatThreads,
} from '@/features/chat/thread-api';
import {
  selectNotificationsForVideo,
  fetchNotifications,
  clearNotificationsForVideo,
} from '@/store/slices/notifications-slice';
import {
  selectChatPanelState,
  setChatPanelActiveChat,
  setChatPanelDraft,
} from '@/store/slices/chat-panel-slice';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatTimeInTimezone, getUserTimezone } from '@/utils/timeUtils';
import type { RootState } from '@/store';
import { useAppDispatch } from '@/store';
import { AlertTriangle } from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: { text: string }[];
  timestamp?: string;
}

const escapeToolAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const escapeToolText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Helper to unescape python/json string content
const unescapeString = (str: string) => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
};

export default function Chat() {
  const [userQuery, setUserQuery] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isEmptyCardOpen, setIsEmptyCardOpen] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isAlertVideoOpen, setIsAlertVideoOpen] = useState(false);
  const [activeAlertVideo, setActiveAlertVideo] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const assistantIndexRef = useRef<number | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const chatMessagesRef = useRef<ChatMessagesRef | null>(null);

  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const batchHashFromUrl = searchParams.get('batchHash');

  const [video, setVideo] = useState<BatchVideo | null>(null);
  const [videoId, setVideoId] = useState(Number(params.videoId));
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<any[]>([]);

  const [getVideos] = useLazyQuery(GET_BATCHES_VIDEOS);
  const [getTranscripts, { data: transcriptData }] = useLazyQuery(
    GET_BATCH_TRANSCRIPTS
  );
  const { data: modelsData, loading: modelsLoading } = useQuery(
    GET_ORG_MODELS,
    {
      fetchPolicy: 'network-only',
    }
  );
  const {
    data: insightsData,
    loading: insightsLoading,
    error: insightsError,
  } = useQuery(GET_BATCH_INSIGHTS, {
    variables: { batchHash: video?.batchHash },
    skip: !video?.batchHash,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('[INSIGHTS] Query completed:', data);
    },
    onError: (error) => {
      console.error('[INSIGHTS] Query error:', error);
    },
  });
  const [processBatchMutation] = useMutation(PROCESS_BATCH);

  // Debug insights data
  useEffect(() => {
    if (video?.batchHash) {
      console.log('[INSIGHTS] Batch hash:', video.batchHash);
      console.log('[INSIGHTS] Loading:', insightsLoading);
      console.log('[INSIGHTS] Data:', insightsData);
      console.log('[INSIGHTS] Error:', insightsError);
    }
  }, [video?.batchHash, insightsLoading, insightsData, insightsError]);

  const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;
  const dispatch = useAppDispatch();
  const notificationSource = video?.batchHash ?? batchHashFromUrl ?? undefined;
  const notificationsSelector = useMemo(
    () => selectNotificationsForVideo(notificationSource),
    [notificationSource]
  );
  const videoNotifications = useSelector((state: RootState) =>
    notificationsSelector(state)
  );
  const panelKey = useMemo(
    () => `batch:${video?.batchHash ?? batchHashFromUrl ?? 'unknown'}`,
    [video?.batchHash, batchHashFromUrl]
  );
  const panelState = useSelector((state: RootState) =>
    selectChatPanelState(state, panelKey)
  );

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
          thread_type: 'batch_video',
          inference_modality: 'batch',
          entity_hash: video?.batchHash ?? null,
          thread_title: threadTitle ?? video?.batchName ?? 'Batch video chat',
          title: threadTitle ?? video?.batchName ?? 'Batch video chat',
          created_at: now,
          updated_at: now,
        };

        return [nextThread, ...prev];
      });
    },
    [video?.batchHash, video?.batchName]
  );

  // Helper to consistently format timestamps in UTC for alerts
  const formatUtcTimestamp = (value: string) => {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return formatTimeInTimezone(d, getUserTimezone(), 'datetime');
  };

  // Load alerts for this video when in chat so the alerts section is populated.
  const videoBatchHash = video?.batchHash;
  useEffect(() => {
    if (!videoBatchHash) return;
    dispatch(
      fetchNotifications({
        itemsPerPage: 100,
        page: 1,
        type: 'batch',
        videoId: videoBatchHash,
      })
    );
  }, [dispatch, videoBatchHash]);

  // Update videoId when params change
  useEffect(() => {
    setVideoId(Number(params.videoId));
  }, [params.videoId]);

  // Fetch batch videos
  const fetchBatchVideos = useCallback(
    async (nextVideoId: number) => {
      setVideoLoading(true);
      try {
        const batchHash = batchHashFromUrl ?? params.batchHash;

        let fetchedVideo: any = null;

        if (batchHash) {
          const { data } = await getVideos({
            variables: {
              page: 1,
              itemsPerPage: 1,
              filters: { batchHashes: [batchHash] },
            },
          });
          fetchedVideo = data?.getBatchVideos?.batches?.[0];
        } else if (nextVideoId > 0) {
          const { data } = await getVideos({
            variables: {
              page: 1,
              itemsPerPage: 50,
            },
          });

          const allVideos = data?.getBatchVideos?.batches || [];
          fetchedVideo = allVideos.find((candidate: any) => {
            let hash = 0;
            for (let index = 0; index < candidate.batchHash.length; index++) {
              const char = candidate.batchHash.charCodeAt(index);
              hash = (hash << 5) - hash + char;
              hash = hash & hash;
            }
            return Math.abs(hash) === nextVideoId;
          });
        }

        if (fetchedVideo) {
          const mappedVideo: BatchVideo = {
            id: nextVideoId,
            batchHash: fetchedVideo.batchHash,
            batchName: fetchedVideo.batchName || '',
            batchCloudStreamPath: fetchedVideo.batchCloudStreamPath || '',
            created_at: new Date().toISOString(),
            duration: fetchedVideo.duration || 0,
            batchTags: fetchedVideo.batchTags ?? null,
            user_id: '1',
            batchStatus: (fetchedVideo.batchStatus || '').toLowerCase(),
            cohort_id: '1',
            thumbnailPresignedUrl:
              fetchedVideo.thumbnailPresignedUrl ||
              fetchedVideo.batchThumbnailPath ||
              '',
            videoPresignedUrl: fetchedVideo.videoPresignedUrl,
          };
          setVideo(mappedVideo);
        } else {
          navigate('/playground', { replace: true });
          setVideoLoading(false);
          setTimeout(() => navigate('/playground', { replace: true }), 300);
        }
      } catch (error) {
        console.error('Error fetching video:', error);
        navigate('/playground', { replace: true });
        setVideoLoading(false);
        setTimeout(() => navigate('/playground', { replace: true }), 300);
        return;
      } finally {
        setVideoLoading(false);
      }
    },
    [getVideos, navigate, params.batchHash, batchHashFromUrl]
  );

  useEffect(() => {
    if (videoId > 0 || batchHashFromUrl) {
      fetchBatchVideos(videoId || 0);
    }
  }, [videoId, batchHashFromUrl, fetchBatchVideos]);

  // Fetch available models
  useEffect(() => {
    if (modelsData?.getOrgModels) {
      const allModels = modelsData.getOrgModels;
      const chatModels = allModels.filter((m: any) => m.modelType === 'chat');

      const mappedModels = chatModels.map((m: any) => ({
        modelHash: m.modelHash,
        modelName: m.modelName,
        modelType: m.modelType,
      }));

      setModels(mappedModels);
      if (mappedModels.length > 0 && !selectedModel) {
        setSelectedModel(mappedModels[0].modelHash);
      }
    }
  }, [modelsData, selectedModel]);

  const handleBackToHome = useCallback(() => {
    updateThreadId(null);
    setConversation([]);
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
    Boolean(threadId) || conversation.length > 0 || isLoading || isStreaming;

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

  const conversationMessages = useMemo<ChatViewMessage[]>(() => {
    return conversation.map((msg, index) => ({
      id: msg.id || `${msg.role}-${index}`,
      role: msg.role,
      text: msg.content[0]?.text || '',
      timestamp: msg.timestamp,
    }));
  }, [conversation]);

  const hasMoreThreads = visibleHistoryCount < threadHistory.length;
  const renderLayout = () => (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main
        fixed
        className="flex-1 min-h-0 overflow-hidden px-3 pt-0 sm:px-4 lg:px-6"
      >
        <div className="flex h-full min-h-0 flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackClick}
              className="inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-muted"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              {video && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {video.batchName} • Batch ID: {video.id}
                </p>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,40%)_minmax(0,60%)] xl:gap-4 xl:overflow-hidden xl:pr-0">
              <section className="flex min-h-0 flex-col gap-4">
                <div className="flex min-h-0 flex-1 flex-col gap-3 xl:gap-4">
                  <div>
                    <h2 className="text-lg font-semibold">Video</h2>
                    <p className="text-sm text-muted-foreground">
                      {video?.batchName || 'Batch video session'}
                    </p>
                  </div>

                  {videoLoading ? (
                    <div className="h-[clamp(180px,28vh,280px)] overflow-hidden rounded-2xl bg-muted flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin" />
                        <p className="text-sm">Loading video...</p>
                      </div>
                    </div>
                  ) : video ? (
                    <div className="h-[clamp(180px,28vh,280px)] overflow-hidden rounded-2xl bg-black">
                      <VideoPlayer
                        presignedUrl={
                          video.videoPresignedUrl || video.batchCloudStreamPath
                        }
                      />
                    </div>
                  ) : (
                    <div className="h-[clamp(180px,28vh,280px)] flex items-center justify-center rounded-2xl bg-muted">
                      <p className="text-sm text-muted-foreground">
                        Video not available
                      </p>
                    </div>
                  )}

                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold">Alerts</h2>
                        {videoNotifications.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {videoNotifications.length}{' '}
                            {videoNotifications.length === 1
                              ? 'alert'
                              : 'alerts'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEmptyCardOpen(true)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          aria-label="View Analysis"
                        >
                          <img
                            src="/file-ai-line.svg"
                            alt=""
                            aria-hidden="true"
                            className="h-4 w-4 dark:brightness-0 dark:invert"
                          />
                        </button>
                        <Button
                          type="button"
                          onClick={() => setIsInsightsOpen(true)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <BarChart3 className="w-4 h-4" />
                          View Insights
                        </Button>
                      </div>
                    </div>

                    <div className="spectra-scrollbar-wide min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border/60 bg-background/70">
                      {videoNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-5 text-center text-sm text-muted-foreground">
                          <AlertTriangle className="h-5 w-5 text-muted-foreground/70" />
                          <span>No alerts for this video yet.</span>
                        </div>
                      ) : (
                        videoNotifications.map((n) => {
                          const alertId =
                            n.event_id ?? `${n.timestamp}-${n.alert}`;
                          const isExpanded = expandedAlertId === alertId;

                          return (
                            <div
                              key={alertId}
                              className="border-b border-border/60 bg-card/80 p-3 transition-colors last:border-b-0 hover:bg-card"
                            >
                              <div className="flex gap-3">
                                <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                  {n.details?.presigned_url ? (
                                    <video
                                      className="h-full w-full object-cover"
                                      src={n.details.presigned_url}
                                      muted
                                      playsInline
                                      preload="metadata"
                                      onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        el.currentTime = 0;
                                        const playPromise = el.play();
                                        if (
                                          playPromise &&
                                          typeof playPromise.catch ===
                                            'function'
                                        ) {
                                          playPromise.catch(() => {});
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.pause();
                                      }}
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                      No clip
                                    </div>
                                  )}
                                  {n.details?.presigned_url && (
                                    <button
                                      type="button"
                                      className="absolute right-1 top-1 inline-flex items-center justify-center rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveAlertVideo({
                                          url: n.details!.presigned_url!,
                                          title: n.alert,
                                        });
                                        setIsAlertVideoOpen(true);
                                      }}
                                      aria-label="Open alert video"
                                    >
                                      <Maximize2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1 space-y-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="line-clamp-2 text-xs font-medium text-foreground">
                                      {n.alert}
                                    </p>
                                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                                      {formatUtcTimestamp(n.timestamp)}
                                    </span>
                                  </div>

                                  {n.details?.description && (
                                    <div className="space-y-0.5">
                                      <p
                                        className={
                                          'text-[11px] text-muted-foreground ' +
                                          (isExpanded ? '' : 'line-clamp-3')
                                        }
                                      >
                                        {n.details.description}
                                      </p>
                                      {n.details.description.length > 120 && (
                                        <button
                                          type="button"
                                          className="text-[11px] font-medium text-primary hover:underline"
                                          onClick={() =>
                                            setExpandedAlertId(
                                              isExpanded ? null : alertId
                                            )
                                          }
                                        >
                                          {isExpanded ? 'See less' : 'See more'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden">
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
                        onLoadMore={() =>
                          setVisibleHistoryCount((prev) => prev + 3)
                        }
                        input={
                          <ChatInput
                            userQuery={userQuery}
                            onInputChange={handleInputChange}
                            onSend={handleSendMessage}
                            isLoading={isLoading}
                            isStreaming={isStreaming}
                            onOpenConfig={
                              video ? () => setIsConfigOpen(true) : undefined
                            }
                            onOpenTranscript={() => setIsTranscriptOpen(true)}
                            canConfigure={!!video}
                            hasConversation={
                              conversation.length > 0 ||
                              Boolean(userQuery.trim())
                            }
                            models={models}
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            modelsLoading={modelsLoading}
                          />
                        }
                      />
                    }
                    conversation={
                      <ChatView
                        title="Chat"
                        subtitle={activeThreadSubtitle}
                        onBack={handleBackToHome}
                        messages={conversationMessages}
                        isStreaming={isStreaming}
                        loading={
                          threadMessagesLoading ||
                          (isLoading && conversationMessages.length === 0)
                        }
                        copyEnabled={!isStreaming}
                        endRef={endOfMessagesRef}
                        input={
                          <ChatInput
                            userQuery={userQuery}
                            onInputChange={handleInputChange}
                            onSend={handleSendMessage}
                            isLoading={isLoading}
                            isStreaming={isStreaming}
                            onOpenConfig={
                              video ? () => setIsConfigOpen(true) : undefined
                            }
                            onOpenTranscript={() => setIsTranscriptOpen(true)}
                            canConfigure={!!video}
                            hasConversation={
                              conversation.length > 0 ||
                              Boolean(userQuery.trim())
                            }
                            models={models}
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            modelsLoading={modelsLoading}
                          />
                        }
                      />
                    }
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      </Main>

      <TranscriptModal
        isOpen={isTranscriptOpen}
        transcript={transcriptData?.getBatchTranscripts}
        onClose={() => setIsTranscriptOpen(false)}
      />

      {video && (
        <ModelParametersForm
          isOpen={isConfigOpen}
          video={video}
          processBatch={handleProcessBatch}
          onClose={() => setIsConfigOpen(false)}
          notifications={[]}
          viewedNotifications={new Set<string>()}
          onDeleteSuccess={() => {}}
          username="Unknown"
          mode="reanalyze"
        />
      )}

      <Dialog
        open={isAlertVideoOpen && !!activeAlertVideo}
        onOpenChange={(open) => {
          setIsAlertVideoOpen(open);
          if (!open) {
            setActiveAlertVideo(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {activeAlertVideo?.title || 'Alert video'}
            </DialogTitle>
          </DialogHeader>
          {activeAlertVideo && (
            <div className="mt-2">
              <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                <video
                  src={activeAlertVideo.url}
                  controls
                  className="h-full w-full object-contain bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BatchInsightsPopover
        open={isInsightsOpen}
        onOpenChange={setIsInsightsOpen}
        insights={insightsData?.getBatchInsights || null}
        batchName={video?.batchName}
        originalVideoUrl={
          video?.videoPresignedUrl || video?.batchCloudStreamPath || null
        }
      />

      <AnalysisCardPopover
        open={isEmptyCardOpen}
        onOpenChange={setIsEmptyCardOpen}
        sourceHash={video?.batchHash ?? batchHashFromUrl ?? undefined}
      />
    </div>
  );
  // Fetch chat history
  const fetchHistory = useCallback(async () => {
    if (!chatApiUrl || !threadId) {
      setThreadMessagesLoading(false);
      return;
    }

    try {
      const { token } = getUserSession();
      if (!token) {
        setThreadMessagesLoading(false);
        return;
      }

      setThreadMessagesLoading(true);

      const historyUrl = chatApiUrl.replace('/completions', '/history');
      const url = new URL(historyUrl);
      url.searchParams.append('thread_hash', threadId);
      url.searchParams.append('thread_id', threadId);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.messages && Array.isArray(data.messages)) {
          // First pass: map and unescape content
          const rawMessages = data.messages.map((m: any) => {
            let contentText = m.content;
            const role = m.role;

            if (typeof m.content === 'string') {
              const trimmed = m.content.trim();

              // 1. Try standard JSON parse if it looks like a list
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                  const parsed = JSON.parse(trimmed);
                  if (Array.isArray(parsed)) {
                    const textParts = parsed
                      .filter((p: any) => p.type === 'text')
                      .map((p: any) => p.text)
                      .join('');
                    if (textParts) contentText = textParts;
                  }
                } catch {
                  // Not valid JSON, fall through to regex
                }
              }

              // 2. Try to extract content from python list-like string using regex
              if (
                contentText === m.content &&
                trimmed.startsWith('[{') &&
                trimmed.includes('\\u003c')
              ) {
                const textMatch = trimmed.match(
                  /(?:'|")text(?:'|")\s*:\s*(?:'|")(.*?)(?:'|")/s
                );
                if (textMatch && textMatch[1]) {
                  contentText = textMatch[1]
                    .replace(/\\u003c/g, '<')
                    .replace(/\\u003e/g, '>')
                    .replace(/\\u0026/g, '&')
                    .replace(/\\"/g, '"')
                    .replace(/\\'/g, "'");
                }
              }

              // 3. Unescape plain string content
              if (contentText === m.content) {
                contentText = unescapeString(m.content);
              }

              // 4. Convert tool results to readable text
              if (
                contentText.includes('tool result') ||
                contentText.includes('&lt;tool-result')
              ) {
                contentText = contentText
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"');
              }
            }

            return {
              id: m.message_id,
              role: role,
              content: [{ text: contentText }],
              timestamp: m.created_at,
            };
          });

          // Second pass: merge consecutive assistant messages
          const mergedMessages: Message[] = [];
          rawMessages.forEach((msg: Message) => {
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

          setConversation(mergedMessages);

          const lastMessage = mergedMessages[mergedMessages.length - 1];
          if (lastMessage?.content?.[0]?.text && threadId) {
            const preview = lastMessage.content[0].text.trim().slice(0, 120);
            setThreadPreviews((prev) => ({ ...prev, [threadId]: preview }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
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
    if (conversation.length > 0) {
      setThreadMessagesLoading(false);
      return;
    }

    fetchHistory();
  }, [fetchHistory, threadId, isLoading, isStreaming, conversation.length]);

  useEffect(() => {
    if (!threadId || !video?.batchHash) return;
    getTranscripts({ variables: { batchHash: video.batchHash } });
  }, [getTranscripts, threadId, video?.batchHash]);

  const loadThreadHistory = useCallback(async () => {
    const batchHash = video?.batchHash;
    if (!chatApiUrl || !batchHash) {
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
        threadType: 'batch_video',
        entityHash: batchHash,
      });
      const sortedThreads = [...threads].sort((left, right) => {
        const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
        const rightTime = right.updated_at ? Date.parse(right.updated_at) : 0;
        return rightTime - leftTime;
      });
      setThreadHistory(sortedThreads);
      setVisibleHistoryCount(3);
    } catch (error) {
      console.error('Error loading batch chat history list:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [chatApiUrl, video?.batchHash]);

  useEffect(() => {
    void loadThreadHistory();
  }, [loadThreadHistory]);

  function handleSelectThread(selectedThreadId: string) {
    setThreadMessagesLoading(true);
    updateThreadId(selectedThreadId);
    setConversation([]);
    updateUserQuery('');
  }

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
          setConversation([]);
          updateUserQuery('');
          updateThreadId(null);
        }

        toast.success('Conversation deleted');
      } catch (e) {
        console.error('Error deleting thread:', e);
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

  // Trigger batch (re)processing for this video – reused in config modal
  const handleProcessBatch = useCallback(
    async (targetVideo: BatchVideo) => {
      dispatch(
        clearNotificationsForVideo({
          videoId: String(targetVideo.id),
          batchHash: targetVideo.batchHash ?? undefined,
        })
      );

      toast.info('Batch processing started!', {
        position: 'bottom-center',
        className: 'bg-teal-600 text-white',
        duration: 3000,
      });

      try {
        const { data, errors } = await processBatchMutation({
          variables: {
            batchHash: targetVideo.batchHash,
          },
        });

        if (errors && errors.length > 0) {
          throw new Error(errors[0].message);
        }

        if (data?.processBatch?.status === 'Failed') {
          throw new Error(data.processBatch.message || 'Processing failed');
        }

        if (data?.processBatch?.status === 'Success') {
          console.log(
            `[PROCESS] ✅ Processing initiated for video ${targetVideo.id}`
          );
        }
      } catch (err: unknown) {
        console.error('Error processing batch from chat:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        toast.error(`Error processing batch: ${errorMessage}`, {
          position: 'bottom-center',
          className: 'bg-red-500 text-white',
          duration: 3000,
        });
      }
    },
    [dispatch, processBatchMutation]
  );

  // Send message handler
  async function sendMessage() {
    if (!userQuery.trim() || isLoading) return;

    if (!selectedModel) {
      toast.error('Please select a model to start chatting');
      return;
    }

    const { token } = getUserSession();
    if (!token) {
      console.error('No token found');
      return;
    }

    const nowISO = new Date().toISOString();

    const userConv: Message = {
      role: 'user',
      content: [{ text: userQuery }],
      timestamp: nowISO,
    };

    const assistantPlaceholder: Message = {
      role: 'assistant',
      content: [{ text: '' }],
      timestamp: nowISO,
    };

    setConversation((prev) => {
      const next = [...prev, userConv, assistantPlaceholder];
      assistantIndexRef.current = next.length - 1;
      return next;
    });

    updateUserQuery('');
    setIsLoading(true);
    setIsStreaming(true);

    const hadActiveThread = Boolean(threadId);
    const nextThreadTitle = video?.batchName || 'Batch video chat';
    let activeThreadId = threadId;

    try {
      if (!activeThreadId) {
        activeThreadId = await createChatThread({
          chatApiUrl,
          token,
          threadType: 'batch_video',
          inferenceModality: 'batch',
          entityHash: video?.batchHash,
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
      });

      let fullAssistantText = '';

      const updateAssistantContent = (nextText: string) => {
        setConversation((prev) => {
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
      if (activeThreadId) {
        touchThreadHistory(activeThreadId, !hadActiveThread, nextThreadTitle);
      }
      setIsLoading(false);
      setIsStreaming(false);
    }
  }

  // Handlers
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    updateUserQuery(e.target.value);
  }

  function handleSendMessage() {
    sendMessage();
  }

  const handleBackClick = () => {
    navigate(-1);
  };

  return renderLayout();

  return (
    <div className="flex min-h-dvh flex-col overflow-hidden">
      {/* Header */}
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main
        fixed
        className="flex-1 min-h-0 overflow-hidden px-6 pt-0 pr-15 pl-15"
      >
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
              {video ? (
                <p className="text-sm text-muted-foreground mt-1">
                  {video?.batchName} • Batch ID: {video?.id}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="mt-4 flex min-h-0 flex-1 gap-6 overflow-hidden">
          {/* Left Side - 40% - Video & Alerts */}
          <div className="flex min-h-0 w-[40%] flex-col gap-6 overflow-y-auto">
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
              ) : video ? (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <VideoPlayer
                    presignedUrl={
                      video?.videoPresignedUrl ||
                      video?.batchCloudStreamPath ||
                      ''
                    }
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Video not available
                  </p>
                </div>
              )}
            </div>

            {/* Alerts & Insights Section */}
            <div className="flex flex-col mb-4">
              {/* Section Header with Insights Button */}
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Alerts
                  {videoNotifications.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-foreground text-background font-semibold">
                      {videoNotifications.length}
                    </span>
                  )}
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setIsInsightsOpen(true)}
                >
                  <BarChart3 className="w-4 h-4" />
                  View Insights
                </Button>
              </div>

              {/* Alerts List */}
              <div className="border border-border rounded-xl bg-card/60 max-h-[calc(65vh-180px)] overflow-y-auto spectra-scrollbar-wide">
                {videoNotifications.length === 0 ? (
                  <div className="p-4 flex flex-col items-center justify-center text-center text-sm text-muted-foreground gap-2 py-12">
                    <AlertTriangle className="w-8 h-8 text-muted-foreground/70" />
                    <span>No alerts for this video yet.</span>
                  </div>
                ) : (
                  videoNotifications.map((n) => {
                    const alertId = n.event_id ?? `${n.timestamp}-${n.alert}`;
                    const isExpanded = expandedAlertId === alertId;

                    return (
                      <div
                        key={alertId}
                        className="p-3 border-b border-border/60 last:border-b-0 bg-card/80 hover:bg-card transition-colors"
                      >
                        <div className="flex gap-3">
                          {/* Video thumbnail / clip preview */}
                          <div className="relative w-28 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                            {n.details?.presigned_url ? (
                              <video
                                className="w-full h-full object-cover"
                                src={n.details.presigned_url}
                                muted
                                playsInline
                                preload="metadata"
                                onMouseEnter={(e) => {
                                  const el = e.currentTarget;
                                  el.currentTime = 0;
                                  const playPromise = el.play();
                                  if (
                                    playPromise &&
                                    typeof playPromise.catch === 'function'
                                  ) {
                                    playPromise.catch(() => {});
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.pause();
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                                No clip
                              </div>
                            )}
                            {n.details?.presigned_url && (
                              <button
                                type="button"
                                className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white p-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAlertVideo({
                                    url: n.details!.presigned_url!,
                                    title: n.alert,
                                  });
                                  setIsAlertVideoOpen(true);
                                }}
                                aria-label="Open alert video"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Text content */}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-foreground line-clamp-2">
                                {n.alert}
                              </p>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatUtcTimestamp(n.timestamp)}
                              </span>
                            </div>

                            {n.details?.description && (
                              <div className="space-y-0.5">
                                <p
                                  className={
                                    'text-[11px] text-muted-foreground ' +
                                    (isExpanded ? '' : 'line-clamp-3')
                                  }
                                >
                                  {n.details.description}
                                </p>
                                {n.details.description.length > 120 && (
                                  <button
                                    type="button"
                                    className="text-[11px] font-medium text-primary hover:underline"
                                    onClick={() =>
                                      setExpandedAlertId(
                                        isExpanded ? null : alertId
                                      )
                                    }
                                  >
                                    {isExpanded ? 'Show less' : 'Read more'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Side - 60% - Chat */}
          <div className="flex min-h-0 w-[60%] flex-col pl-2">
            <h2 className="text-lg font-semibold mb-3">Chat</h2>
            <div className="flex-1 flex flex-col rounded-md overflow-hidden min-h-0 bg-background border border-gray-200 dark:border-gray-800 border-rounded-lg">
              {/* Messages */}
              <div className="flex-1 min-h-0">
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
                  <ChatMessages
                    ref={chatMessagesRef}
                    conversation={conversation}
                    isLoading={isLoading}
                    isStreaming={isStreaming}
                  />
                )}
              </div>

              {/* Input */}
              <div className="p-6 bg-background">
                <ChatInput
                  userQuery={userQuery}
                  onInputChange={handleInputChange}
                  onSend={handleSendMessage}
                  isLoading={isLoading}
                  isStreaming={isStreaming}
                  onOpenConfig={video ? () => setIsConfigOpen(true) : undefined}
                  onOpenTranscript={() => setIsTranscriptOpen(true)}
                  canConfigure={!!video}
                  hasConversation={
                    conversation.length > 0 || Boolean(userQuery.trim())
                  }
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
      <TranscriptModal
        isOpen={isTranscriptOpen}
        transcript={transcriptData?.getBatchTranscripts}
        onClose={() => setIsTranscriptOpen(false)}
      />

      {/* Batch Insights Dialog - removed, now inline */}

      {video ? (
        <ModelParametersForm
          isOpen={isConfigOpen}
          video={video!}
          processBatch={handleProcessBatch}
          onClose={() => setIsConfigOpen(false)}
          notifications={[]}
          viewedNotifications={new Set<string>()}
          onDeleteSuccess={() => {}}
          username="Unknown"
          mode="reanalyze"
        />
      ) : null}

      {/* Large alert video player */}
      <Dialog
        open={isAlertVideoOpen && !!activeAlertVideo}
        onOpenChange={(open) => {
          setIsAlertVideoOpen(open);
          if (!open) {
            setActiveAlertVideo(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              {activeAlertVideo?.title || 'Alert video'}
            </DialogTitle>
          </DialogHeader>
          {activeAlertVideo ? (
            <div className="mt-2">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <video
                  src={activeAlertVideo?.url || ''}
                  controls
                  className="w-full h-full object-contain bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Batch Insights Popover */}
      <BatchInsightsPopover
        open={isInsightsOpen}
        onOpenChange={setIsInsightsOpen}
        insights={insightsData?.getBatchInsights || null}
        batchName={video?.batchName}
        originalVideoUrl={
          video?.videoPresignedUrl || video?.batchCloudStreamPath || null
        }
      />
    </div>
  );
}