/* eslint-disable @typescript-eslint/no-explicit-any */
import { EventSourcePolyfill } from 'event-source-polyfill';
import { v4 as uuidv4 } from 'uuid';

class Logger {
  private isDebugMode: boolean;

  constructor() {
    this.isDebugMode =
      import.meta.env.VITE_DEBUG === 'true' ||
      localStorage.getItem('sse_debug') === 'true';
  }

  log(...args: any[]) {
    if (this.isDebugMode) console.log('SSEManager:', ...args);
  }
  error(...args: any[]) {
    console.error('SSEManager:', ...args);
  }
}
const logger = new Logger();

const SSE_ENDPOINT = import.meta.env.VITE_SSE_ENDPOINT_URL;

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
  | { type: 'error'; error?: any }
  | { type: 'message'; raw: MessageEvent; parsed?: any };

export const getUserSession = () => {
  try {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    if (!userData || !token)
      return { token: null, cohortId: null, userId: null };
    const parsed = JSON.parse(userData);
    const cohortId = parseInt(parsed.cohort_id);
    const userId = parsed.id;
    return { token, cohortId, userId };
  } catch (e) {
    logger.error('Failed to parse user session data:', e);
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
  private currentSession: {
    token: string | null;
    cohortId: number | null;
    userId: string | number | null;
  } = { token: null, cohortId: null, userId: null };
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeoutId: number | null = null;

  private constructor() {}

  connect(opts: {
    token: string;
    cohortId: number;
    userId: string | number | null;
  }) {
    const { token, cohortId, userId } = opts;

    // Check if a connection with the same user session already exists
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

    // Clean up any existing connection before creating a new one
    this.close('New connection initiated');

    if (!token || !cohortId || isNaN(cohortId)) {
      logger.error('Invalid connection options, aborting:', opts);
      this._setState(CONNECTION_STATES.ERROR);
      return;
    }

    this.currentSession = { token, cohortId, userId };
    this._initiateConnection();
  }

  private _initiateConnection() {
    if (!this.currentSession.token || !this.currentSession.cohortId) {
      logger.error('Cannot initiate connection without a valid session.');
      return;
    }

    this._setState(CONNECTION_STATES.CONNECTING);
    this.connectionId = uuidv4(); // Generate a new ID for the new connection attempt

    logger.log('Initiating connection with ID:', this.connectionId);

    const { token, cohortId, userId } = this.currentSession;
    const leKey = lastEventKey(userId, cohortId);
    const lastId = localStorage.getItem(leKey) ?? '';

    const url = new URL(SSE_ENDPOINT);
    url.searchParams.set('cohortId', String(cohortId));

    this.es = new EventSourcePolyfill(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      lastEventId: lastId || undefined,
      heartbeatTimeout: 240000,
    });

    this.es.onopen = this._handleOpen.bind(this);
    this.es.onerror = this._handleError.bind(this);
    this.es.onmessage = this._handleMessage.bind(this);
  }

  private _handleOpen() {
    this._setState(CONNECTION_STATES.CONNECTED);
    this.reconnectAttempts = 0; // Reset on successful connection
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    logger.log('Connection opened.', { connectionId: this.connectionId });
    this.emit({ type: 'open' });
  }

  private _handleError(e: any) {
    logger.error('Error occurred.', e);
    this.emit({ type: 'error', error: e });

    if (this.es) {
      this.es.close(); // Close the failing EventSource
      this.es = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
      this._setState(CONNECTION_STATES.RECONNECTING);
      logger.log(
        `Attempting to reconnect in ${delay / 1000}s (attempt ${
          this.reconnectAttempts
        })`
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
    logger.log('Received event:', {
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
        // It's good practice to ensure the ID is a string or number before setting
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
  close(reason: string = 'Manual close') {
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
  }

  // Helper function to check the current connection state
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
    // Also update internal state on specific events
    if (ev.type === 'open') this._setState(CONNECTION_STATES.CONNECTED);
    this.subs.forEach((cb) => cb(ev));
  }
  private _setState(newState: ConnectionState) {
    if (this.state !== newState) {
      logger.log(`State changed: ${this.state} -> ${newState}`);
      this.state = newState;
    }
  }
}

export const sseManager = SSEManager.instance;
