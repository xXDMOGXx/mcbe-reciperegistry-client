# @mcbe-reciperegistry/client

Schema **2** client for the Recipe Registry host pack (Minecraft Bedrock Script API).

## Install (npm / bundled addon)

```bash
npm install @mcbe-reciperegistry/client mcbe-ipc
```

`mcbe-ipc` is a declared dependency ([OmniacDev/MCBE-IPC](https://github.com/OmniacDev/MCBE-IPC)). Bundle your pack with a bundler so both packages resolve in Bedrock. Do not vendor a fork of Omniac’s sources as if they were this package.

Enable the **Recipe Registry** behavior pack on the world (host BP UUID in that pack’s README).

## Release drop-in (`client.js`)

GitHub Releases for the host may attach `client.js` (from `npm run build:release` → `dist/release/client.js`).

1. Copy Omniac’s built IPC module into your BP scripts folder as **`mcbe-ipc.js`** (their install docs / `dist/ipc.js` rename).
2. Copy Release **`client.js`** next to it (same folder).
3. From your entry script: `import { createBedrockClient } from "./client.js";`

That Release file does **not** embed Omniac’s code. Each pack isolate still needs its own `mcbe-ipc.js`.

## Usage

```ts
import { createBedrockClient } from "@mcbe-reciperegistry/client/bedrock";
// or from Release drop-in: import { createBedrockClient } from "./client.js";

const registry = createBedrockClient(5);
const ok = await registry.waitReady();
if (!ok) {
  // host missing — do not invent a craft
} else {
  const yields = await registry.result({
    station: "minecraft:furnace",
    inputs: ["minecraft:beef"],
  });
}
```

Data ops use MCBE-IPC. Discovery also listens for JSON `reciperegistry:ready` / `hello` (`schema: 2`).

Schema-1 JSON RPC is deprecated on the host; update callers to this package.
