# Developer Guide

This guide helps contributors get productive quickly.

## Local setup

```bash
pnpm install
pnpm run dev
```

App: `http://localhost:5173`

Useful commands:

```bash
pnpm run dev:full     # app + server
pnpm run test         # unit tests
pnpm run build        # app build
pnpm run build:all    # workspace build
pnpm run verify       # lint + test + build + e2e
```

## Where to start

- State source of truth: `src/store/useDungeonStore.ts`
- Canvas runtime: `src/components/canvas/`
- Editor UI: `src/components/editor/`
- Assets/content packs: `src/content-packs/`
- Serialization: `src/store/serialization.ts`

## Key conventions

- Keep dungeon mutations in the Zustand store actions.
- Use content-pack metadata (`connectsTo`, `light`, etc.) instead of hardcoding behavior.
- Preserve multi-floor behavior and transitions when changing rendering or tools.
- Update migrations when changing serialized format.

## Reference docs

- [Architecture](./architecture.md)
- [State & Store](./store.md)
- [Content Packs](./content-packs.md)
- [Rendering](./rendering.md)
- [Editor UI](./ui.md)
- [File Format](./file-format.md)
