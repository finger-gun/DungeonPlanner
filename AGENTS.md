# AGENTS.md — Dungeon Planner

Guidelines for AI coding agents working in this codebase.

## Product Vision

- DungeonPlanner is a **fast, visual 3D prep tool** for tabletop RPG encounters.
- Prioritize **editing speed, clarity, and reliability** over novelty.
- Keep UX focused on:
  - quick dungeon layout creation
  - readable scene presentation for players
  - smooth camera/navigation and predictable tool behavior

## Stack

- **React + React Three Fiber** for rendering — prefer R3F primitives over raw Three.js imperative code.
- **Three.js WebGPURenderer** — use TSL (Three Shading Language) for custom materials, not GLSL.
- **Zustand** for state — all dungeon state lives in `src/store/useDungeonStore.ts`. Add actions there, never mutate state outside the store.
- **Tailwind CSS** — styling only via utility classes, no inline styles except dynamic values (e.g. `style={{ opacity }}`).
- **Monorepo tooling** — `pnpm` workspaces + `turbo`.

## Commands

```bash
pnpm run dev          # start app dev server
pnpm run server       # start multiplayer server dev mode
pnpm run dev:full     # start app + server with Turborepo
pnpm run build        # TypeScript check + Vite build (run before committing)
pnpm run build:all    # build all workspace packages with Turborepo
pnpm run lint         # ESLint (app)
pnpm run lint:all     # lint across workspace (Turborepo)
pnpm run verify       # lint + unit tests + build + e2e (full gate)
pnpm run test         # Vitest unit tests
pnpm run test:e2e     # Playwright e2e tests
```

Always run `pnpm run build` after changes to catch TypeScript errors before committing.

## CI and Deployment

- CI workflow: `.github/workflows/ci.yml` (PR validation: tests + build)
- Code scanning: `.github/workflows/codeql.yml`
- Production deploy: `.github/workflows/deploy-pages.yml` (AWS S3 + CloudFront for `demo.dungeonplanner.com` and `docs.dungeonplanner.com`)

## Architecture

- `src/store/useDungeonStore.ts` — single source of truth: rooms, cells, floors, openings, props, settings.
- `src/components/canvas/` — Three.js/R3F components rendered inside the `<Canvas>`.
- `src/components/editor/` — React UI panels rendered outside the canvas (DOM).
- `src/content-packs/core/` — asset definitions. Each asset exports `metadata` with `category`, `connectsTo`, `lightConfig`, etc.
- `src/store/serialization.ts` — save/load format. Bump `CURRENT_VERSION` and add a migration when the format changes.
- `server/` — multiplayer/backend package (`dungeonplanner-server`).

## Key Conventions

- **Multi-floor**: floors have a `level` (0 = ground, +N = above, -N = cellar). Active floor state is live in the store; inactive floors store snapshots in `floors[id].snapshot`.
- **Openings vs Props**: wall-connected assets use `placeOpening()` and render via `OpeningRenderer`. Floor-connected assets (stairs, etc.) use `placeObject()`. The distinction is `metadata.connectsTo === 'WALL'` vs `'FLOOR'`.
- **Render loop**: Canvas runs `frameloop="demand"`. Always call `invalidate()` after any change that needs a repaint. `FrameDriver` handles the FPS-limited interval.
- **Object registry**: use `registerObject` / `unregisterObject` / `getRegisteredObject` instead of `scene.traverse()` for selection and outline effects.
- **Animations**: `AnimatedTileGroup` self-unsubscribes via `doneRef` once the build animation finishes — don't add `useFrame` work that runs forever for static objects.

## Tests
- Always write test to cover new functionality.
- When you touch old code that doesn't have tests, improve the coverage.
- Prefer existing test commands (`pnpm run test`, `pnpm run test:e2e`, `pnpm run verify`) over ad-hoc scripts.

## Commits
- Never push to remote unless explicitly asked.
