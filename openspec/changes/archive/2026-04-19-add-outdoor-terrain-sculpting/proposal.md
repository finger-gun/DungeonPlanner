## Why

Outdoor maps can now be painted and textured, but they still read as a flat plane. Adding sculptable hills and valleys improves encounter readability, terrain storytelling, and player immersion while keeping DungeonPlanner's fast paint-and-place workflow intact for GMs.

## What Changes

- Add outdoor-only terrain sculpting so users can raise and lower ground into hills, slopes, and valleys.
- Keep the outdoor grid, cursor targeting, and brush interactions usable on sculpted terrain rather than requiring a separate modeling workflow.
- Make prop and character placement continue to work on sculpted outdoor ground, with stable anchors and predictable orientation rules.
- Preserve outdoor terrain sculpt data in save/load so shaped terrain round-trips with the rest of the map.
- Keep outdoor blocked-cell painting and ground texture painting compatible with sculpted terrain instead of splitting the scene into separate systems.
- In scope: outdoor terrain height editing, rendering/placement alignment on sculpted ground, serialization support, and regression-safe editor UX updates.
- Out of scope: indoor terrain sculpting, caves/overhangs, voxel digging, destructible runtime terrain, and freeform mesh editing outside the outdoor grid model.
- UX implications: maintain drag-based editing speed, keep camera/navigation predictable while sculpting, and preserve scene readability with clear elevation changes that do not make placement feel fragile.

## Capabilities

### New Capabilities
- `outdoor-terrain-sculpting`: Outdoor maps support authored terrain elevation changes with grid-aware editing, rendering, placement, and persistence behavior.

### Modified Capabilities
- `outdoor-ground-texture-paint`: Ground texture painting and blended rendering remain aligned and usable on sculpted outdoor terrain.

## Impact

- Affected code: `src/store/useDungeonStore.ts`, outdoor editor panels, canvas interaction flow, outdoor ground rendering/materials, placement/anchoring logic for props and characters, and serialization in `src/store/serialization.ts`.
- Affected runtime behavior: outdoor raycasts, grid/cursor projection, object placement previews, and outdoor terrain rendering will need to account for height-aware ground surfaces.
- Data compatibility: dungeon serialization will need a version bump and migration-safe defaults for older files that do not include terrain height data.
- Test impact: store, serialization, outdoor interaction, and placement regression coverage will need expansion; outdoor visual/placement behavior may also warrant e2e validation.
