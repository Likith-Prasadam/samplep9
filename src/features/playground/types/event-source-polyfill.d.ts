declare module 'event-source-polyfill' {
  export interface EventSourcePolyfillInit extends EventSourceInit {
    headers?: Record<string, string>;
    withCredentials?: boolean;
    lastEventId?: string;
    heartbeatTimeout?: number;
  }

  export class EventSourcePolyfill extends EventSource {
    constructor(url: string, eventSourceInitDict?: EventSourcePolyfillInit);
  }
}
