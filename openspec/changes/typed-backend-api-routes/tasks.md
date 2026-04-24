## 1. OpenSpec

- [x] 1.1 Add design, capability deltas, and an implementation task checklist for typed backend API routes.

## 2. Backend facade

- [x] 2.1 Replace generic `/api/app/query` and `/api/app/mutation` handlers with explicit `/api/app/...` routes for all authenticated app operations currently used by `app/`.
- [x] 2.2 Keep server-owned Convex auth tokens, including retry with a fresh token when Convex rejects an expired authenticated call.
- [x] 2.3 Move editor-facing facade routes to `/api/editor/...` and `/api/session-access/...` while preserving the existing Convex HTTP action behavior internally.

## 3. App and editor clients

- [x] 3.1 Update `app/` data transport to map known Convex function references to explicit backend routes and reject unsupported operations before fetch.
- [x] 3.2 Update `src/` editor dungeon and actor handoff clients to call the new `/api/editor/...` route namespace.
- [x] 3.3 Update route-level docs for the backend API boundary.

## 4. Validation

- [x] 4.1 Add or update tests that prove app data hooks use explicit routes and editor clients call the new route namespace.
- [x] 4.2 Run targeted tests for changed app/editor transport code.
- [x] 4.3 Run build checks for the touched workspaces, or document any pre-existing blockers.
