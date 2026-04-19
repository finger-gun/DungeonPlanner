## 1. Outdoor texture paint state and data model

- [ ] 1.1 Add outdoor-only ground texture paint state and actions to `src/store/useDungeonStore.ts` (paint, erase, and default/reset behavior gated by `mapMode === 'outdoor'`).
- [ ] 1.2 Define terrain texture type identifiers and brush selection state for outdoor mode, including safe defaults for existing maps.
- [ ] 1.3 Extend dungeon serialization/deserialization in `src/store/serialization.ts` with version bump and migration-safe defaults for missing outdoor texture paint data.

## 2. Outdoor editor UX integration

- [ ] 2.1 Add outdoor-only texture brush controls to the room/terrain panel, ensuring indoor UI remains unchanged.
- [ ] 2.2 Wire outdoor brush strokes in grid interaction flow to call new outdoor texture paint actions while preserving existing blocked-cell paint behavior.
- [ ] 2.3 Keep existing tool/camera interaction semantics unchanged (drag paint/erase flow, no new toolbar mode required).

## 3. Outdoor ground rendering and blending

- [ ] 3.1 Refactor outdoor ground rendering into a dedicated component/material path and gate it to outdoor mode only.
- [ ] 3.2 Implement multi-texture outdoor ground sampling with automatic blending between neighboring painted texture types.
- [ ] 3.3 Integrate initial outdoor texture assets and confirm deterministic mapping/alignment across paint, render, and reload cycles.

## 4. Validation and regression safety

- [ ] 4.1 Add/extend unit tests for store and serialization behavior covering outdoor texture paint write/erase and save/load migration defaults.
- [ ] 4.2 Add/extend UI/interaction tests for outdoor-only control visibility and brush behavior boundaries between outdoor and indoor modes.
- [ ] 4.3 Run `pnpm run test` and `pnpm run build`; if broader regression risk appears, run `pnpm run verify`.
