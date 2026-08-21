# @mcbe-reciperegistry/client

Schema **2** client for the Recipe Registry host pack (Minecraft Bedrock Script API).

**Documentation:** [Wiki](https://github.com/xXDMOGXx/mcbe-reciperegistry-client/wiki) (install, quick start, API, troubleshooting)

## Install

```bash
npm install @mcbe-reciperegistry/client mcbe-ipc
```

You also need the **Recipe Registry** host behavior pack on the world ([CurseForge](https://www.curseforge.com/minecraft-bedrock/addons/recipe-registry)). Details: [Installation](https://github.com/xXDMOGXx/mcbe-reciperegistry-client/wiki/Installation) · [Dependencies](https://github.com/xXDMOGXx/mcbe-reciperegistry-client/wiki/Dependencies)

`mcbe-ipc` is from [OmniacDev/MCBE-IPC](https://github.com/OmniacDev/MCBE-IPC). Drop-in `recipe-registry-client.js` (no bundler): [Releases](https://github.com/xXDMOGXx/mcbe-reciperegistry-client/releases) — place Omniac’s module beside it as `mcbe-ipc.js`.

## Quick example

```ts
import { createBedrockClient } from "@mcbe-reciperegistry/client/bedrock";
// or: import { createBedrockClient } from "./recipe-registry-client.js";

const registry = createBedrockClient(5);
if (!(await registry.waitReady())) {
  // host missing — fail closed
} else {
  const yields = await registry.result({
    station: "minecraft:furnace",
    inputs: ["minecraft:beef"],
  });
}
```

Full walkthrough: [Quick start](https://github.com/xXDMOGXx/mcbe-reciperegistry-client/wiki/Quick-Start)

Schema-1 JSON RPC is deprecated on the host; use this package instead.
