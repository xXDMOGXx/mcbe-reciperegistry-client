import { describe, expect, it, beforeEach } from "vitest";
import { noteSchema1Deprecation, resetSchema1DeprecationWarns } from "./deprecation.js";
import { createClient } from "./client.js";
import { CHANNEL, PROTOCOL_SCHEMA, JSON_EVENT } from "./channels.js";
import { encodePayload, decodePayload } from "./codec.js";
import type { DiscoveryTransport, IpcStringApi, TickClock } from "./ipcTypes.js";

describe("noteSchema1Deprecation", () => {
  beforeEach(() => resetSchema1DeprecationWarns());

  it("warns once per pack key", () => {
    const lines: string[] = [];
    const warn = (m: string) => lines.push(m);
    noteSchema1Deprecation("mymod", warn);
    noteSchema1Deprecation("mymod", warn);
    noteSchema1Deprecation("other", warn);
    expect(lines).toHaveLength(2);
  });
});

describe("createClient", () => {
  function fakeClock(): TickClock & { flush(ticks?: number): void } {
    const q: { cb: () => void; at: number }[] = [];
    let now = 0;
    return {
      runTimeout(callback, ticks) {
        const at = now + ticks;
        q.push({ cb: callback, at });
        return () => {
          const i = q.findIndex((e) => e.cb === callback);
          if (i >= 0) q.splice(i, 1);
        };
      },
      flush(ticks = 1) {
        now += ticks;
        const due = q.filter((e) => e.at <= now);
        for (const e of due) {
          const i = q.indexOf(e);
          if (i >= 0) q.splice(i, 1);
          e.cb();
        }
      },
    };
  }

  function fakeDiscovery(): DiscoveryTransport & { emit(id: string, message: string): void } {
    const handlers: ((id: string, message: string) => void)[] = [];
    return {
      send() {},
      onEvent(handler) {
        handlers.push(handler);
        return () => {
          const i = handlers.indexOf(handler);
          if (i >= 0) handlers.splice(i, 1);
        };
      },
      emit(id, message) {
        for (const h of [...handlers]) h(id, message);
      },
    };
  }

  it("waitReady succeeds on JSON ready schema 2", async () => {
    const clock = fakeClock();
    const discovery = fakeDiscovery();
    const ipc: IpcStringApi = {
      invoke: () => new Promise(() => {}),
      handle: () => () => {},
    };
    const client = createClient({ ipc, discovery, clock, timeoutTicks: 2 });
    discovery.emit(JSON_EVENT.ready, JSON.stringify({ v: PROTOCOL_SCHEMA, schema: PROTOCOL_SCHEMA }));
    await expect(client.waitReady()).resolves.toBe(true);
    client.dispose();
  });

  it("match returns ids over IPC", async () => {
    const clock = fakeClock();
    const discovery = fakeDiscovery();
    const ipc: IpcStringApi = {
      async invoke(channel, request) {
        expect(channel).toBe(CHANNEL.match);
        expect(decodePayload(request)).toEqual({ station: "minecraft:furnace", inputs: ["minecraft:beef"] });
        return encodePayload({ ids: ["minecraft:furnace_beef"] });
      },
      handle: () => () => {},
    };
    const client = createClient({ ipc, discovery, clock, timeoutTicks: 5 });
    discovery.emit(JSON_EVENT.ready, JSON.stringify({ v: PROTOCOL_SCHEMA, schema: PROTOCOL_SCHEMA }));
    await expect(
      client.match({ station: "minecraft:furnace", inputs: ["minecraft:beef"] }),
    ).resolves.toEqual(["minecraft:furnace_beef"]);
    client.dispose();
  });

  it("match times out to undefined", async () => {
    const clock = fakeClock();
    const discovery = fakeDiscovery();
    const ipc: IpcStringApi = {
      invoke: () => new Promise(() => {}),
      handle: () => () => {},
    };
    const client = createClient({ ipc, discovery, clock, timeoutTicks: 1 });
    discovery.emit(JSON_EVENT.ready, JSON.stringify({ v: PROTOCOL_SCHEMA, schema: PROTOCOL_SCHEMA }));
    const pending = client.match({ station: "minecraft:furnace", inputs: ["minecraft:beef"] });
    clock.flush(1);
    await expect(pending).resolves.toBeUndefined();
    client.dispose();
  });
});
