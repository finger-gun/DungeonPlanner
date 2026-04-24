## Why

The current authenticated dungeon library is still a developer-facing draft editor instead of a user-facing library. Users need to open their saved dungeons directly in the main editor, while keeping the editor fully usable when no authenticated backend is present.

## What Changes

- Replace the authenticated library's in-app draft editing flow with a user-facing list of owned dungeons and actions that open the main editor.
- Add a backend-aware editor deep-link flow that accepts a dungeon reference, fetches the saved dungeon when a valid backend handoff is available, and otherwise preserves the editor's current local-file and local-storage behavior.
- Add a short-lived authenticated handoff from the app to the editor so private dungeons can be opened securely without making them public.
- Extend the editor itself so Save and Open switch to the authenticated dungeon library when backend access is available, while keeping manual JSON import/export available as a local fallback.
- Update the app library cards, editor bootstrap, shared launch contracts, and related tests to cover open, copy, delete, and save flows across both surfaces.

## Capabilities

### New Capabilities
- `editor-dungeon-handoff`: Securely open a saved authenticated-app dungeon in the main editor through a backend-aware deep link.

### Modified Capabilities
- `dungeon-library`: Change authenticated dungeon-library behavior so saved dungeons open in the main editor instead of the current in-app draft editor workflow.
- `editor-dungeon-handoff`: Persist backend-aware editor access after launch so the editor can list, open, save, copy, and delete the viewer's private dungeon records.

## Impact

- Affected code: `app/src/App.tsx`, `app/src/App.test.tsx`, `app/convex/dungeons.ts`, `app/convex/http.ts`, `app/convex/schema.ts`, `shared/`, `src/App.tsx`, `src/components/editor/EditorToolbar.tsx`, editor/store tests, and related helpers.
- Affected systems: authenticated app shell, Convex dungeon persistence, main editor bootstrap, editor file menu flows, and URL-based editor entry.
- Compatibility: no dungeon serialization migration is required; the editor continues to accept the existing portable dungeon JSON shape.
