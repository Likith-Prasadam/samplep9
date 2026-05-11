import { EventSourcePolyfill } from 'event-source-polyfill';
import { v4 as uuidv4 } from 'uuid';

class Logger {
  private isDebugMode: boolean;

  constructor() {
    this.isDebugMode =
      import.meta.env.VITE_DEBUG === 'true' ||
      localStorage.getItem('sse_debug') === 'true';
  }

  log(...args: unknown[]) {
    if (this.isDebugMode) console.log('SSEManager:', ...args);
  }

  error(...args: unknown[]) {
    console.error('SSEManager:', ...args);
  }

  warn(...args: unknown[]) {
    console.warn('SSEManager:', ...args);
  }
}

const logger = new Logger();

const SSE_ENDPOINT = import.meta.env.VITE_SSE_ENDPOINT_URL;
const OWNER_STORAGE_KEY = 'notifications_sse_owner';
const OWNER_TTL_MS = 30000;
const OWNER_HEARTBEAT_MS = 10000;

export const MESSAGE_TYPES = {
  CONNECTION: 'connection',
  HEARTBEAT: 'heartbeat',
  EVENT_DETECTION: 'event_detection',
  SYSTEM_ALERT: 'system_alert',
  INCIDENT: 'incident',
} as const;

export const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',
} as const;

export type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
export type ConnectionState =
  (typeof CONNECTION_STATES)[keyof typeof CONNECTION_STATES];

export type SSEClientEvent =
  | { type: 'open' }
  | { type: 'error'; error?: unknown }
  | { type: 'message'; raw: MessageEvent; parsed?: unknown };

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

// Helper to safely parse ID
const parseId = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  const parsedInt = parseInt(val as string, 10);
  return isNaN(parsedInt) ? null : parsedInt;
};

export const getUserSession = () => {
  try {
    const userData = localStorage.getItem('user');
    // Check for access_token first (authenticated user), then selection_token (role selection), then old token format
    const accessToken = localStorage.getItem('access_token');
    const selectionToken = localStorage.getItem('selection_token');
    const token = localStorage.getItem('token');

    const authToken = accessToken || selectionToken || token;

    // Token is required for API calls, but user data is optional
    if (!authToken) {
      return { token: null, cohortId: null, userId: null };
    }

    // Try to parse user data if available, but don't fail if it's missing
    let cohortId = null;
    let userId = null;

    if (userData) {
      try {
        const parsed = JSON.parse(userData);

        // Handle both string and number formats for IDs, and various casing/nesting
        cohortId =
          parseId(parsed.cohort_id) ??
          parseId(parsed.cohortId) ??
          parseId(parsed.cohort?.id) ??
          parseId(parsed.current_cohort?.id);

        userId =
          parsed.user_id ||
          parsed.userId ||
          parsed.id ||
          parsed.user?.id ||
          null;
      } catch (parseError) {
        logger.warn(
          'Failed to parse user data, but continuing with token:',
          parseError
        );
      }
    }

    // Fallback: check for standalone cohort_id in localStorage if not found in user object
    if (cohortId === null) {
      const rawCohortId =
        localStorage.getItem('cohort_id') || localStorage.getItem('cohortId');
      if (rawCohortId) {
        const parsedInt = parseInt(rawCohortId, 10);
        if (!isNaN(parsedInt)) cohortId = parsedInt;
      }
    }

    // Fallback: try to decode from token if IDs are missing
    if ((cohortId === null || userId === null) && authToken) {
      const decoded = parseJwt(authToken);
      if (decoded) {
        if (cohortId === null) {
          cohortId =
            parseId(decoded.cohort_id) ??
            parseId(decoded.cohortId) ??
            parseId(decoded.cohort?.id) ??
            parseId(decoded.cohort?.cohort_id) ??
            parseId(decoded.current_cohort?.id) ??
            parseId(decoded.current_cohort_id) ??
            parseId(decoded.cid);
        }

        if (userId === null) {
          userId =
            decoded.user_id ??
            decoded.userId ??
            decoded.id ??
            decoded.sub ??
            decoded.user?.user_id ??
            decoded.user?.id;
        }
      }
    }

    return { token: authToken, cohortId, userId };
  } catch (e) {
    logger.error('Failed to get user session:', e);
    return { token: null, cohortId: null, userId: null };
  }
};

const lastEventKey = (
  userId: string | number | null,
  cohortId: number | null
) => `lastEventId::user=${userId ?? 'anonymous'}::cohort=${cohortId ?? 'none'}`;

export const safeJSON = (s: string) => {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
};

class SSEManager {
  private static _instance: SSEManager | null = null;

  static get instance(): SSEManager {
    if (!SSEManager._instance) {
      logger.log('Creating new instance');
      SSEManager._instance = new SSEManager();
    }
    return SSEManager._instance;
  }

  private es: EventSourcePolyfill | null = null;
  private subs = new Set<(ev: SSEClientEvent) => void>();
  private state: ConnectionState = CONNECTION_STATES.DISCONNECTED;
  private connectionId: string | null = null;
  private tabId = uuidv4();
  private isOwner = false;
  private ownerHeartbeatId: number | null = null;
  private ownershipCheckId: number | null = null;
  private channel: BroadcastChannel | null = null;
  private lastConnectOptions: {
    token: string;
    cohortId: number;
    userId: string | number | null;
  } | null = null;
  private currentSession: {
    token: string | null;
    cohortId: number | null;
    userId: string | number | null;
  } = { token: null, cohortId: null, userId: null };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('notifications-sse');
        this.channel.addEventListener('message', this._handleBroadcast);
      }
      window.addEventListener('storage', this._handleStorage);
      window.addEventListener('beforeunload', () => {
        this.close('Page unload', true);
      });
      this._ensureOwnershipMonitor();
    }
  }

  connect(opts: {
    token: string;
    cohortId: number;
    userId: string | number | null;
  }) {
    this.lastConnectOptions = opts;
    if (!this._claimOwnership()) {
      logger.log('Another tab owns SSE connection, listening via broadcast.');
      this._setState(CONNECTION_STATES.DISCONNECTED);
      return;
    }

    const { token, cohortId, userId } = opts;

    if (
      this.es &&
      (this.state === CONNECTION_STATES.CONNECTED ||
        this.state === CONNECTION_STATES.CONNECTING) &&
      this.currentSession.token === token &&
      this.currentSession.cohortId === cohortId &&
      this.currentSession.userId === userId
    ) {
      logger.log(
        'Active connection exists for the same session, skipping connect.'
      );
      return;
    }

    this.close('New connection initiated', false);

    if (
      !token ||
      cohortId == null ||
      typeof cohortId !== 'number' ||
      Number.isNaN(cohortId)
    ) {
      logger.error('Invalid connection options, aborting:', opts);
      this._setState(CONNECTION_STATES.ERROR);
      return;
    }

    this.currentSession = { token, cohortId, userId };
    this._initiateConnection();
  }

  private _ensureOwnershipMonitor() {
    if (this.ownershipCheckId != null) return;
    this.ownershipCheckId = window.setInterval(() => {
      if (this.isOwner) {
        this._writeOwnerRecord();
        return;
      }
      this._maybeClaimOwnership();
    }, OWNER_HEARTBEAT_MS);
  }

  private _getOwnerRecord(): { id: string; ts: number } | null {
    const raw = localStorage.getItem(OWNER_STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.id && parsed?.ts) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  private _writeOwnerRecord() {
    if (!this.isOwner) return;
    localStorage.setItem(
      OWNER_STORAGE_KEY,
      JSON.stringify({ id: this.tabId, ts: Date.now() })
    );
  }

  private _startOwnerHeartbeat() {
    if (this.ownerHeartbeatId != null) return;
    this.ownerHeartbeatId = window.setInterval(() => {
      this._writeOwnerRecord();
    }, OWNER_HEARTBEAT_MS);
  }

  private _stopOwnerHeartbeat() {
    if (this.ownerHeartbeatId != null) {
      clearInterval(this.ownerHeartbeatId);
      this.ownerHeartbeatId = null;
    }
  }

  private _claimOwnership(): boolean {
    const now = Date.now();
    const record = this._getOwnerRecord();
    const stale = !record || now - record.ts > OWNER_TTL_MS;

    if (!record || record.id === this.tabId || stale) {
      this.isOwner = true;
      this._writeOwnerRecord();
      this._startOwnerHeartbeat();
      return true;
    }

    this.isOwner = record.id === this.tabId;
    return this.isOwner;
  }

  private _releaseOwnership() {
    if (this.isOwner) {
      localStorage.removeItem(OWNER_STORAGE_KEY);
    }
    this.isOwner = false;
    this._stopOwnerHeartbeat();
  }

  private _maybeClaimOwnership() {
    if (this.isOwner || !this.lastConnectOptions) return;
    const record = this._getOwnerRecord();
    const stale = !record || Date.now() - record.ts > OWNER_TTL_MS;
    if (stale && this._claimOwnership()) {
      logger.log('No active SSE owner detected, claiming ownership.');
      this.currentSession = this.lastConnectOptions;
      this._initiateConnection();
    }
  }

  private _initiateConnection() {
    const { token, cohortId, userId } = this.currentSession;
    if (
      !token ||
      cohortId == null ||
      typeof cohortId !== 'number' ||
      Number.isNaN(cohortId)
    ) {
      logger.error('Cannot initiate connection without a valid session.');
      return;
    }

    this._setState(CONNECTION_STATES.CONNECTING);
    this.connectionId = uuidv4();
    logger.log('Initiating connection with ID:', this.connectionId);
    const leKey = lastEventKey(userId, cohortId);
    const lastId = localStorage.getItem(leKey) ?? '';

    const url = new URL(SSE_ENDPOINT);
    url.searchParams.set('cohortId', String(cohortId));

    this.es = new EventSourcePolyfill(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      lastEventId: lastId || undefined,
      heartbeatTimeout: 240000,
    });

    this.es.onopen = this._handleOpen.bind(this);
    this.es.onerror = this._handleError.bind(this);

    // Bind once to ensure consistent reference
    const msgHandler = this._handleMessage.bind(this);
    this.es.onmessage = msgHandler;

    // Listen for named events that don't trigger onmessage
    console.log(
      'SSEManager: Adding event listeners for processing_status and ping'
    );
    this.es.addEventListener('processing_status', msgHandler);
    this.es.addEventListener('ping', msgHandler);
  }

  private _handleOpen() {
    this._setState(CONNECTION_STATES.CONNECTED);
    this.reconnectAttempts = 0;

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    logger.log('Connection opened.', { connectionId: this.connectionId });
    this.emit({ type: 'open' });
  }

  private _handleError(e: unknown) {
    logger.error('Error occurred.', e);
    this.emit({ type: 'error', error: e });

    if (this.es) {
      this.es.close();
      this.es = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000;
      this._setState(CONNECTION_STATES.RECONNECTING);
      logger.log(
        `Attempting to reconnect in ${delay / 1000}s (attempt ${this.reconnectAttempts})`
      );

      this.reconnectTimeoutId = window.setTimeout(() => {
        this._initiateConnection();
      }, delay);
    } else {
      logger.error(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping.`
      );
      this.close('Max reconnection attempts reached');
    }
  }

  private _handleMessage(evt: MessageEvent) {
    console.log('SSEManager: Received event:', {
      eventType: evt.type,
      lastEventId: evt.lastEventId,
      data: evt.data,
    });

    try {
      const leKey = lastEventKey(
        this.currentSession.userId,
        this.currentSession.cohortId
      );

      if (evt.lastEventId) {
        localStorage.setItem(leKey, evt.lastEventId);
      }

      const parsed =
        typeof evt.data === 'string' ? safeJSON(evt.data) : evt.data;

      if (!evt.lastEventId && parsed?.id != null) {
        if (typeof parsed.id === 'string' || typeof parsed.id === 'number') {
          localStorage.setItem(leKey, String(parsed.id));
        }
      }

      this.emit({ type: 'message', raw: evt, parsed });
      logger.log('Emitted event to subscribers');
    } catch (e) {
      logger.error('Error processing event:', e, evt);
      this.emit({ type: 'message', raw: evt });
    }
  }

  close(reason: string = 'Manual close', releaseOwnership = true) {
    logger.log(`Closing connection due to: ${reason}`);

    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }

    if (this.es) {
      this.es.close();
      this.es = null;
    }

    this._setState(CONNECTION_STATES.DISCONNECTED);
    this.connectionId = null;
    this.currentSession = { token: null, cohortId: null, userId: null };
    this.reconnectAttempts = 0;
    if (releaseOwnership) {
      this._releaseOwnership();
    }
  }

  isConnected(): boolean {
    return this.state === CONNECTION_STATES.CONNECTED && !!this.es;
  }

  subscribe(cb: (ev: SSEClientEvent) => void) {
    logger.log('New subscriber added');
    this.subs.add(cb);
    return () => {
      logger.log('Subscriber removed');
      this.subs.delete(cb);
    };
  }

  getState(): ConnectionState {
    return this.state;
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  emit(ev: SSEClientEvent) {
    if (ev.type === 'open') this._setState(CONNECTION_STATES.CONNECTED);
    this.subs.forEach((cb) => cb(ev));
    // Only broadcast if this is from the owner tab
    if (this.isOwner) {
      this._broadcast(ev);
    }
  }

  private _broadcast(ev: SSEClientEvent) {
    if (!this.isOwner || !this.channel) return;
    if (ev.type === 'message') {
      const rawData =
        typeof ev.raw.data === 'string'
          ? ev.raw.data
          : JSON.stringify(ev.raw.data);
      this.channel.postMessage({
        senderId: this.tabId,
        kind: 'event',
        payload: {
          type: 'message',
          parsed: ev.parsed,
          rawData,
          lastEventId: ev.raw.lastEventId,
        },
      });
      return;
    }

    this.channel.postMessage({
      senderId: this.tabId,
      kind: 'event',
      payload: { type: ev.type },
    });
  }

  private _handleBroadcast = (message: MessageEvent) => {
    const data = message.data as {
      senderId: string;
      kind: 'event';
      payload: Record<string, unknown>;
    } | null;
    if (!data || data.senderId === this.tabId || data.kind !== 'event') return;

    const payload = data.payload;
    // Directly call subscribers without re-emitting (to avoid re-broadcast loops)
    if (payload.type === 'open') {
      this.subs.forEach((cb) => cb({ type: 'open' }));
      return;
    }
    if (payload.type === 'error') {
      this.subs.forEach((cb) => cb({ type: 'error' }));
      return;
    }
    if (payload.type === 'message') {
      const fakeEvent = new MessageEvent('message', {
        data: payload.rawData,
        lastEventId: (payload.lastEventId as string | undefined) ?? undefined,
      });
      this.subs.forEach((cb) =>
        cb({ type: 'message', raw: fakeEvent, parsed: payload.parsed })
      );
    }

    return;
  };

  private _handleStorage = (e: StorageEvent) => {
    if (e.key !== OWNER_STORAGE_KEY) return;
    if (this.isOwner) return;
    this._maybeClaimOwnership();
  };

  private _setState(newState: ConnectionState) {
    if (this.state !== newState) {
      logger.log(`State changed: ${this.state} -> ${newState}`);
      this.state = newState;
    }
  }
}

export const sseManager = SSEManager.instance;
