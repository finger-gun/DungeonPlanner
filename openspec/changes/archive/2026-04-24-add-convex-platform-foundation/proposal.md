## Why

DungeonPlanner currently has no real user identity model, stores authored dungeon data primarily in browser-local state, and relies on a lightweight local server for generated asset storage and ad hoc DM/player session handling. As the product expands to include authenticated accounts, persistent maps, shareable sessions, player-owned characters, and administrator-managed content, it needs a shared platform foundation that can support both the current editor workflow and the planned merge of richer TTRPG domain systems.

This change establishes that foundation now so DungeonPlanner can grow from a local-first map editor into a multi-user platform without sacrificing editing speed, scene readability, or predictable play-session behavior.

## What Changes

- Add a Convex-backed platform foundation for authentication, persistent application data, and file storage in local development.
- Add a new authenticated application surface in `app/` for signed-in users while keeping the existing landing page, docs output, and anonymous demo/editor surfaces unchanged for now.
- Introduce authenticated user accounts with multi-role authorization for admins, dungeon masters, and players.
- Add persistent ownership and retrieval of saved dungeons, while preserving a fast local editing workflow and explicit save/publish behavior for authored maps.
- Add shareable session and membership records so DMs can create sessions and players can join through a durable join mechanism instead of implicit localhost-based role assignment.
- Add a persistent player character domain that supports user-owned characters as a basis for later stats, inventory, progression, and session linking.
- Add an admin-managed content pack registry and activation model for database-backed pack metadata, storage, and namespaced content references.
- Establish shared pack and rules identifiers that can support the planned merge of Dragonbane Unbound's character, rules, and content-pack concepts into DungeonPlanner.
- **BREAKING**: Session identity and authorization behavior will no longer be inferred from client locality alone.
- **BREAKING**: Persisted dungeon ownership and remote save semantics will introduce new backend-backed flows alongside existing local/browser persistence.

### In Scope

- Local Convex setup for development
- New local `app/` workspace or surface for authenticated product flows
- User authentication and role-aware authorization
- Dungeon save/load ownership model
- Session creation, join, and membership records
- Character ownership foundation
- Content pack registry, activation, and namespaced identifiers
- Compatibility expectations for existing serialized dungeon data and local workflows

### Out of Scope

- Full replacement of all live Colyseus room traffic
- Immediate merge of landing page, docs, demo, and authenticated product into one deployed frontend surface
- Complete migration of every editor interaction to backend-driven realtime sync
- Final implementation of character stats, inventory, spellcasting, NPC compendiums, or full rules automation
- Arbitrary code-upload content packs executed in the client at runtime

## Capabilities

### New Capabilities
- `authenticated-app-shell`: A dedicated signed-in application surface rooted in `app/` while public landing, docs, and demo surfaces remain unchanged.
- `user-auth`: Account sign-up, sign-in, authenticated session lifecycle, and local Convex auth setup.
- `platform-roles`: Multi-role authorization model covering admins, dungeon masters, and players across UI and backend operations.
- `dungeon-library`: Durable dungeon ownership, save/load, and share-ready persistence that preserves local-first editing flow.
- `play-sessions`: Session creation, join codes or equivalent join mechanisms, membership records, and role-aware session access.
- `character-library`: User-owned player character records that can later expand to stats, inventory, and session participation.
- `content-pack-registry`: Admin-managed pack metadata, activation state, storage-backed files, and namespaced content references for assets and rules data.
- `rules-pack-interop`: Shared content reference and pack model that can absorb Dragonbane Unbound's rules and character domain concepts without identifier collisions.

### Modified Capabilities
- None.

## Impact

- Affected frontend/editor surfaces: the new authenticated `app/` surface, authentication entry points, save/load flows, session sharing flows, player character access, admin management UI, and any UX that currently assumes anonymous local use.
- Deferred public surfaces: `web/` static landing page, `docs-web/` docs output, and the existing anonymous demo/editor remain in place during this phase.
- Affected backend systems: `server/` authorization assumptions, session join behavior, generated asset storage responsibilities, and future handoff points between Convex persistence and live session transport.
- Affected client state: `src/store/useDungeonStore.ts` persistence boundaries, local-vs-remote save semantics, any flows that currently persist only to browser storage, and the boundary between the anonymous demo surface and the authenticated app surface.
- Affected content systems: `src/content-packs/` identifiers, future runtime pack loading, and compatibility with namespaced pack references.
- Affected dependencies: Convex client/server packages, Convex local development tooling, and related auth/storage integration.
- Compatibility and migration risk: existing serialized dungeon JSON must remain loadable, local editing must remain responsive, and any move toward backend-backed content identifiers must account for current asset IDs and runtime-generated character assets.
