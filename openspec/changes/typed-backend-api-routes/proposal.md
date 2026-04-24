## Why

The authenticated app currently calls the backend facade with arbitrary Convex function names and argument objects. That keeps early development fast, but it makes the browser API surface hard to audit and increases the chance that a newly added Convex function becomes reachable through a generic proxy instead of a deliberate product endpoint.

Game Masters and players should not see a UX change from this refactor. The expected impact is platform reliability: account, library, session, pack, actor, and editor handoff flows continue to behave the same while the backend boundary becomes explicit and easier to secure.

## What Changes

- Replace `/api/app/query` and `/api/app/mutation` usage with explicit backend routes for each authenticated app operation currently used by `app/`.
- Keep server-owned Convex auth cookies and server-side Convex calls; browsers still do not talk directly to Convex for authenticated app data.
- Update the app data transport so existing React call sites can map known Convex function references to explicit HTTP endpoints.
- Move editor-facing backend facade endpoints under explicit `/api/editor/...` and `/api/session-access/...` paths and update the editor clients in `src/`.
- Keep existing user-facing workflows intact: sign-in, workspace bootstrap, dungeon library actions, session tickets, pack management, actor management, and editor library operations.
- Do not change the portable dungeon serialization format.

## Capabilities

### New Capabilities
- `typed-backend-api-routes`: The browser-facing backend API exposes allowlisted typed routes instead of a generic Convex function-name proxy.

### Modified Capabilities
- `authenticated-app-shell`: Authenticated app modules continue to load through the backend facade, but the facade is constrained to explicit operations.
- `dungeon-library`: Editor and app dungeon library operations continue to work through backend-owned access tokens on explicit editor API routes.
- `play-sessions`: Session access ticket consumption continues through the backend facade on an explicit session access route.

## Impact

- Affected code: `server/src/appFacade.ts`, `app/src/lib/backendData.tsx`, `app/src/lib/backendData.test.tsx`, `src/lib/editorDungeonHandoff.ts`, `src/lib/editorDungeonHandoff.test.ts`, and `src/lib/editorActors.ts`.
- Affected APIs: replaces generic `/api/app/query` and `/api/app/mutation`; introduces allowlisted `/api/app/...` routes and `/api/editor/...` routes.
- Compatibility: no dungeon file migration is required. Backend endpoint paths used by the current app/editor clients are updated together.
- Risk: this touches cross-surface integration paths, so regression coverage should focus on authenticated data fetching, mutations, file upload, editor dungeon library calls, actor listing, and session access consumption.
