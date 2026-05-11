type JsonRecord = Record<string, unknown>;

export interface BuildHybridChatPayloadOptions {
  threadHash: string;
  modelHash: string;
  message: string;
  modelType?: string;
  stream?: boolean;
  modelName?: string;
  inferenceModality?: string;
  liveWindowMinutes?: number;
  filters?: JsonRecord | null;
  runId?: string;
  messages?: Array<JsonRecord>;
  state?: JsonRecord;
  forwardedProps?: JsonRecord;
  context?: unknown[];
  tools?: unknown[];
}

export const buildHybridChatPayload = ({
  threadHash,
  modelHash,
  message,
  modelType = 'chat',
  stream = true,
  modelName,
  inferenceModality,
  liveWindowMinutes,
  filters,
  runId = `run-${Date.now()}`,
  messages,
  state,
  forwardedProps,
  context,
  tools,
}: BuildHybridChatPayloadOptions): JsonRecord => {
  const baseState: JsonRecord = {
    thread_hash: threadHash,
    threadId: threadHash,
    model_hash: modelHash,
    message,
    model_type: modelType,
    stream,
    ...(modelName ? { model_name: modelName } : {}),
    ...(inferenceModality ? { inference_modality: inferenceModality } : {}),
    ...(liveWindowMinutes !== undefined
      ? { live_window_minutes: liveWindowMinutes }
      : {}),
    ...(filters ? { filters } : {}),
    ...(state ?? {}),
  };

  const baseForwardedProps: JsonRecord = {
    thread_hash: threadHash,
    threadId: threadHash,
    model_hash: modelHash,
    ...(modelName ? { model_name: modelName } : {}),
    ...(inferenceModality ? { inference_modality: inferenceModality } : {}),
    ...(liveWindowMinutes !== undefined
      ? { live_window_minutes: liveWindowMinutes }
      : {}),
    ...(filters ? { filters } : {}),
    ...(forwardedProps ?? {}),
  };

  return {
    thread_hash: threadHash,
    threadId: threadHash,
    thread_id: threadHash,
    model_hash: modelHash,
    model_type: modelType,
    message,
    stream,
    ...(modelName ? { model_name: modelName } : {}),
    ...(inferenceModality ? { inference_modality: inferenceModality } : {}),
    ...(liveWindowMinutes !== undefined
      ? { live_window_minutes: liveWindowMinutes }
      : {}),
    ...(filters ? { filters } : {}),
    runId,
    run_id: runId,
    messages: messages ?? [
      {
        id: runId,
        role: 'user',
        content: message,
      },
    ],
    state: baseState,
    forwardedProps: baseForwardedProps,
    forwarded_props: baseForwardedProps,
    context: Array.isArray(context) ? context : [],
    tools: tools ?? [],
  };
};

export interface ChatAgentRunRequest {
  chatApiUrl: string;
  token: string;
  payload: JsonRecord;
  signal?: AbortSignal;
}

export interface ChatAgentRunStartedEvent {
  runId?: string;
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentTextMessageStartEvent {
  messageId?: string;
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentTextDeltaEvent {
  delta: string;
  messageId?: string;
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentTextMessageEndEvent {
  messageId?: string;
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentToolCallEvent {
  toolCallId?: string;
  toolCallName?: string;
  parentMessageId?: string;
  description?: string;
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentRunFinishedEvent {
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentErrorEvent {
  threadId?: string;
  raw: unknown;
}

export interface ChatAgentRunHandlers {
  onRunStarted?: (event: ChatAgentRunStartedEvent) => void;
  onTextMessageStart?: (event: ChatAgentTextMessageStartEvent) => void;
  onTextDelta?: (event: ChatAgentTextDeltaEvent) => void;
  onTextMessageEnd?: (event: ChatAgentTextMessageEndEvent) => void;
  onToolCallStart?: (event: ChatAgentToolCallEvent) => void;
  onToolCallEnd?: (event: ChatAgentToolCallEvent) => void;
  onRunFinished?: (event: ChatAgentRunFinishedEvent) => void;
  onError?: (error: Error, event?: ChatAgentErrorEvent) => void;
}

const buildChatRequestUrl = (chatApiUrl: string) => new URL(chatApiUrl);

const asRecord = (value: unknown): JsonRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as JsonRecord;
};

const readString = (value: unknown): string | undefined => {
  return typeof value === 'string' && value.trim() ? value : undefined;
};

const extractThreadId = (record: JsonRecord) => {
  return (
    readString(record.thread_id) ??
    readString(record.threadId) ??
    readString(record.threadID)
  );
};

const extractMessageId = (record: JsonRecord) => {
  return (
    readString(record.message_id) ??
    readString(record.messageId) ??
    readString(record.id)
  );
};

const extractToolCallId = (record: JsonRecord) => {
  return readString(record.tool_call_id) ?? readString(record.toolCallId);
};

const extractToolCallName = (record: JsonRecord) => {
  return readString(record.tool_call_name) ?? readString(record.toolCallName);
};

const extractEventName = (record: JsonRecord) => {
  return (
    readString(record.event_type) ??
    readString(record.eventType) ??
    readString(record.type) ??
    readString(record.event)
  );
};

const extractDelta = (record: JsonRecord) => {
  const openAiDelta = record.choices;
  if (Array.isArray(openAiDelta)) {
    const firstChoice = openAiDelta[0] as JsonRecord | undefined;
    const delta = asRecord(firstChoice?.delta);
    const content = readString(delta?.content);
    if (content) return content;
  }

  return (
    readString(record.delta) ??
    readString(record.content) ??
    readString(record.text) ??
    readString(record.message)
  );
};

const extractErrorMessage = (record: JsonRecord) => {
  const errorRecord = asRecord(record.error);
  return (
    readString(errorRecord?.message) ??
    readString(record.error_message) ??
    readString(record.message) ??
    'Chat request failed'
  );
};

const parseEvent = (raw: unknown) => {
  const record =
    typeof raw === 'string'
      ? (() => {
          try {
            return asRecord(JSON.parse(raw));
          } catch {
            return null;
          }
        })()
      : asRecord(raw);

  if (!record) {
    return null;
  }

  const eventName = extractEventName(record)?.toUpperCase();
  const threadId = extractThreadId(record);

  if (
    eventName === 'ERROR' ||
    eventName === 'RUN_ERROR' ||
    readString(record.object) === 'error'
  ) {
    return {
      type: 'error' as const,
      error: new Error(extractErrorMessage(record)),
      event: { threadId, raw },
    };
  }

  if (eventName === 'RUN_STARTED') {
    return {
      type: 'run_started' as const,
      event: {
        runId: readString(record.run_id) ?? readString(record.runId),
        threadId,
        raw,
      },
    };
  }

  if (eventName === 'TEXT_MESSAGE_START') {
    return {
      type: 'text_message_start' as const,
      event: {
        messageId: extractMessageId(record),
        threadId,
        raw,
      },
    };
  }

  if (
    eventName === 'TEXT_MESSAGE_CONTENT' ||
    eventName === 'TEXT_MESSAGE_CHUNK'
  ) {
    const delta = extractDelta(record);
    if (!delta) return null;

    return {
      type: 'text_delta' as const,
      event: {
        delta,
        messageId: extractMessageId(record),
        threadId,
        raw,
      },
    };
  }

  if (eventName === 'TOOL_CALL_START') {
    return {
      type: 'tool_call_start' as const,
      event: {
        toolCallId: extractToolCallId(record),
        toolCallName: extractToolCallName(record),
        parentMessageId:
          readString(record.parent_message_id) ??
          readString(record.parentMessageId),
        description: readString(asRecord(record.metadata)?.description),
        threadId,
        raw,
      },
    };
  }

  if (eventName === 'TOOL_CALL_END' || eventName === 'TOOL_CALL_RESULT') {
    return {
      type: 'tool_call_end' as const,
      event: {
        toolCallId: extractToolCallId(record),
        toolCallName: extractToolCallName(record),
        parentMessageId:
          readString(record.parent_message_id) ??
          readString(record.parentMessageId),
        threadId,
        raw,
      },
    };
  }

  if (eventName === 'TEXT_MESSAGE_END') {
    return {
      type: 'text_message_end' as const,
      event: {
        messageId: extractMessageId(record),
        threadId,
        raw,
      },
    };
  }

  if (eventName === 'RUN_FINISHED' || eventName === 'STEP_FINISHED') {
    return {
      type: 'run_finished' as const,
      event: { threadId, raw },
    };
  }

  const delta = extractDelta(record);
  if (delta) {
    return {
      type: 'text_delta' as const,
      event: {
        delta,
        messageId: extractMessageId(record),
        threadId,
        raw,
      },
    };
  }

  return null;
};

export async function runBackendChatStream(
  { chatApiUrl, token, payload, signal }: ChatAgentRunRequest,
  handlers: ChatAgentRunHandlers = {}
) {
  const response = await fetch(buildChatRequestUrl(chatApiUrl).toString(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const emitParsedEvent = (rawEvent: unknown) => {
    const parsed = parseEvent(rawEvent);
    if (!parsed) return;

    switch (parsed.type) {
      case 'run_started':
        handlers.onRunStarted?.(parsed.event);
        break;
      case 'text_message_start':
        handlers.onTextMessageStart?.(parsed.event);
        break;
      case 'text_delta':
        handlers.onTextDelta?.(parsed.event);
        break;
      case 'text_message_end':
        handlers.onTextMessageEnd?.(parsed.event);
        break;
      case 'tool_call_start':
        handlers.onToolCallStart?.(parsed.event);
        break;
      case 'tool_call_end':
        handlers.onToolCallEnd?.(parsed.event);
        break;
      case 'run_finished':
        handlers.onRunFinished?.(parsed.event);
        break;
      case 'error':
        handlers.onError?.(parsed.error, parsed.event);
        throw parsed.error;
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        newlineIndex = buffer.indexOf('\n');

        if (!line || !line.startsWith('data: ')) {
          continue;
        }

        const dataStr = line.slice('data: '.length).trim();
        if (!dataStr || dataStr === '[DONE]') {
          continue;
        }

        try {
          emitParsedEvent(dataStr);
        } catch (error) {
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Failed to process chat stream event');
        }
      }
    }

    const tail = buffer.trim();
    if (tail.startsWith('data: ')) {
      const dataStr = tail.slice('data: '.length).trim();
      if (dataStr && dataStr !== '[DONE]') {
        emitParsedEvent(dataStr);
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to stream chat response');
  } finally {
    reader.releaseLock();
  }
}
