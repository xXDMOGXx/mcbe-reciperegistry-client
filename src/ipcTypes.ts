/**
 * Injectable slice of MCBE-IPC used by the schema-2 client/host.
 * Production wires the real `mcbe-ipc` default export; tests inject a fake.
 */
export interface IpcStringApi {
  /** Request/response over a channel; payload serializer is always a string. */
  invoke(channel: string, request: string): Promise<string>;
  /** Register a string→string handler for `invoke`. Returns unsubscribe. */
  handle(channel: string, listener: (request: string) => string): () => void;
}

/** Tick scheduler for client timeouts (Bedrock `system.runTimeout`). */
export interface TickClock {
  runTimeout(callback: () => void, ticks: number): () => void;
}

/** Script-event transport for JSON `ready` / `hello` discovery. */
export interface DiscoveryTransport {
  send(id: string, message: string): void;
  onEvent(handler: (id: string, message: string) => void): () => void;
}
