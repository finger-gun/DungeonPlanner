## Context

DungeonPlanner currently centers all authoring state in `src/store/useDungeonStore.ts`, persists most data to browser storage, and uses the `server/` package for local multiplayer transport plus generated character asset storage. Public-facing surfaces are also split across the repository: the root app acts as the current anonymous editor/demo, `web/` holds the static landing page, and `docs-web/` contains the docs output. That model is fast for solo editing, but it does not provide durable identity, user ownership, role-aware authorization, admin governance, or a stable backend contract for the planned addition of player characters, campaign/session membership, and mergeable rules/content systems.

The proposed platform foundation also needs to account for the nearby Dragonbane Unbound domain model. That project already demonstrates a useful split between user identity, owned character state, session membership, namespaced content references, and data-driven rules packs. The challenge is to absorb those ideas without regressing DungeonPlanner's editing speed or forcing every brush stroke through a backend round-trip.

## Goals / Non-Goals

**Goals:**
- Introduce a separate authenticated application surface in `app/` so the real product can evolve without immediately restructuring the landing page, docs, or anonymous demo hosting.
- Establish Convex as the canonical backend for auth, persistent data, and file-backed platform records in local development.
- Preserve DungeonPlanner's fast local editing model by keeping transient editor operations in Zustand until users explicitly save or publish.
- Replace implicit localhost-based DM/player identity with authenticated users and role-aware permissions.
- Define a content and rules identity model that can support both scene assets and future TTRPG rules/content packs.
- Keep the path open for a phased migration rather than requiring a single all-at-once backend cutover.

**Non-Goals:**
- Repackaging `web/`, `docs-web/`, and the anonymous demo into one frontend deployment during the first implementation slice.
- Replacing Colyseus immediately for all realtime room traffic.
- Converting every existing content pack into a database-driven format in the first implementation.
- Delivering full rules automation, inventory, NPC compendiums, or campaign progression in this change.
- Supporting arbitrary client-executed code uploads as content packs.

## Decisions

### 1. Introduce a separate authenticated app surface
Create a new `app/` workspace package for the signed-in user experience and leave the existing landing page (`web/`), docs output (`docs-web/`), and anonymous demo/editor flow unchanged for now.

**Rationale:** This gives the platform a clean place to add Convex auth, libraries, sessions, and account-aware navigation without forcing an immediate merge of all public surfaces or a hosting/infra redesign.

**Alternatives considered:**
- **Rename `web/` and reuse that path immediately:** possible, but it would tangle current deploy assumptions and static-site responsibilities before the authenticated product is ready.
- **Retrofit the root demo/editor directly into the signed-in product shell:** higher risk because the anonymous demo and real product would be forced to evolve together from day one.

### 2. Start with Convex Auth in the authenticated app
Use Convex Auth directly for the first authenticated product slice instead of introducing an external OIDC-compatible provider from the start.

**Rationale:** The immediate goal is a simple local-first setup that can get sign-in, sign-out, and authenticated app access working quickly. Convex Auth keeps the initial integration surface smaller and aligns with the local-development-first rollout.

**Alternatives considered:**
- **External OIDC provider integrated through Convex from day one:** more flexible long term, but unnecessary complexity for the first local platform milestone.

### 3. Convex becomes the canonical durable backend
Use Convex for authenticated user identity, role records, persisted dungeon/library data, session membership data, character records, and file-backed content metadata.

**Rationale:** These concerns need durable ownership, access control, and shared retrieval semantics. They map better to a backend document model than to browser-local storage or Colyseus room state.

**Alternatives considered:**
- **Continue with browser-only persistence + local server helpers:** too limited for authenticated multi-user product flows.
- **Adopt the Supabase shape from Dragonbane Unbound directly:** workable in principle, but the decision for this project is to standardize on Convex rather than split backend stacks.

### 4. The editor remains local-first and save-driven
Keep active map editing in Zustand and only synchronize backend state at explicit save, publish, load, or share transitions.

**Rationale:** DungeonPlanner's core value is quick authoring. Routing every paint/place/remove operation through backend synchronization would add latency, complexity, and UX regression before the platform model is stable.

**Alternatives considered:**
- **Backend-authoritative editor state:** stronger central consistency, but too expensive for the current editing loop.
- **Mirror every local change asynchronously:** adds reconciliation complexity early and blurs what is local vs shared.

### 5. Colyseus stays as the initial live-session transport
Keep Colyseus for live play-session broadcasts and tactical room state for now, but source authenticated identity and session access from Convex-backed records instead of IP heuristics.

**Rationale:** The existing room system already handles play-time movement and map sync. Convex and Colyseus solve different problems in the first slice: Convex owns durable identity, memberships, saves, and library records, while Colyseus continues to handle ephemeral live-session transport.

**Alternatives considered:**
- **Move live transport to Convex immediately:** possible later, but not necessary to unlock auth, saved maps, and character/session ownership.

### 6. Roles are additive capabilities, not exclusive account types
Represent roles as a set of capabilities a user can hold concurrently, with at minimum `admin`, `dm`, and `player`.

**Rationale:** One user may create maps as a DM, play in another session as a player, and also administer content. An exclusive enum does not reflect the product model.

**Alternatives considered:**
- **Single account type enum:** simpler schema, but poor fit for combined use cases and future admin delegation.

### 7. Content identity uses namespaced refs
Adopt canonical content references in the shape `packId:localId` for persisted cross-pack references, regardless of whether the referenced content is a scene asset, rules datum, item, kin, profession, or NPC template.

**Rationale:** This prevents collisions, supports pack activation, and aligns DungeonPlanner with the data-driven pack model already explored in Dragonbane Unbound.

**Alternatives considered:**
- **Continue using only flat IDs:** simpler short term, but brittle once packs become user-manageable and cross-domain.

### 8. Support two pack classes under one registry model
Define a shared registry model for:
- **asset packs**: files and metadata used by the scene/editor
- **rules/data packs**: structured rules, character, item, and compendium data

Both use shared manifests, ownership, activation, and namespaced identifiers, but they may have different runtime loading behavior.

**Rationale:** DungeonPlanner's current pack system is asset-oriented while Dragonbane's is data-oriented. A merged platform needs one governance model without pretending both pack types execute the same way.

**Alternatives considered:**
- **Separate unrelated systems for scene assets and rules packs:** avoids abstraction work now, but makes platform unification harder later.

### 9. Start dungeon library persistence with manual saves and latest-only records
Treat saved dungeons as library records owned by users, starting with explicit manual saves and a latest-only durable record per saved dungeon rather than automatic revision history.

**Rationale:** This supports explicit save/load behavior and a small first implementation without inventing automatic history rules too early. Revisioning can be added later once the library model is stable.

**Alternatives considered:**
- **Automatic revisions:** more powerful, but unnecessary complexity for the initial library slice.
- **Manual snapshots from day one:** viable later, but still more product surface than needed for the first release.

### 10. Character records are durable documents independent of placement
Store player character records separately from scene placement records. Sessions and maps may reference characters, but character identity and progression are not derived from token placement.

**Rationale:** This matches the expected future model for owned PCs, inventory, stats, and campaign usage.

**Alternatives considered:**
- **Treat placed player tokens as the canonical character model:** too limited and tightly coupled to one map instance.

### 11. Canonical pack metadata starts with registry and placement-critical fields
Store canonical pack metadata in Convex for registry, access control, and generic placement/rendering compatibility. For the first slice, canonical metadata should include:
- pack-level: `packId`, `name`, `kind`, `version`, `description`, workspace owner, visibility mode, active state, file references, and default asset references
- asset-level: namespaced `id`, `localId`, `name`, `category`, asset file reference, thumbnail file reference, `snapsTo`, `connectors`, `propSurface`, `blocksLineOfSight`, shadow flags, `wallSpan`, `openingWidth`, `stairDirection`, paired asset ref, `tileSpan`, browser grouping fields, and light/effect metadata

Runtime-only code constructs such as React `Component`, `batchRender`, `projectionReceiver`, and dynamic hook-like helpers remain application code rather than canonical Convex metadata in the first slice.

**Rationale:** Admin upload/activation becomes useful only if the backend can own the identity, placement-critical metadata, and file references for packs. The code-level rendering hooks are too implementation-specific to make canonical immediately.

### 12. Rules/data pack availability is scoped to the DM workspace
Rules/data packs are scoped to the DM account workspace. Admin-managed availability modes start as:
- `global`: forced active for the workspace
- `public`: visible and usable by permitted users in that workspace/session
- `private`: hidden from regular users

Later access modes such as `locked` can extend this model. Users gain access to allowed packs when participating in sessions or workspaces owned by that DM scope.

**Rationale:** This matches the product model where a DM curates the rules/content environment for their players without requiring global product-wide activation.

## Risks / Trade-offs

- **[Backend boundary confusion]** Local-first editing plus remote save/publish can create unclear UX about what is already shared. → **Mitigation:** require explicit save/share actions and clear authored-vs-synced UI states.
- **[Fragmented product surfaces]** Users could remain unclear about the difference between the anonymous demo and the authenticated product. → **Mitigation:** keep responsibilities explicit: demo remains anonymous and disposable, while `app/` owns authenticated libraries, sessions, and account flows.
- **[Split-brain session architecture]** Convex for durable state plus Colyseus for live state can create duplication if responsibilities drift. → **Mitigation:** define Convex as canonical for identity, membership, and saved artifacts; define Colyseus as ephemeral transport only.
- **[Content migration complexity]** Existing asset IDs and runtime-generated character assets may not cleanly map to namespaced pack refs. → **Mitigation:** introduce compatibility mapping and preserve existing IDs until migration utilities exist.
- **[Over-scoping the foundation]** Characters, sessions, packs, auth, and rules interoperability can expand into a full platform rewrite. → **Mitigation:** phase implementation around auth, roles, dungeon saves, and session membership first.
- **[Serialized dungeon compatibility]** New ownership and pack semantics may pressure the current `.dungeon.json` format. → **Mitigation:** keep serialized dungeon files loadable and isolate backend metadata from portable dungeon payloads where possible.

## Migration Plan

1. Create the new `app/` workspace package and wire its development/build entry points separately from the existing landing page, docs output, and anonymous demo.
2. Add local Convex development setup and Convex Auth wiring inside the authenticated app surface.
3. Introduce user and role records and replace localhost-derived DM/player assumptions.
4. Add dungeon library persistence with explicit manual save/load behavior while preserving current local persistence.
5. Add durable session records and join flows backed by Convex, then connect Colyseus room access to those records.
6. Add character library records as an owned domain separate from placed map objects.
7. Introduce pack registry, workspace-scoped pack availability, and namespaced content references with compatibility handling for existing asset IDs.
8. Incrementally move eligible storage concerns from the local Express server into Convex-backed storage.

**Rollback strategy:** preserve current local editing and local file save/load flows until Convex-backed flows are proven stable; gate backend-backed behavior behind explicit new flows rather than replacing existing paths all at once.

## Open Questions

- Should the first admin-managed asset-pack implementation stop at registry + metadata + file storage, or also support generic uploaded asset rendering in the same slice?
- What is the minimum session state that should be written back durably from live play beyond membership and join/access metadata?
