declare module 'event-source-polyfill' {
  export interface EventSourcePolyfillInit {
    headers?: Record<string, string>;
    withCredentials?: boolean;
    heartbeatTimeout?: number;
    lastEventId?: string;
  }

  export class EventSourcePolyfill extends EventTarget {
    constructor(url: string, eventSourceInitDict?: EventSourcePolyfillInit);
    readonly url: string;
    readonly readyState: number;
    readonly CONNECTING: 0;
    readonly OPEN: 1;
    readonly CLOSED: 2;
    onopen: ((event: Event) => void) | null;
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    close(): void;
  }
}
