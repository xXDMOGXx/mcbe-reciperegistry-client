import { CHANNEL, JSON_EVENT, PROTOCOL_SCHEMA } from "./channels.js";
import { decodePayload, encodePayload } from "./codec.js";
import type { DiscoveryTransport, IpcStringApi, TickClock } from "./ipcTypes.js";
import type {
  HelloReply,
  ListEntry,
  ListFilter,
  MatchQuery,
  MatchResult,
  Recipe,
  RegisterAsk,
  SyncAsk,
  SyncReply,
} from "./types.js";

/** Default client wait for ready / IPC reply, in ticks. */
export const DEFAULT_TIMEOUT_TICKS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecipeDocument(value: unknown): value is Recipe {
  return isRecord(value) && typeof value.id === "string" && Array.isArray(value.stations) && Array.isArray(value.inputs);
}

function waitTicks(clock: TickClock, ticks: number): Promise<void> {
  return new Promise((resolve) => {
    clock.runTimeout(() => resolve(), ticks);
  });
}

function withTimeout<T>(clock: TickClock, ticks: number, promise: Promise<T>): Promise<T | undefined> {
  return new Promise((resolve) => {
    const cancel = clock.runTimeout(() => resolve(undefined), ticks);
    void promise.then(
      (value) => {
        cancel();
        resolve(value);
      },
      () => {
        cancel();
        resolve(undefined);
      },
    );
  });
}

async function invokeJson<T>(ipc: IpcStringApi, clock: TickClock, ticks: number, channel: string, body: unknown): Promise<T | undefined> {
  const raw = await withTimeout(clock, ticks, ipc.invoke(channel, encodePayload(body)));
  if (raw === undefined) return undefined;
  return decodePayload(raw) as T | undefined;
}

/** Schema-2 Recipe Registry client (IPC data + JSON discovery). */
export interface RecipeRegistryClient {
  waitReady(): Promise<boolean>;
  catalogMinecraft(): string | undefined;
  register(recipes: Recipe[], options?: { source?: string; rev?: number }): Promise<void>;
  sync(source: string, rev: number): Promise<boolean | undefined>;
  unregister(ids: string[]): Promise<void>;
  match(query: MatchQuery): Promise<string[] | undefined>;
  result(query: MatchQuery): Promise<MatchResult[] | undefined>;
  get(id: string): Promise<Recipe | undefined>;
  list(filter?: ListFilter): Promise<ListEntry[]>;
  dispose(): void;
}

/** Options for {@link createClient}. */
export interface CreateClientOptions {
  ipc: IpcStringApi;
  discovery: DiscoveryTransport;
  clock: TickClock;
  timeoutTicks?: number;
}

/** Client bound to injected IPC + JSON discovery; times out to unavailable. */
export function createClient(options: CreateClientOptions): RecipeRegistryClient {
  const timeoutTicks = options.timeoutTicks ?? DEFAULT_TIMEOUT_TICKS;
  let ready = false;
  let minecraft: string | undefined;

  const unsubscribe = options.discovery.onEvent((id, message) => {
    if (id !== JSON_EVENT.ready) return;
    let body: unknown;
    try {
      body = JSON.parse(message) as unknown;
    } catch {
      return;
    }
    if (!isRecord(body) || body.schema !== PROTOCOL_SCHEMA) return;
    ready = true;
    minecraft = typeof body.minecraft === "string" ? body.minecraft : undefined;
  });

  return {
    async waitReady() {
      if (ready) return true;
      options.discovery.send(JSON_EVENT.hello, JSON.stringify({ v: PROTOCOL_SCHEMA }));
      if (ready) return true;
      const hello = await invokeJson<HelloReply>(options.ipc, options.clock, timeoutTicks, CHANNEL.hello, {
        v: PROTOCOL_SCHEMA,
      });
      if (hello !== undefined && hello.schema === PROTOCOL_SCHEMA) {
        ready = true;
        minecraft = hello.minecraft;
        return true;
      }
      await waitTicks(options.clock, timeoutTicks);
      return ready;
    },
    catalogMinecraft() {
      return minecraft;
    },
    async register(recipes, registerOptions) {
      const ask: RegisterAsk = { recipes };
      if (registerOptions?.source !== undefined) ask.source = registerOptions.source;
      if (registerOptions?.rev !== undefined) ask.rev = registerOptions.rev;
      await withTimeout(options.clock, timeoutTicks, options.ipc.invoke(CHANNEL.register, encodePayload(ask)));
    },
    async sync(source, rev) {
      const reply = await invokeJson<SyncReply>(options.ipc, options.clock, timeoutTicks, CHANNEL.sync, {
        source,
        rev,
      } satisfies SyncAsk);
      if (reply === undefined || typeof reply.same !== "boolean") return undefined;
      return reply.same;
    },
    async unregister(ids) {
      await withTimeout(options.clock, timeoutTicks, options.ipc.invoke(CHANNEL.unregister, encodePayload({ ids })));
    },
    async match(query) {
      const reply = await invokeJson<{ ids?: string[] }>(options.ipc, options.clock, timeoutTicks, CHANNEL.match, query);
      if (reply === undefined) return undefined;
      return reply.ids ?? [];
    },
    async result(query) {
      const reply = await invokeJson<{ results?: MatchResult[] }>(
        options.ipc,
        options.clock,
        timeoutTicks,
        CHANNEL.result,
        query,
      );
      if (reply === undefined) return undefined;
      return reply.results ?? [];
    },
    async get(id) {
      const reply = await invokeJson<{ recipe?: Recipe }>(options.ipc, options.clock, timeoutTicks, CHANNEL.get, { id });
      if (reply === undefined || reply.recipe === undefined) return undefined;
      return isRecipeDocument(reply.recipe) ? reply.recipe : undefined;
    },
    async list(filter) {
      const reply = await invokeJson<{ entries?: ListEntry[] }>(
        options.ipc,
        options.clock,
        timeoutTicks,
        CHANNEL.list,
        filter ?? {},
      );
      if (reply === undefined) return [];
      return reply.entries ?? [];
    },
    dispose() {
      unsubscribe();
    },
  };
}
