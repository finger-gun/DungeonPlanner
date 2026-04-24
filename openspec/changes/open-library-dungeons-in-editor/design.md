## Context

The authenticated app already stores durable private dungeon records in Convex, but the user-facing library still exposes an internal draft-editing interface. The main editor already has the right loading seam through `useDungeonStore().loadDungeon(json)` and should remain local-first when opened without backend context. The missing piece is a secure handoff from the authenticated app to the editor so a saved dungeon can be opened by reference instead of by copying JSON between surfaces.

## Goals / Non-Goals

**Goals:**
- Let authenticated users view their saved dungeon list in `app/` and open a selected dungeon in the main editor.
- Let the main editor keep using that same private library for save, open, copy, and delete actions after launch when backend access is available.
- Keep saved dungeons private; the editor handoff must not require making dungeon payloads public.
- Keep the editor working exactly as it does today when no backend handoff parameters are present or when backend access is unavailable.
- Replace the current user-facing dungeon-library draft editor with a simpler library/open flow.

**Non-Goals:**
- Unifying the public editor and authenticated app into a single deployed surface.
- Changing dungeon serialization format or adding revision history.

## Decisions

### Use a short-lived editor session token instead of direct public dungeon fetches
The authenticated app will issue a short-lived editor session token tied to the signed-in viewer and active workspace. The editor deep link will include that temporary token, the backend URL, and optionally the dungeon ID to open immediately. The token then authorizes editor-side library list/open/save/copy/delete HTTP endpoints without exposing private dungeon data publicly.

Alternative considered:
- Direct public HTTP fetch by dungeon ID. Rejected because private dungeons would become guessable or require weaker access control.

### Load and persist editor access through URL query parameters
The main editor bootstrap will inspect URL query parameters for an editor access payload. When present, it will persist the backend URL plus temporary editor token for the current browser tab, optionally open the referenced dungeon immediately, and then remove the launch parameters from the URL. The editor file menu will use that session to drive its remote library modal and save flow.

Alternative considered:
- Embedding serialized dungeon JSON directly in the editor URL. Rejected because URLs would become large and leak private dungeon data.

### Preserve local-first fallback by treating backend access as optional
If no editor access parameters are present, or if backend access cannot be completed, the editor will continue with its existing startup behavior. That keeps local file import, browser persistence, and anonymous editing intact.

Alternative considered:
- Blocking editor startup on remote fetch completion. Rejected because it would degrade the local-first editor experience and create avoidable failures.

### Simplify the authenticated dungeon library into a launcher surface
The authenticated library page will focus on listing owned dungeons with per-card actions to open, copy, or delete them, plus creating a new blank editor session. The current manual JSON draft editor becomes inappropriate for the primary user-facing library and should no longer be the main library interaction.

### Share the editor launch and dungeon record contract between app and editor
The app and editor will share the launch-query contract and the saved-dungeon summary/record types from a common module so the app cards, editor modal, and launch bootstrap stay aligned while the product surfaces are still separate workspaces.

## Risks / Trade-offs

- **[Risk]** Temporary editor session tokens could remain valid too long. → **Mitigation:** store them server-side, expire them aggressively, and scope them to the signed-in viewer plus active workspace.
- **[Risk]** The editor may open before remote dungeon fetch completes. → **Mitigation:** load through startup effect and only apply remote payload when fetch succeeds; otherwise leave the editor in its normal local state.
- **[Risk]** Local development uses separate ports for app and editor. → **Mitigation:** build the editor launch URL from environment/default host rules and pass the backend URL explicitly in the handoff query.
- **[Risk]** Users may still need manual JSON tools for debugging. → **Mitigation:** keep developer-oriented flows in the hidden Dev surface rather than in the primary library page.
