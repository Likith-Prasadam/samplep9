import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@apollo/client';
import { toast } from 'sonner';

import { GET_ORG_MODELS } from '@/graphql/mutations';
import {
  GET_BATCHES_VIDEOS,
  GET_BATCH_FILTER_VALUES,
  type GetBatchFilterValuesResponse,
} from '@/graphql/batch_mutations';
import {
  GET_CAMS_QUERY,
  type CamsFilterInput,
  type GetCamsResponse,
  type GetCamsVariables,
} from '@/graphql/cameras_queries';
import {
  GET_CAM_FILTER_VALUES,
  type GetCamFilterValuesResponse,
} from '@/graphql/cameras_mutation';
import { getUserSession } from '@/lib/ssemanager';
import { getActiveCohortHash } from '@/utils/cohort-utils';
import {
  buildHybridChatPayload,
  runBackendChatStream,
} from '@/features/chat/chat-agent';
import {
  createChatThread,
  deleteChatThreadById,
  fetchChatHistoryByThreadId,
  listChatThreads,
  type ChatThreadSummary,
} from '@/features/chat/thread-api';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  resetFilters as resetConnectedIntelligenceFilters,
  setFilters as setConnectedIntelligenceFilters,
} from '@/store/slices/connected-intelligence-slice';
import {
  resetChatPanel,
  selectChatPanelState,
  setChatPanelActiveChat,
  setChatPanelDraft,
  setChatPanelNewConversation,
} from '@/store/slices/chat-panel-slice';
import { connectedIntelligenceSuggestedPrompts } from '../utils/connected-intelligence-data';
import type {
  ConnectedIntelligenceConversationThread,
  ConnectedIntelligenceCheckboxOption,
  ConnectedIntelligenceClip,
  ConnectedIntelligenceFilterOptions,
  ConnectedIntelligenceMessage,
} from '../types';

interface OrgModelsResponse {
  getOrgModels: Array<{
    modelHash: string;
    modelName: string;
    modelType: string;
  }>;
}

interface BatchVideoItem {
  batchHash: string;
  batchName?: string;
  duration?: number;
  thumbnailPresignedUrl?: string;
  videoPresignedUrl?: string;
  videoPresignedUrlExpiry?: string;
  createdAt?: string;
}

interface BatchVideosResponse {
  getBatchVideos: {
    totalCount: number;
    batches: BatchVideoItem[];
  };
}

interface HistoryMessageItem {
  message_id?: string;
  role?: string;
  content?: unknown;
  created_at?: string;
  tool_call_id?: string | null;
  tool_name?: string | null;
}

type ConnectedIntelligenceModality = 'live' | 'batch';

interface UseConnectedIntelligenceComposerOptions {
  cohortHashOverride?: string | null;
}

const normalizeMessageContent = (content: unknown) => {
  if (typeof content !== 'string') {
    return String(content ?? '');
  }

  return content.replace(/\\n/g, '\n');
};

const escapeToolAttr = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const escapeToolText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const appendToolThinkingTag = (
  content: string,
  toolCallId: string,
  toolName: string,
  description: string
) => {
  const toolTag = `<tool-thinking tool_call_id="${escapeToolAttr(toolCallId)}" tool="${escapeToolAttr(toolName)}">${escapeToolText(description)}</tool-thinking>`;

  return `${content}${content ? '\n\n' : ''}${toolTag}`;
};

const appendToolResultTag = (
  content: string,
  toolCallId: string,
  toolName: string
) => {
  const toolTag = `<tool-result tool_call_id="${escapeToolAttr(toolCallId)}" tool="${escapeToolAttr(toolName)}" status="complete"></tool-result>`;

  return `${content}${content ? '\n\n' : ''}${toolTag}`;
};

const normalizeHistoryAssistantContent = (item: HistoryMessageItem) => {
  const role = item.role === 'assistant' ? 'assistant' : 'user';
  let content = normalizeMessageContent(item.content);

  if (role === 'assistant' && content) {
    content = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
  }

  const toolCallId = item.tool_call_id?.trim();
  const toolName = item.tool_name?.trim();

  if (role === 'assistant' && (toolCallId || toolName)) {
    const normalizedToolId = toolCallId || toolName || 'tool';
    const normalizedToolName = toolName || 'tool';

    if (!content.trim()) {
      content = appendToolResultTag('', normalizedToolId, normalizedToolName);
    } else if (
      !content.includes('<tool-thinking') &&
      !content.includes('<tool-result')
    ) {
      content = appendToolThinkingTag(
        '',
        normalizedToolId,
        normalizedToolName,
        content
      );
    }
  }

  return content;
};

const extractHistoryMessages = (data: unknown): HistoryMessageItem[] => {
  if (Array.isArray(data)) {
    return data as HistoryMessageItem[];
  }

  if (!data || typeof data !== 'object') {
    return [];
  }

  const record = data as Record<string, unknown>;

  if (Array.isArray(record.messages)) {
    return record.messages as HistoryMessageItem[];
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.messages)) {
      return nested.messages as HistoryMessageItem[];
    }
  }

  return [];
};

const mergeConsecutiveAssistantMessages = (
  items: ConnectedIntelligenceMessage[]
) => {
  return items.reduce<ConnectedIntelligenceMessage[]>((accumulator, item) => {
    const lastItem = accumulator[accumulator.length - 1];

    if (
      lastItem &&
      lastItem.role === 'assistant' &&
      item.role === 'assistant'
    ) {
      accumulator[accumulator.length - 1] = {
        ...lastItem,
        content: `${lastItem.content}\n${item.content}`.trim(),
      };
      return accumulator;
    }

    accumulator.push(item);
    return accumulator;
  }, []);
};

const mapOptions = (
  values: string[] = []
): ConnectedIntelligenceCheckboxOption[] => {
  const uniqueByNormalized = new Map<string, string>();

  for (const rawValue of values) {
    const value = rawValue.trim();
    if (!value) continue;

    const normalizedKey = value.toLocaleLowerCase();
    if (!uniqueByNormalized.has(normalizedKey)) {
      uniqueByNormalized.set(normalizedKey, value);
    }
  }

  return Array.from(uniqueByNormalized.values())
    .sort((left, right) => left.localeCompare(right))
    .map((value) => ({ value, label: value }));
};

const toDurationLabel = (duration?: number) => {
  if (!duration || duration <= 0) return '-';
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const mapConversationThread = (
  thread: ChatThreadSummary
): ConnectedIntelligenceConversationThread => ({
  id: thread.thread_hash ?? thread.thread_id ?? '',
  title:
    thread.thread_title?.trim() ||
    thread.title?.trim() ||
    thread.entity_hash?.trim() ||
    'Connected Intelligence Chat',
  updatedAt: thread.updated_at,
  messageCount: thread.message_count,
  modality: thread.inference_modality,
});

let connectedIntelligenceThreadsRequest: Promise<
  ConnectedIntelligenceConversationThread[]
> | null = null;

const connectedIntelligenceHistoryRequests = new Map<
  string,
  Promise<ConnectedIntelligenceMessage[]>
>();

export function useConnectedIntelligenceComposer(
  options: UseConnectedIntelligenceComposerOptions = {}
) {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(
    (state) => state.connectedIntelligence.filters
  );

  const chatApiUrl = import.meta.env.VITE_CHAT_API_URL;
  const cohortHash = options.cohortHashOverride || getActiveCohortHash();
  const panelKey = useMemo(
    () => `connected-intelligence:${cohortHash || 'global'}`,
    [cohortHash]
  );
  const chatPanelState = useAppSelector((state) =>
    selectChatPanelState(state, panelKey)
  );

  const [message, setMessage] = useState(chatPanelState.draft);
  const [conversation, setConversation] = useState<
    ConnectedIntelligenceMessage[]
  >([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [selectedModelHash, setSelectedModelHash] = useState<string>('');
  const [zoneDraft, setZoneDraft] = useState('');
  const [threadId, setThreadId] = useState<string | null>(
    chatPanelState.activeChatId
  );
  const latestRequestedThreadRef = useRef<string | null>(threadId);
  const bootstrapThreadIdRef = useRef<string | null>(threadId);
  const [conversationThreads, setConversationThreads] = useState<
    ConnectedIntelligenceConversationThread[]
  >([]);
  const [deletingConversationIds, setDeletingConversationIds] = useState<
    Set<string>
  >(new Set());
  const [isConversationThreadsLoading, setIsConversationThreadsLoading] =
    useState(false);

  const { data: modelsData } = useQuery<OrgModelsResponse>(GET_ORG_MODELS, {
    fetchPolicy: 'network-only',
  });

  const { data: camFilterValuesData, loading: camFilterValuesLoading } =
    useQuery<GetCamFilterValuesResponse>(GET_CAM_FILTER_VALUES, {
      variables: { cohortHash },
      skip: !cohortHash,
      fetchPolicy: 'network-only',
      pollInterval: 30000,
    });

  const { data: batchFilterValuesData, loading: batchFilterValuesLoading } =
    useQuery<GetBatchFilterValuesResponse>(GET_BATCH_FILTER_VALUES);

  const cameraFilterVariables = useMemo<GetCamsVariables | undefined>(() => {
    if (!cohortHash) {
      return undefined;
    }

    const cameraFilters: CamsFilterInput = {};

    const selectedCities = Array.from(
      new Set([
        ...(filters.city.trim() ? [filters.city.trim()] : []),
        ...filters.cities,
      ])
    );

    if (filters.cameraTypes.length > 0) {
      cameraFilters.camTypes = filters.cameraTypes;
    }

    if (filters.resolutions.length > 0) {
      // Backend currently expects a singular resolution filter field.
      cameraFilters.camResolution = filters.resolutions[0];
    }

    if (filters.cameraTags.length > 0) {
      cameraFilters.camTags = filters.cameraTags;
    }

    if (filters.zones.length > 0) {
      cameraFilters.camPlacementZones = filters.zones;
    }

    if (selectedCities.length > 0) {
      cameraFilters.camCities = selectedCities;
    }

    if (filters.zipcodes.length > 0) {
      cameraFilters.camZipcodes = filters.zipcodes;
    }

    return {
      cohortHash,
      page: 1,
      itemsPerPage: 100,
      sortBy: 'created_at',
      sortOrder: 'desc',
      filters:
        Object.keys(cameraFilters).length > 0 ? cameraFilters : undefined,
    };
  }, [cohortHash, filters]);

  const { data: camerasData, loading: camerasLoading } = useQuery<
    GetCamsResponse,
    GetCamsVariables
  >(GET_CAMS_QUERY, {
    variables: cameraFilterVariables,
    skip: !cohortHash,
    fetchPolicy: 'network-only',
    pollInterval: 30000,
  });

  const batchFilterVariables = useMemo(() => {
    const batchFilters: Record<string, unknown> = {};

    const selectedCities = Array.from(
      new Set([
        ...(filters.city.trim() ? [filters.city.trim()] : []),
        ...filters.cities,
      ])
    );

    if (filters.zones.length > 0) {
      batchFilters.batchPlacementZones = filters.zones;
    }

    if (selectedCities.length > 0) {
      batchFilters.batchCities = selectedCities;
    }

    if (filters.zipcodes.length > 0) {
      batchFilters.batchZipcodes = filters.zipcodes;
    }

    if (filters.cameraTags.length > 0) {
      batchFilters.batchTags = filters.cameraTags;
    }

    return {
      page: 1,
      itemsPerPage: 3,
      sortBy: 'created_at',
      sortOrder: 'desc',
      filters: batchFilters,
    };
  }, [filters]);

  const { data: batchVideosData, loading: batchVideosLoading } =
    useQuery<BatchVideosResponse>(GET_BATCHES_VIDEOS, {
      variables: batchFilterVariables,
    });

  const activeCameraCount = camerasData?.getCams?.totalCount ?? 0;
  const cameraNamesInScope = useMemo(() => {
    const cameraItems = camerasData?.getCams?.cams ?? [];
    const uniqueNames = new Set<string>();

    for (const camera of cameraItems) {
      const cameraName = (camera.camName || camera.camHash || '').trim();
      if (cameraName) {
        uniqueNames.add(cameraName);
      }
    }

    return Array.from(uniqueNames).sort((left, right) =>
      left.localeCompare(right)
    );
  }, [camerasData]);
  const batchItems = useMemo(
    () => batchVideosData?.getBatchVideos?.batches ?? [],
    [batchVideosData]
  );

  const selectedModality: ConnectedIntelligenceModality =
    activeCameraCount > 0 ? 'live' : 'batch';

  const contextClips = useMemo<ConnectedIntelligenceClip[]>(() => {
    return batchItems.map((batch) => ({
      id: batch.batchHash,
      title: batch.batchName || batch.batchHash,
      subtitle: batch.createdAt
        ? new Date(batch.createdAt).toLocaleString()
        : '',
      duration: toDurationLabel(batch.duration),
      imageUrl: batch.thumbnailPresignedUrl,
      videoUrl: batch.videoPresignedUrl,
      videoUrlExpiry: batch.videoPresignedUrlExpiry,
      sourceHash: batch.batchHash,
      sourceType: 'batch',
      imgClass: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700',
    }));
  }, [batchItems]);

  const filterOptions = useMemo<ConnectedIntelligenceFilterOptions>(() => {
    const camValues = camFilterValuesData?.getCamFilterValues;
    const batchValues = batchFilterValuesData?.getBatchFilterValues;

    const zoneValues = [
      ...(camValues?.camPlacementZones ?? []),
      ...(batchValues?.batchPlacementZones ?? []),
    ];

    const cityValues = [
      ...(camValues?.camCities ?? []),
      ...(batchValues?.batchCities ?? []),
    ];

    const zipcodeValues = [
      ...(camValues?.camZipcodes ?? []),
      ...(batchValues?.batchZipcodes ?? []),
    ];

    const uniqueZones = Array.from(new Set(zoneValues));
    const uniqueCities = Array.from(new Set(cityValues));
    const uniqueZipcodes = Array.from(new Set(zipcodeValues));

    return {
      zones: mapOptions(uniqueZones),
      cities: mapOptions(uniqueCities),
      zipcodes: mapOptions(uniqueZipcodes),
      cameraTypes: mapOptions(camValues?.camTypes ?? []),
      resolutions: mapOptions(camValues?.camResolutions ?? []),
      cameraTags: mapOptions(
        camValues?.camTags ?? batchValues?.batchTags ?? []
      ),
    };
  }, [camFilterValuesData, batchFilterValuesData]);

  useEffect(() => {
    const chatModels = (modelsData?.getOrgModels ?? []).filter((model) => {
      return model.modelType === 'chat';
    });

    if (
      chatModels.length > 0 &&
      (!selectedModelHash ||
        !chatModels.some((model) => model.modelHash === selectedModelHash))
    ) {
      setSelectedModelHash(chatModels[0].modelHash);
    }
  }, [modelsData, selectedModelHash]);

  const updateMultiFilter = useCallback(
    (
      key:
        | 'cameraTypes'
        | 'resolutions'
        | 'cameraTags'
        | 'zones'
        | 'cities'
        | 'zipcodes',
      value: string
    ) => {
      const exists = filters[key].includes(value);
      dispatch(
        setConnectedIntelligenceFilters({
          ...filters,
          [key]: exists
            ? filters[key].filter((item) => item !== value)
            : [...filters[key], value],
        })
      );
    },
    [dispatch, filters]
  );

  const setSingleFilter = useCallback(
    (
      key:
        | 'city'
        | 'subzone'
        | 'cameraNames'
        | 'cameraHashes'
        | 'ipAddress'
        | 'analysisTimeframe',
      value: string
    ) => {
      dispatch(
        setConnectedIntelligenceFilters({
          ...filters,
          [key]: value,
        })
      );
    },
    [dispatch, filters]
  );

  const addNextZone = useCallback(() => {
    const firstAvailableZone = filterOptions.zones.find(
      (zoneOption) => !filters.zones.includes(zoneOption.value)
    );

    if (!firstAvailableZone) {
      const trimmedZone = zoneDraft.trim();
      if (!trimmedZone || filters.zones.includes(trimmedZone)) return;

      dispatch(
        setConnectedIntelligenceFilters({
          ...filters,
          zones: [...filters.zones, trimmedZone],
        })
      );
      setZoneDraft('');
      return;
    }

    dispatch(
      setConnectedIntelligenceFilters({
        ...filters,
        zones: [...filters.zones, firstAvailableZone.value],
      })
    );
  }, [dispatch, filterOptions.zones, filters, zoneDraft]);

  const addZoneFromDraft = useCallback(() => {
    const trimmedZone = zoneDraft.trim();
    if (!trimmedZone || filters.zones.includes(trimmedZone)) {
      return;
    }

    dispatch(
      setConnectedIntelligenceFilters({
        ...filters,
        zones: [...filters.zones, trimmedZone],
      })
    );
    setZoneDraft('');
  }, [dispatch, filters, zoneDraft]);

  const removeZone = useCallback(
    (zone: string) => {
      dispatch(
        setConnectedIntelligenceFilters({
          ...filters,
          zones: filters.zones.filter((selectedZone) => selectedZone !== zone),
        })
      );
    },
    [dispatch, filters]
  );

  const buildChatFilters = useCallback(() => {
    const mappedFilters: Record<string, string[]> = {};

    if (filters.zones.length > 0) {
      mappedFilters.placement_zones = filters.zones;
    }

    if (filters.city.trim()) {
      mappedFilters.cities = [filters.city.trim()];
    }

    if (filters.cities.length > 0) {
      mappedFilters.cities = Array.from(
        new Set([...(mappedFilters.cities ?? []), ...filters.cities])
      );
    }

    if (filters.cameraTypes.length > 0) {
      mappedFilters.types = filters.cameraTypes;
    }

    if (filters.cameraTags.length > 0) {
      mappedFilters.tags = filters.cameraTags;
    }

    if (filters.zipcodes.length > 0) {
      mappedFilters.zipcodes = filters.zipcodes;
    }

    return Object.keys(mappedFilters).length > 0 ? mappedFilters : null;
  }, [filters]);

  useEffect(() => {
    setMessage(chatPanelState.draft);
    setThreadId(chatPanelState.activeChatId);
  }, [chatPanelState.activeChatId, chatPanelState.draft]);

  const updateMessage = useCallback(
    (value: string) => {
      setMessage(value);
      dispatch(setChatPanelDraft({ panelKey, draft: value }));
    },
    [dispatch, panelKey]
  );

  const updateThreadId = useCallback(
    (value: string | null) => {
      latestRequestedThreadRef.current = value;
      bootstrapThreadIdRef.current = value;
      setThreadId(value);
      dispatch(setChatPanelActiveChat({ panelKey, activeChatId: value }));
      dispatch(
        setChatPanelNewConversation({
          panelKey,
          isNewConversation: value === null,
        })
      );
    },
    [dispatch, panelKey]
  );

  const loadConversationThreads = useCallback(async () => {
    if (!chatApiUrl) {
      setConversationThreads([]);
      return [] as ConnectedIntelligenceConversationThread[];
    }

    const { token } = getUserSession();
    if (!token) {
      setConversationThreads([]);
      return [] as ConnectedIntelligenceConversationThread[];
    }

    const request =
      connectedIntelligenceThreadsRequest ??
      (async () => {
        const threads = await listChatThreads({
          chatApiUrl,
          token,
          threadType: 'connected_intelligence',
        });

        const sortedThreads = [...threads].sort((left, right) => {
          const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
          const rightTime = right.updated_at ? Date.parse(right.updated_at) : 0;
          return rightTime - leftTime;
        });

        const dedupedThreads = sortedThreads.filter(
          (thread, index, allThreads) => {
            const currentId = thread.thread_hash ?? thread.thread_id;
            if (!currentId) return false;

            return (
              allThreads.findIndex((candidate) => {
                const candidateId =
                  candidate.thread_hash ?? candidate.thread_id;
                return candidateId === currentId;
              }) === index
            );
          }
        );

        return dedupedThreads.map(mapConversationThread);
      })();

    connectedIntelligenceThreadsRequest = request;
    setIsConversationThreadsLoading(true);

    try {
      const mappedThreads = await request;
      setConversationThreads(mappedThreads);
      return mappedThreads;
    } catch {
      setConversationThreads([]);
      return [] as ConnectedIntelligenceConversationThread[];
    } finally {
      if (connectedIntelligenceThreadsRequest === request) {
        connectedIntelligenceThreadsRequest = null;
      }
      setIsConversationThreadsLoading(false);
    }
  }, [chatApiUrl]);

  const fetchHistory = useCallback(
    async (threadIdToLoad: string) => {
      if (!chatApiUrl) return;

      const { token } = getUserSession();
      if (!token || !threadIdToLoad) return;

      const existingRequest =
        connectedIntelligenceHistoryRequests.get(threadIdToLoad);
      const request =
        existingRequest ??
        (async () => {
          const data = await fetchChatHistoryByThreadId({
            chatApiUrl,
            token,
            threadId: threadIdToLoad,
          });

          const historyMessages = extractHistoryMessages(data)
            .map<ConnectedIntelligenceMessage>((item, index) => ({
              id: item.message_id || `${Date.now()}-${index}-${Math.random()}`,
              role: item.role === 'assistant' ? 'assistant' : 'user',
              content: normalizeHistoryAssistantContent(item),
              timestamp: item.created_at || new Date().toISOString(),
              toolCallId: item.tool_call_id || null,
              toolName: item.tool_name || null,
            }))
            .filter((item) => item.content.trim().length > 0);

          return mergeConsecutiveAssistantMessages(historyMessages);
        })();

      if (!existingRequest) {
        connectedIntelligenceHistoryRequests.set(threadIdToLoad, request);
      }

      setIsHistoryLoading(true);

      try {
        const resolvedHistory = await request;
        if (latestRequestedThreadRef.current === threadIdToLoad) {
          setConversation(resolvedHistory);
        }
      } catch {
        // Silent fallback to empty history.
      } finally {
        const pendingRequest =
          connectedIntelligenceHistoryRequests.get(threadIdToLoad);
        if (pendingRequest === request) {
          connectedIntelligenceHistoryRequests.delete(threadIdToLoad);
        }
        if (latestRequestedThreadRef.current === threadIdToLoad) {
          setIsHistoryLoading(false);
        }
      }
    },
    [chatApiUrl]
  );

  const selectConversation = useCallback(
    (selectedThreadId: string) => {
      if (!selectedThreadId || selectedThreadId === threadId) {
        return;
      }

      latestRequestedThreadRef.current = selectedThreadId;
      setIsHistoryLoading(true);
      setChatError(null);
      dispatch(resetConnectedIntelligenceFilters());
      updateThreadId(selectedThreadId);
      setConversation([]);
    },
    [dispatch, threadId, updateThreadId]
  );

  const deleteConversation = useCallback(
    async (threadIdToDelete: string) => {
      if (!chatApiUrl) {
        return;
      }

      setDeletingConversationIds((prev) => {
        const next = new Set(prev);
        next.add(threadIdToDelete);
        return next;
      });

      const { token } = getUserSession();
      if (!token) {
        setDeletingConversationIds((prev) => {
          const next = new Set(prev);
          next.delete(threadIdToDelete);
          return next;
        });
        return;
      }

      try {
        await deleteChatThreadById({
          chatApiUrl,
          token,
          threadId: threadIdToDelete,
        });
        setConversationThreads((prev) =>
          prev.filter((thread) => thread.id !== threadIdToDelete)
        );
        if (threadId === threadIdToDelete) {
          setConversation([]);
          updateThreadId(null);
        }
        toast.success('Conversation deleted');
      } catch {
        toast.error('Failed to delete conversation');
      } finally {
        setDeletingConversationIds((prev) => {
          const next = new Set(prev);
          next.delete(threadIdToDelete);
          return next;
        });
      }
    },
    [chatApiUrl, threadId, updateThreadId]
  );

  const startNewConversation = useCallback(() => {
    if (isStreaming) {
      return;
    }

    dispatch(resetChatPanel({ panelKey }));
    dispatch(resetConnectedIntelligenceFilters());
    updateMessage('');
    setChatError(null);
    latestRequestedThreadRef.current = null;
    setIsHistoryLoading(false);
    setConversation([]);
    updateThreadId(null);
    dispatch(
      setChatPanelNewConversation({ panelKey, isNewConversation: true })
    );
  }, [dispatch, isStreaming, panelKey, updateMessage, updateThreadId]);

  const touchConversationThread = useCallback(
    (threadIdToTouch: string, shouldCreate: boolean) => {
      setConversationThreads((prev) => {
        const now = new Date().toISOString();
        const existingThreadIndex = prev.findIndex(
          (thread) => thread.id === threadIdToTouch
        );

        if (existingThreadIndex >= 0) {
          const nextThreads = [...prev];
          nextThreads[existingThreadIndex] = {
            ...nextThreads[existingThreadIndex],
            updatedAt: now,
          };
          return nextThreads.sort((left, right) => {
            const leftTime = left.updatedAt ? Date.parse(left.updatedAt) : 0;
            const rightTime = right.updatedAt ? Date.parse(right.updatedAt) : 0;
            return rightTime - leftTime;
          });
        }

        if (!shouldCreate) {
          return prev;
        }

        return [
          {
            id: threadIdToTouch,
            title: 'Connected intelligence',
            updatedAt: now,
            modality: selectedModality,
          },
          ...prev,
        ];
      });
    },
    [selectedModality]
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapConversationThreads = async () => {
      const threads = await loadConversationThreads();
      if (!isMounted || threads.length === 0) return;

      const bootstrapThreadId = bootstrapThreadIdRef.current;
      if (chatPanelState.isNewConversation && !bootstrapThreadId) {
        return;
      }

      if (
        !bootstrapThreadId ||
        !threads.some((thread) => thread.id === bootstrapThreadId)
      ) {
        updateThreadId(threads[0].id);
      }
    };

    void bootstrapConversationThreads();

    return () => {
      isMounted = false;
    };
  }, [
    chatPanelState.isNewConversation,
    loadConversationThreads,
    updateThreadId,
  ]);

  useEffect(() => {
    if (!threadId) return;
    if (isStreaming) return;
    if (conversation.length > 0) return;

    void fetchHistory(threadId);
  }, [conversation.length, fetchHistory, isStreaming, threadId]);

  const sendMessage = useCallback(async () => {
    if (!message.trim() || isStreaming || !chatApiUrl) {
      return;
    }

    if (!selectedModelHash) {
      setChatError('No chat model is configured for this account.');
      return;
    }

    const { token } = getUserSession();
    if (!token) {
      setChatError('You are not authenticated. Please log in again.');
      return;
    }

    setChatError(null);
    setIsStreaming(true);

    const userText = message.trim();
    const now = new Date().toISOString();
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;
    const hadActiveThread = Boolean(threadId);

    setConversation((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: userText,
        timestamp: now,
      },
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: now,
      },
    ]);

    updateMessage('');

    let activeThreadId = threadId;

    if (!activeThreadId) {
      try {
        activeThreadId = await createChatThread({
          chatApiUrl,
          token,
          threadType: 'connected_intelligence',
          inferenceModality: selectedModality,
          title: 'Connected intelligence',
        });
        updateThreadId(activeThreadId);
        touchConversationThread(activeThreadId, true);
      } catch {
        setChatError('Unable to start a new chat thread. Please retry.');
        setConversation((prev) =>
          prev.map((item) =>
            item.id === assistantMessageId
              ? {
                  ...item,
                  content:
                    'Error: Unable to start a new chat thread. Please retry.',
                }
              : item
          )
        );
        setIsStreaming(false);
        return;
      }
    }

    try {
      const liveWindowMinutes =
        Number.parseInt(filters.analysisTimeframe, 10) || 60;
      const chatFilters = buildChatFilters();
      const payload = buildHybridChatPayload({
        threadHash: activeThreadId,
        modelHash: selectedModelHash,
        message: userText,
        modelType: 'chat',
        inferenceModality: selectedModality,
        liveWindowMinutes,
        filters: chatFilters,
      });

      let fullAssistantText = '';

      await runBackendChatStream(
        {
          chatApiUrl,
          token,
          payload,
        },
        {
          onTextDelta: ({ delta }) => {
            fullAssistantText += delta;
            setConversation((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? { ...item, content: fullAssistantText }
                  : item
              )
            );
          },
          onToolCallStart: ({ toolCallId, toolCallName, description }) => {
            const toolName = toolCallName || 'tool';
            const normalizedToolId = toolCallId || `${toolName}-${Date.now()}`;
            const thinkingText = description || `Using ${toolName}...`;

            fullAssistantText = appendToolThinkingTag(
              fullAssistantText,
              normalizedToolId,
              toolName,
              thinkingText
            );

            setConversation((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? { ...item, content: fullAssistantText }
                  : item
              )
            );
          },
          onToolCallEnd: ({ toolCallId, toolCallName }) => {
            const toolName = toolCallName || 'tool';
            const normalizedToolId = toolCallId || `${toolName}-${Date.now()}`;

            fullAssistantText = appendToolResultTag(
              fullAssistantText,
              normalizedToolId,
              toolName
            );

            setConversation((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId
                  ? { ...item, content: fullAssistantText }
                  : item
              )
            );
          },
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to get completion from chat service.';

      setChatError(errorMessage);
      setConversation((prev) =>
        prev.map((item) =>
          item.id === assistantMessageId
            ? {
                ...item,
                content: `Error: ${errorMessage}`,
              }
            : item
        )
      );
    } finally {
      if (activeThreadId) {
        touchConversationThread(activeThreadId, !hadActiveThread);
      }
      setIsStreaming(false);
    }
  }, [
    buildChatFilters,
    chatApiUrl,
    filters.analysisTimeframe,
    isStreaming,
    message,
    selectedModality,
    selectedModelHash,
    threadId,
    touchConversationThread,
    updateMessage,
    updateThreadId,
  ]);

  const sendSuggestedPrompt = useCallback(
    async (prompt: string) => {
      updateMessage(prompt);
      await Promise.resolve();
    },
    [updateMessage]
  );

  return {
    message,
    setMessage: updateMessage,
    suggestedPrompts: connectedIntelligenceSuggestedPrompts,
    filters,
    filterOptions,
    zoneDraft,
    setZoneDraft,
    updateMultiFilter,
    setSingleFilter,
    addNextZone,
    addZoneFromDraft,
    removeZone,
    activeCameraCount,
    cameraNamesInScope,
    contextClips,
    conversation,
    conversationThreads,
    deletingConversationIds,
    activeConversationId: threadId,
    selectConversation,
    sendMessage,
    startNewConversation,
    deleteConversation,
    sendSuggestedPrompt,
    chatError,
    isStreaming,
    isHistoryLoading,
    isConversationThreadsLoading,
    isFiltersLoading:
      camFilterValuesLoading ||
      batchFilterValuesLoading ||
      camerasLoading ||
      batchVideosLoading,
    selectedModality,
    models: (modelsData?.getOrgModels ?? []).filter(
      (model) => model.modelType === 'chat'
    ),
    selectedModel: selectedModelHash,
    onModelChange: setSelectedModelHash,
    modelsLoading: !modelsData,
  };
}
