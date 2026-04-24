## 1. OpenSpec and backend handoff

- [x] 1.1 Add a short-lived dungeon editor access-ticket model and backend consume route for opening private saved dungeons in the editor.
- [x] 1.2 Add or update backend tests for dungeon handoff access control and ticket consumption behavior.

## 2. Editor loading flow

- [x] 2.1 Update the main editor bootstrap to read dungeon handoff query parameters and load the remote dungeon payload through the existing store load path.
- [x] 2.2 Preserve normal local editor startup when no backend handoff is present or when the remote load cannot be completed.

## 3. Authenticated app library UX

- [x] 3.1 Replace the current user-facing dungeon library draft editor with a simpler owned-dungeon listing and open-in-editor flow.
- [x] 3.2 Add a clear path to open a blank editor session alongside opening an existing saved dungeon.

## 4. Validation

- [x] 4.1 Update app and editor tests for library launch, deep-link loading, and fallback behavior.
- [x] 4.2 Run the relevant existing checks, including `pnpm exec vitest run app/src/App.test.tsx app/convex/*.test.ts src/App.test.tsx` and `pnpm run app:build` plus `pnpm run build`.
