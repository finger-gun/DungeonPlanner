# DungeonPlanner App

This workspace is the new signed-in product surface for DungeonPlanner.

It stays separate from the current public landing page, docs, and anonymous demo while local Convex-backed auth, roles, persistence, and admin tooling are built out here first.

## What lives here

- Convex Auth sign-up, sign-in, and sign-out
- The authenticated React shell
- Local self-hosted Convex setup for development
- Early backend models for users, roles, dungeons, sessions, characters, and packs
- Manual dungeon-library save/load for portable `.dungeon.json` payloads

## Local setup

Fastest path from the repository root:

```bash
pnpm install
pnpm run app:setup
```

For non-interactive setup in automation or when you just want the defaults:

```bash
pnpm run app:setup -- --yes
```

This guided setup script:

- starts the local self-hosted Convex backend
- generates a Convex admin key
- writes or updates `app/.env.local`
- generates Convex Auth signing keys
- pushes auth env vars into the local Convex deployment
- runs a one-time Convex sync/codegen pass

After setup, start the authenticated app stack with:

```bash
pnpm run app:start
```

That boots the local Convex watcher and the authenticated Vite app together.
The app prefers `http://localhost:4173` and will automatically move to the next free port if that one is already in use.

## Seed development accounts

To create ready-to-use local accounts for development:

```bash
pnpm run app:seed
```

This provisions three password accounts in the local Convex backend:

```text
admin@dungeonplanner.local  / DungeonPlanner123!
dm@dungeonplanner.local     / DungeonPlanner123!
player@dungeonplanner.local / DungeonPlanner123!
```

Role defaults:

- `admin@dungeonplanner.local`: global `admin`, workspace `dm`, workspace `player`
- `dm@dungeonplanner.local`: workspace `dm`, workspace `player`
- `player@dungeonplanner.local`: workspace `player`

## Manual setup

If you want to do the steps yourself, copy the generated admin key into `app/.env.local`:

```bash
VITE_CONVEX_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210
CONVEX_SELF_HOSTED_ADMIN_KEY=replace-with-generated-admin-key
```

Generate signing keys for Convex Auth:

```bash
pnpm --filter dungeonplanner-app convex:auth:keys
```

Set the auth variables on the self-hosted Convex backend and push the current functions:

```bash
cd app
printf 'SITE_URL=http://localhost:4173\n' > /tmp/dungeonplanner-convex-self-hosted.env
pnpm run convex:auth:keys >> /tmp/dungeonplanner-convex-self-hosted.env
pnpm exec convex env set --from-file /tmp/dungeonplanner-convex-self-hosted.env --force
pnpm exec convex dev --once --typecheck disable
```

Start the authenticated app:

```bash
pnpm --filter dungeonplanner-app dev
```

The app prefers `http://localhost:4173` and falls forward to the next free port when needed.

## Useful commands

```bash
pnpm run app:setup
pnpm run app:start
pnpm run app:seed
pnpm --filter dungeonplanner-app dev
pnpm --filter dungeonplanner-app build
pnpm --filter dungeonplanner-app lint
pnpm run app:convex
pnpm run app:convex:codegen
pnpm run app:convex:up
pnpm run app:convex:down
pnpm run app:convex:admin-key
pnpm run app:convex:auth-keys
pnpm --filter dungeonplanner-app convex:dev
pnpm --filter dungeonplanner-app convex:self-hosted:up
pnpm --filter dungeonplanner-app convex:self-hosted:down
pnpm --filter dungeonplanner-app convex:self-hosted:admin-key
pnpm --filter dungeonplanner-app convex:auth:keys
```

## Role model

- `admin` can manage users and packs
- `dm` can create dungeon and session records
- `player` can use the character library

Roles are additive. Global admin overrides workspace-level restrictions.

## Dungeon library flow

- The authenticated app stores the existing portable dungeon JSON export format in Convex as the durable payload.
- Import a `.dungeon.json` file or paste a portable payload into the **Dungeon Library** draft editor.
- Use **Save as new record** or **Update saved record** to persist the latest manual version.
- The draft panel shows whether the local browser draft is unsaved, synced, or diverged from the last saved Convex record.
- Downloading the draft exports the same portable JSON shape, so existing editor imports stay compatible.

## Session flow

- DMs can create durable session records and share the generated join code with authenticated players.
- Players join through the authenticated app, which persists session membership in Convex.
- The sessions panel can issue a short-lived Colyseus access ticket for a selected session.
- The local server now validates room access through Convex-backed membership instead of trusting localhost as DM authority.

## Character flow

- Players can create, update, list, and delete their own durable character records.
- Character records stay independent from map placement and can exist before they are ever used in a session.
- The authenticated app can attach a selected character record to a selected session as the first durable reference path.

## Pack registry flow

- Admins can register or update workspace-owned pack records with canonical entry metadata for both scene assets and rules/data entries.
- Pack entries use namespaced refs in the shape `packId:localId`; legacy flat asset IDs are normalized on save.
- Runtime-generated player asset refs stay compatible and are not force-converted into pack-managed refs.
- Pack records can upload and store manifest or thumbnail files through Convex storage-backed upload URLs.
- Session pack availability is derived from the owning workspace and only exposes active non-private packs to session members.

## Notes

- The first authenticated local user is automatically promoted to global admin.
- Workspace owners are automatically initialized with `dm` and `player`.
- Convex code generation writes to `app/convex/_generated/`.
- This README intentionally documents only the authenticated app workspace. The root README remains the public/demo entry point for now.
