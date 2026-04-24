## Context

The authenticated app already stores durable private dungeon records in Convex, but the user-facing library still exposes an internal draft-editing interface. The main editor already has the right loading seam through `useDungeonStore().loadDungeon(json)` and should remain local-first when opened without backend context. The missing piece is a secure handoff from the authenticated app to the editor so a saved dungeon can be opened by reference instead of by copying JSON between surfaces.

## Goals / Non-Goals

**Goals:**
- Let authenticated users view their saved dungeon list in `app/` and open a selected dungeon in the main editor.
- Keep saved dungeons private; the editor handoff must not require making dungeon payloads public.
- Keep the editor working exactly as it does today when no backend handoff parameters are present or when backend access is unavailable.
- Replace the current user-facing dungeon-library draft editor with a simpler library/open flow.

**Non-Goals:**
- Full authenticated save-back from the main editor to Convex.
- Unifying the public editor and authenticated app into a single deployed surface.
- Changing dungeon serialization format or adding revision history.

## Decisions

### Use a short-lived editor access ticket instead of direct public dungeon fetches
The authenticated app will issue a short-lived ticket tied to a specific viewer-owned dungeon. The editor deep link will include the dungeon ID plus the temporary ticket and backend URL. This preserves private ownership rules while avoiding a long-lived public URL.

Alternative considered:
- Direct public HTTP fetch by dungeon ID. Rejected because private dungeons would become guessable or require weaker access control.

### Load the dungeon in the main editor through URL query parameters
The main editor bootstrap will inspect URL query parameters for an editor handoff payload. When present, it will attempt to fetch the dungeon JSON from the backend handoff endpoint and call the existing store `loadDungeon(json)` path.

Alternative considered:
- Embedding serialized dungeon JSON directly in the editor URL. Rejected because URLs would become large and leak private dungeon data.

### Preserve local-first fallback by treating backend handoff as optional
If no handoff parameters are present, or if the backend handoff cannot be completed, the editor will continue with its existing startup behavior. That keeps local file import, browser persistence, and anonymous editing intact.

Alternative considered:
- Blocking editor startup on remote fetch completion. Rejected because it would degrade the local-first editor experience and create avoidable failures.

### Simplify the authenticated dungeon library into a launcher surface
The authenticated library page will focus on listing owned dungeons and opening them in the editor, plus creating a new blank editor session. The current manual JSON draft editor becomes inappropriate for the primary user-facing library and should no longer be the main library interaction.

## Risks / Trade-offs

- **[Risk]** Temporary access tickets could be reused if not consumed or expired aggressively. → **Mitigation:** store tickets server-side, expire them quickly, and mark them consumed on successful fetch.
- **[Risk]** The editor may open before remote dungeon fetch completes. → **Mitigation:** load through startup effect and only apply remote payload when fetch succeeds; otherwise leave the editor in its normal local state.
- **[Risk]** Local development uses separate ports for app and editor. → **Mitigation:** build the editor launch URL from environment/default host rules and pass the backend URL explicitly in the handoff query.
- **[Risk]** Users may still need manual JSON tools for debugging. → **Mitigation:** keep developer-oriented flows in the hidden Dev surface rather than in the primary library page.
