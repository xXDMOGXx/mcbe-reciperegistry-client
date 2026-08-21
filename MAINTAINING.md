# Maintainer notes (not for addon authors)

## npm trusted publishing

Workflow: `.github/workflows/publish.yml` (OIDC — no `NPM_TOKEN`).

One-time (interactive Chrome/passkey login):

```bash
npm login --auth-type=web
npm trust github @mcbe-reciperegistry/client \
  --file publish.yml \
  --repo xXDMOGXx/mcbe-reciperegistry-client \
  --allow-publish \
  -y
```

Or: npmjs.com → package → Settings → Trusted Publisher → GitHub Actions  
(`xXDMOGXx` / `mcbe-reciperegistry-client` / `publish.yml`).

## Cut a release

1. Bump `version` in `package.json`.
2. Commit on `main`.
3. `git tag vX.Y.Z && git push origin vX.Y.Z`  
   (tag must match the version you bumped, e.g. `0.1.1` → `v0.1.1`).

Actions → **Publish Package** also works via `workflow_dispatch` (publishes whatever version is on the default branch).
