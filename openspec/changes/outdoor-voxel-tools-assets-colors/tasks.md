## 1. Terrain data and rendering foundation

- [ ] 1.1 Add outdoor voxel-column terrain state structures and helpers in `src/store/useDungeonStore.ts` and related terrain utility modules.
- [ ] 1.2 Implement chunk partitioning, dirty-chunk tracking, and neighbor invalidation rules for outdoor terrain edits.
- [ ] 1.3 Replace `OutdoorGround` flat/heightfield mesh generation with voxel-aligned exposed-surface generation suitable for chunk-local rebuilds.
- [ ] 1.4 Preserve indoor rendering path (`DungeonRoom`, batched tile flows) with no behavior changes while enabling voxel terrain only for outdoor mode.

## 2. Elevation tools and placement consistency

- [ ] 2.1 Update outdoor sculpt/elevate tool behavior to apply voxel-aligned raise/lower steps from brush strokes.
- [ ] 2.2 Ensure hover previews, prop placement, and character support heights resolve from voxel terrain support cells.
- [ ] 2.3 Re-anchor existing outdoor ground-supported objects when terrain under their support cells changes.

## 3. Asset ingestion and registry expansion

- [ ] 3.1 Import missing outdoor terrain asset families (hill/cliff/top and related terrain pieces) from the provided pack into maintained project asset paths.
- [ ] 3.2 Add missing tree/rock/bush color variant assets and metadata registrations for supported outdoor families.
- [ ] 3.3 Update outdoor content-pack/browser metadata so new terrain assets and variants are discoverable by outdoor tools.
- [ ] 3.4 Verify runtime asset references do not point to temporary import folders and resolve required `.gltf` sidecar files.

## 4. Palette and texture workflow updates

- [ ] 4.1 Add outdoor terrain palette state and UI controls (Color1-Color8) with default initialization behavior.
- [ ] 4.2 Apply selected palette consistently across voxel terrain rendering, surroundings generation, and outdoor terrain-related placement visuals.
- [ ] 4.3 Update outdoor texture paint behavior so painted/unpainted cells remain coherent on voxel terrain and default base terrain remains green grass.

## 5. Serialization and migration

- [ ] 5.1 Extend serialization schema/versioning for outdoor voxel terrain and palette state.
- [ ] 5.2 Implement deterministic migration from legacy outdoor terrain/texture data to voxel-aligned state with safe defaults.
- [ ] 5.3 Confirm load/save round-trips preserve sculpted terrain, texture assignments, and palette selections.

## 6. Validation and quality gates

- [ ] 6.1 Add/update unit tests for chunk dirtying rules, voxel sculpt behavior, placement re-anchoring, and migration logic.
- [ ] 6.2 Add/update integration/e2e coverage for outdoor sculpting, palette selection, and texture workflows with new assets.
- [ ] 6.3 Run `pnpm run test` and `pnpm run build`.
- [ ] 6.4 Run `pnpm run verify` if broader regression confidence is required before merge.
