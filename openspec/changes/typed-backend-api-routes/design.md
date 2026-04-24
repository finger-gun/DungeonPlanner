## Context

The authenticated app currently reaches Convex through a backend facade that accepts a function name and arguments from the browser. That keeps React call sites small, but it also makes the backend boundary broad: any reachable Convex function name can become a browser-facing operation if it is passed through the facade.

DungeonPlanner should keep the stronger part of the current model: browser clients rely on the server for authenticated Convex access, and the server owns the Convex token exchange. The change is to make the browser-facing HTTP API explicit so routes can be reviewed, documented, tested, and authorized as product operations.

## Goals / Non-Goals

**Goals:**
- Replace arbitrary browser-provided Convex function forwarding with allowlisted backend routes.
- Keep authenticated app workflows unchanged from a user's perspective.
- Keep server-owned Convex token handling and retry-on-expired-token behavior.
- Update the app and editor clients to use explicit route names.
- Move editor handoff routes under an `/api/...` namespace so backend routes are recognizable as application APIs.

**Non-Goals:**
- Redesigning Convex schemas, indexes, or access-control rules.
- Moving business logic out of Convex functions.
- Changing dungeon serialization or requiring a migration.
- Replacing the existing React data hooks with a full generated client.

## Decisions

### Use explicit routes while preserving the current React hook interface

The app data layer will continue to expose `useQuery` and `useMutation` wrappers to existing React modules, but those wrappers will map known Convex function references to fixed HTTP routes. Unknown function names will fail before a network request is sent.

Alternative considered:
- Rewrite every app call site to call endpoint-specific functions. Rejected for this slice because it increases churn without improving the backend security boundary beyond the allowlist map.

### Keep server-side Convex calls hard-coded per route

Each backend route will call one known Convex query or mutation from server code. The browser supplies only the operation's arguments, not the Convex function name.

Alternative considered:
- Keep the generic route and validate against an allowlist on the server. Rejected because the route shape would still advertise a generic function execution surface and make logs, tests, and documentation less clear.

### Keep the existing response envelope for app data

Authenticated app routes will continue to return `{ value }` for query and mutation results. That keeps loading and mutation invalidation behavior stable while the transport changes.

Alternative considered:
- Return resource-specific response objects immediately. Deferred because it would create more UI churn and can be done later route by route.

### Namespace editor handoff routes as backend API routes

The editor will call `/api/editor/dungeons/...`, `/api/editor/actors/list`, and `/api/session-access/consume` on the backend facade. The backend can continue proxying those calls to Convex HTTP actions internally.

Alternative considered:
- Rename Convex HTTP action paths in the same change. Deferred because those paths are an internal server-to-Convex contract when the editor uses the backend facade, and changing them does not affect the browser-facing API boundary.

## Risks / Trade-offs

- **[Risk]** Missing a currently used Convex operation in the allowlist can break a page. -> **Mitigation:** add route-map tests and run app build/type checks.
- **[Risk]** Route names could drift from product concepts. -> **Mitigation:** keep route names resource-oriented and document them in the architecture guide.
- **[Trade-off]** The React hooks still accept Convex function references. This preserves app ergonomics, but the public browser API is now constrained by a route map rather than by arbitrary function names.
