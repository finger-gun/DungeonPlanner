## 1. Terrain sculpt data model and persistence

- [x] 1.1 Add outdoor terrain heightfield state and sculpt actions to `src/store/useDungeonStore.ts`, gated to `mapMode === 'outdoor'`.
- [x] 1.2 Define outdoor sculpt brush state and safe defaults so new and existing maps start with flat terrain unless explicitly sculpted.
- [x] 1.3 Extend `src/store/serialization.ts` with versioned outdoor terrain height data and migration-safe defaults for older files.

## 2. Outdoor sculpt editing workflow

- [x] 2.1 Add outdoor-only terrain sculpt controls to the terrain/room panel for selecting sculpt mode and raise/lower behavior.
- [x] 2.2 Update outdoor pointer and brush interaction flow so sculpt strokes target the intended outdoor grid area on non-flat terrain.
- [x] 2.3 Ensure sculpting preserves existing outdoor camera/tool semantics, including demand-driven invalidation and drag-based editing.

## 3. Terrain rendering and placement support

- [x] 3.1 Refactor outdoor ground rendering to generate a sculpted terrain surface from heightfield data instead of a flat plane.
- [x] 3.2 Keep outdoor ground texture paint aligned and blended on the sculpted terrain surface.
- [x] 3.3 Update outdoor prop and character placement/preview logic so ground-supported objects stay anchored to sculpted terrain after placement and after later terrain edits.

## 4. Validation and regression safety

- [x] 4.1 Add or extend unit tests for terrain sculpt store actions and serialization migration behavior.
- [x] 4.2 Add or extend canvas/editor tests covering outdoor-only sculpt controls, grid-targeted interaction, and placement support on sculpted terrain.
- [x] 4.3 Run `pnpm run test` and `pnpm run build`; if terrain interaction regressions are hard to cover with unit tests alone, run `pnpm run verify`.
