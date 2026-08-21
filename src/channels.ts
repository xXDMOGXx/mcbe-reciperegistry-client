/**
 * Schema 2 wire: MCBE-IPC channels and advertised protocol version.
 * JSON `reciperegistry:*` remains schema 1 (deprecated).
 */

/** Advertised host protocol (`ready.schema` / IPC hello). */
export const PROTOCOL_SCHEMA = 2;

/** Legacy JSON envelope `v` still accepted on the host during deprecation. */
export const JSON_V1 = 1;

/** IPC channel names (MCBE-IPC `invoke` / `handle`). */
export const CHANNEL = {
  hello: "reciperegistry.hello",
  register: "reciperegistry.register",
  sync: "reciperegistry.sync",
  unregister: "reciperegistry.unregister",
  match: "reciperegistry.match",
  result: "reciperegistry.result",
  get: "reciperegistry.get",
  list: "reciperegistry.list",
} as const;

/** JSON discovery events (dual discovery). */
export const JSON_EVENT = {
  ready: "reciperegistry:ready",
  hello: "reciperegistry:hello",
} as const;

/** Content-log / BDS warning for schema-1 JSON callers. */
export const SCHEMA1_DEPRECATION_WARN =
  "[recipe-registry] schema 1 (JSON) is deprecated; this world needs Recipe Registry schema 2. Notify the addon author to update to @mcbe-reciperegistry/client.";
