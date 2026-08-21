import IPC, { PROTO } from "mcbe-ipc";
import type { IpcStringApi } from "./ipcTypes.js";

/** Live MCBE-IPC adapter: domain payloads are compact JSON strings. */
export function ipcStringFromMcbe(): IpcStringApi {
  return {
    invoke(channel, request) {
      return IPC.invoke(channel, PROTO.String, request, PROTO.String);
    },
    handle(channel, listener) {
      return IPC.handle(channel, PROTO.String, PROTO.String, listener);
    },
  };
}
