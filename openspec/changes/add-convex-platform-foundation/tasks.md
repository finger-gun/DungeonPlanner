## 1. Authenticated app surface

- [x] 1.1 Create a new local `app/` workspace package for the signed-in user experience without changing `web/`, `docs-web/`, or the current anonymous demo/editor behavior.
- [x] 1.2 Wire development and build entry points for the new authenticated app surface so it can run locally alongside existing repo surfaces.
- [x] 1.3 Add a minimal authenticated app shell with navigation placeholders for account-aware product features.

## 2. Convex foundation and auth baseline

- [x] 2.1 Add local Convex development setup, dependencies, and environment wiring for the authenticated app workspace package.
- [x] 2.2 Create the initial Convex schema and functions for users, role assignments, dungeon records, session records, character records, and pack registry records.
- [x] 2.3 Implement sign-up, sign-in, sign-out, and authenticated session hydration in the frontend using Convex Auth.
- [x] 2.4 Add shared auth helpers so protected frontend and backend paths can resolve the current authenticated user identity.

## 3. Role-aware authorization

- [x] 3.1 Implement additive role storage and lookup for `admin`, `dm`, and `player`.
- [x] 3.2 Add authorization guards for admin-only and DM-only operations in backend-facing flows.
- [x] 3.3 Update UI affordances so role-restricted actions are only exposed to authorized users.

## 4. Dungeon library persistence

- [ ] 4.1 Add Convex-backed dungeon library records with ownership and metadata needed for listing and retrieval.
- [ ] 4.2 Implement explicit manual save and load flows that translate between local editor state and latest-only durable dungeon records.
- [ ] 4.3 Preserve compatibility for existing serialized dungeon payloads and document any required compatibility mapping.
- [ ] 4.4 Update save/load UI to distinguish local editor state from backend-saved dungeon state.

## 5. Session membership and server integration

- [ ] 5.1 Implement durable play-session creation, join mechanism generation, and membership persistence in Convex.
- [ ] 5.2 Replace localhost-derived DM/player authority in `server/` with authenticated membership checks.
- [ ] 5.3 Connect session join/share flows in the authenticated app to the new backend-backed session model.
- [ ] 5.4 Verify Colyseus room access and protected session actions honor authenticated membership rather than client locality.

## 6. Character library foundation

- [ ] 6.1 Add Convex-backed player character records owned by authenticated users.
- [ ] 6.2 Implement character library list/create/update/delete flows in the authenticated app without coupling character identity to placed map objects.
- [ ] 6.3 Add reference plumbing so sessions and future map flows can point at persistent character records.

## 7. Content pack registry and pack interop

- [ ] 7.1 Define canonical pack metadata models for asset packs and rules/data packs under a shared registry shape.
- [ ] 7.2 Implement admin-only pack registration, workspace-scoped activation, visibility modes (`global`, `public`, `private`), and file-reference storage flows.
- [ ] 7.3 Introduce canonical `packId:localId` content references for newly persisted pack-managed records.
- [ ] 7.4 Add compatibility handling for existing flat asset IDs and runtime-generated character assets where namespaced refs are not yet available.

## 8. Validation and regression coverage

- [ ] 8.1 Add or update unit tests covering auth, role checks, dungeon library behavior, session membership, character ownership, pack reference handling, and authenticated app shell routing.
- [ ] 8.2 Add or update integration or e2e coverage for sign-in, dungeon save/load, and session join flows using existing test infrastructure.
- [ ] 8.3 Run `pnpm run test` and `pnpm run build` after implementation updates.
- [ ] 8.4 Run `pnpm run verify` before considering the change ready to archive.
