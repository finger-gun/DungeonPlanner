## Why

DungeonPlanner's outdoor sculpting currently deforms a continuous terrain plane with interpolated cell heights. That produces natural-looking hills, but it is less readable and less game-friendly than a stepped terrain model that matches the editing grid. It also does not fit the newly available KayKit forest hill kit, which is authored around grass-topped plateaus, cliff walls, and modular corners.

We want outdoor terrain to feel authored, tactical, and visually cohesive: raising terrain should create stepped hills and plateaus, lowering terrain should create pits and trenches with inward cliff walls, and the default outdoor ground should use the new green grass hill-top look. The new terrain assets currently live in `forrest-assets-tmp/KayKit_Forest_Nature_Pack_1.0_EXTRA/Assets` and should be brought into maintained project paths as part of this change.

## What Changes

- Replace the outdoor terrain presentation model from continuous interpolated heights to discrete signed terrain levels per grid cell for outdoor maps.
- Rebuild outdoor sculpting so raise/lower editing creates stepped hills, plateaus, pits, and trenches while preserving the existing brush-driven grid interaction model.
- Replace the current outdoor ground plane/texturing workflow with asset-derived terrain rendering that uses grass tops and cliff sides from the new KayKit forest hill kit.
- Redefine outdoor ground painting around stepped terrain top-surface appearance, with default unpainted terrain using the green grass hill-top style.
- Add maintained content-pack sourcing and metadata coverage for the new outdoor hill, cliff, and top-surface terrain assets, starting with the default `Color1` palette.
- Define migration behavior so existing outdoor terrain and outdoor ground paint data load safely into the new stepped terrain model.

**In scope**
- Outdoor-only stepped terrain data, sculpting behavior, rendering, and persistence
- Lowered terrain rendering as pits/trenches with inward cliff faces
- Default outdoor top-surface appearance and stepped terrain surface painting behavior
- Committed project sourcing for required hill/cliff assets and sidecar files

**Out of scope**
- Indoor map rendering or editing changes
- Full voxel occupancy systems such as caves, overhangs, or destructible underground volumes
- Multi-palette authoring beyond the default `Color1` terrain palette
- Elevation-aware movement, line-of-sight, or combat-rule changes beyond keeping placement support consistent

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `outdoor-terrain-sculpting`: Replace continuous outdoor terrain deformation with discrete signed stepped terrain levels, including raised hills and lowered pits with cliff-derived rendering.
- `outdoor-ground-texture-paint`: Replace blended plane-based ground texturing with stepped top-surface painting and default green grass top surfaces that stay aligned to stepped terrain.
- `outdoor-content-pack-assets`: Extend the curated outdoor asset set and sourcing rules to include the maintained hill/cliff terrain kit used by stepped outdoor terrain rendering.

## Impact

- Affected areas include `src/store/outdoorTerrain.ts`, `src/store/useDungeonStore.ts`, `src/store/serialization.ts`, `src/components/canvas/OutdoorGround.tsx`, `src/components/canvas/Grid.tsx`, outdoor editor panels, and outdoor terrain tests.
- Content-pack work will add or register maintained hill/cliff/top assets sourced from the forest asset pack under non-temporary project paths.
- Compatibility risk is moderate around saved outdoor terrain height data and outdoor ground paint data because the semantics change from smooth plane deformation to stepped terrain levels.
- UX impact should improve outdoor readability, sculpt predictability, and asset cohesion for encounter prep.
