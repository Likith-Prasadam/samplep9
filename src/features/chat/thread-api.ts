export type ChatInferenceModality = 'live' | 'batch' | 'demo';

export type ChatThreadType =
  | 'live_camera'
  | 'batch_video'
  | 'connected_intelligence'
  | 'demo';

export interface ChatThreadSummary {
  thread_hash: string;
  thread_id?: string;
  thread_type?: string;
  inference_modality?: string;
  entity_hash?: string | null;
  entity_id?: number | null;
  thread_title?: string | null;
  title?: string | null;
  selected_source?: string | null;
  filters?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
  message_count?: number;
}

export interface ChatThreadsResponse {
  threads?: ChatThreadSummary[];
  total_count?: number;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  message_id?: string;
  tool_call_id?: string | null;
  tool_name?: string | null;
  created_at?: string;
}

export interface ChatHistoryResponse {
  thread_hash?: string;
  thread_id?: string;
  thread_type?: ChatThreadType;
  inference_modality?: ChatInferenceModality;
  entity_hash?: string | null;
  selected_source?: string | null;
  title?: string | null;
  thread_title?: string | null;
  filters?: Record<string, unknown> | null;
  messages?: ChatHistoryMessage[];
  message_count?: number;
}

const buildEndpoint = (chatApiUrl: string, path: 'threads' | 'history') => {
  const baseUrl = chatApiUrl.replace('/completions', `/${path}`);
  return new URL(baseUrl);
};

const compareFilters = (
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined
) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

const normalizeThreadSummary = (thread: ChatThreadSummary) => {
  const threadHash = thread.thread_hash ?? thread.thread_id;
  if (!threadHash) {
    return thread;
  }

  return {
    ...thread,
    thread_hash: threadHash,
    thread_id: threadHash,
    entity_hash: thread.entity_hash ?? thread.selected_source ?? null,
    thread_title: thread.thread_title ?? thread.title ?? null,
    title: thread.thread_title ?? thread.title ?? null,
  };
};

const pickLatestThread = (threads: ChatThreadSummary[] = []) => {
  return [...threads].sort((left, right) => {
    const leftTime = left.updated_at ? Date.parse(left.updated_at) : 0;
    const rightTime = right.updated_at ? Date.parse(right.updated_at) : 0;
    return rightTime - leftTime;
  })[0];
};

export const listChatThreads = async ({
  chatApiUrl,
  token,
  threadType,
  entityHash,
  selectedSource,
}: {
  chatApiUrl: string;
  token: string;
  threadType?: ChatThreadType;
  entityHash?: string | null;
  selectedSource?: string | null;
}) => {
  const url = buildEndpoint(chatApiUrl, 'threads');

  if (threadType) {
    url.searchParams.set('thread_type', threadType);
  }

  const resolvedEntityHash = entityHash ?? selectedSource;
  if (resolvedEntityHash) {
    url.searchParams.set('entity_hash', resolvedEntityHash);
    url.searchParams.set('selected_source', resolvedEntityHash);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return [] as ChatThreadSummary[];
  }

  const data = (await response.json()) as
    | ChatThreadsResponse
    | ChatThreadSummary[];
  const threads = Array.isArray(data) ? data : (data.threads ?? []);
  return threads.map(normalizeThreadSummary);
};

export const resolveChatThreadId = async ({
  chatApiUrl,
  token,
  threadType,
  inferenceModality,
  entityHash,
  selectedSource,
  threadTitle,
  title,
  preferredFilters,
}: {
  chatApiUrl: string;
  token: string;
  threadType: ChatThreadType;
  inferenceModality: ChatInferenceModality;
  entityHash?: string | null;
  selectedSource?: string | null;
  threadTitle?: string;
  title?: string;
  preferredFilters?: Record<string, unknown> | null;
}) => {
  const threads = await listChatThreads({
    chatApiUrl,
    token,
    threadType,
    entityHash,
    selectedSource,
  });

  const matchingThread = preferredFilters
    ? threads.find((thread) => compareFilters(thread.filters, preferredFilters))
    : undefined;

  const existingThread = matchingThread ?? pickLatestThread(threads);
  if (existingThread?.thread_hash) {
    return existingThread.thread_hash;
  }

  const url = buildEndpoint(chatApiUrl, 'threads');
  const resolvedEntityHash = entityHash ?? selectedSource;
  const resolvedThreadTitle = threadTitle ?? title;
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inference_modality: inferenceModality,
      thread_type: threadType,
      ...(resolvedEntityHash ? { entity_hash: resolvedEntityHash } : {}),
      ...(resolvedEntityHash ? { selected_source: resolvedEntityHash } : {}),
      ...(resolvedThreadTitle ? { thread_title: resolvedThreadTitle } : {}),
      ...(resolvedThreadTitle ? { title: resolvedThreadTitle } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat thread: ${response.status}`);
  }

  const data = (await response.json()) as {
    thread_hash?: string;
    thread_id?: string;
  };
  const threadHash = data.thread_hash ?? data.thread_id;
  if (!threadHash) {
    throw new Error('Chat thread creation did not return a thread hash');
  }

  return threadHash;
};

export const createChatThread = async ({
  chatApiUrl,
  token,
  threadType,
  inferenceModality,
  entityHash,
  selectedSource,
  threadTitle,
  title,
}: {
  chatApiUrl: string;
  token: string;
  threadType: ChatThreadType;
  inferenceModality: ChatInferenceModality;
  entityHash?: string | null;
  selectedSource?: string | null;
  threadTitle?: string;
  title?: string;
}) => {
  const url = buildEndpoint(chatApiUrl, 'threads');
  const resolvedEntityHash = entityHash ?? selectedSource;
  const resolvedThreadTitle = threadTitle ?? title;
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inference_modality: inferenceModality,
      thread_type: threadType,
      ...(resolvedEntityHash ? { entity_hash: resolvedEntityHash } : {}),
      ...(resolvedEntityHash ? { selected_source: resolvedEntityHash } : {}),
      ...(resolvedThreadTitle ? { thread_title: resolvedThreadTitle } : {}),
      ...(resolvedThreadTitle ? { title: resolvedThreadTitle } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat thread: ${response.status}`);
  }

  const data = (await response.json()) as {
    thread_hash?: string;
    thread_id?: string;
  };
  const threadHash = data.thread_hash ?? data.thread_id;
  if (!threadHash) {
    throw new Error('Chat thread creation did not return a thread hash');
  }

  return threadHash;
};

export const fetchChatHistoryByThreadId = async ({
  chatApiUrl,
  token,
  threadId,
}: {
  chatApiUrl: string;
  token: string;
  threadId: string;
}) => {
  const url = buildEndpoint(chatApiUrl, 'history');
  url.searchParams.set('thread_hash', threadId);
  url.searchParams.set('thread_id', threadId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch chat history: ${response.status}`);
  }

  return (await response.json()) as ChatHistoryResponse;
};

export const deleteChatHistoryByThreadId = async ({
  chatApiUrl,
  token,
  threadId,
}: {
  chatApiUrl: string;
  token: string;
  threadId: string;
}) => {
  const url = buildEndpoint(chatApiUrl, 'history');
  url.searchParams.set('thread_hash', threadId);
  url.searchParams.set('thread_id', threadId);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete chat history: ${response.status}`);
  }

  return response.json().catch(() => null);
};

export const deleteChatThreadById = async ({
  chatApiUrl,
  token,
  threadId,
}: {
  chatApiUrl: string;
  token: string;
  threadId: string;
}) => {
  const url = buildEndpoint(chatApiUrl, 'threads');
  url.searchParams.set('thread_hash', threadId);

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete chat thread: ${response.status}`);
  }

  return response.json().catch(() => null);
};
