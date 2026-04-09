# DungeonPlanner

Web-first dungeon editor scaffold built with Vite, React, TypeScript, React Three Fiber, Zustand, and Tailwind CSS.

## Run

```bash
npm install
npm run dev
```

The dev server usually starts at `http://localhost:5173`.

## Verification

After any implementation run, use the full verification command:

```bash
npm run verify
```

That sequence runs:

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

## Headless Playwright Debugging

Playwright is configured to launch Chromium headlessly against the local Vite dev server.

Run the smoke suite with:

```bash
npm run test:e2e
```

Useful variants:

```bash
npm run test:e2e:headed
npx playwright show-report
```

Current smoke coverage:

- page loads without page or console errors
- canvas is visible
- debug bridge can place and remove snapped objects in headless runs
- toolbar undo/redo works

Artifacts on failure are retained through Playwright traces, screenshots, and video.

Note:

- Headless Chromium can be unreliable for real GPU-backed canvas interaction.
- The Playwright suite uses a dev-only `window.__DUNGEON_DEBUG__` bridge for deterministic editor-state validation while still running the real app in a browser.

## Project Structure

```text
src/
  assets/models/         Raw GLB files
  components/canvas/     R3F scene, grid, controls, object rendering
  components/editor/     Sidebar, toolbar, inspector
  generated/             gltfjsx output target
  hooks/                 Grid snapping and raycaster helpers
  store/                 Zustand dungeon editor state
```

## GLB Workflow

Core pack source models currently come from `/Users/roblibob/Projects/models` and are copied into `src/assets/models/core/`.

Rebuild the core pack and generated JSX wrappers with:

```bash
npm run generate:content-pack:core
```

Generated outputs land in `src/generated/content-packs/core/`, and the pack registry is exposed from `src/content-packs/core/`.
