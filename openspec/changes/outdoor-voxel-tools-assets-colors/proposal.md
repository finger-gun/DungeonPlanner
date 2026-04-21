## Why

Outdoor terrain currently mixes stepped heights with flat texture-driven ground, which limits visual readability and does not leverage the new KayKit forest terrain asset set and color variants. We need a voxel-aligned outdoor workflow so GMs can sculpt tactical elevation quickly while keeping terrain visuals consistent with the new asset pack.

## What Changes

- Replace outdoor terrain surface rendering with a chunked voxel-style terrain representation that supports block elevation and exposed-face generation for performance.
- Keep outdoor sculpt tooling fast and familiar by mapping elevate/lower strokes to voxel-aligned height changes on grid cells.
- Add outdoor terrain palette controls so users can select terrain color variants (Color1-Color8), including default palette behavior for new maps.
- Expand outdoor asset ingestion and registry coverage to include missing hill/cliff/terrain pieces plus new tree/rock/bush color variations from the provided pack.
- Update surroundings/terrain brush behavior to use the expanded asset pools and selected color palette while preserving deterministic placement behavior.
- Update ground/texture painting behavior to integrate with terrain palettes and voxel terrain material resolution, with default base ground set to green grass.
- Keep indoor map workflows and rendering behavior unchanged.
- In scope: outdoor terrain rendering/state/tooling, outdoor asset ingestion/registry, outdoor palette-aware texture behavior, and outdoor serialization/migration updates.
- Out of scope: indoor terrain conversion to voxel workflow, cave/overhang volumetric editing beyond column-based terrain, and non-outdoor asset system rewrites.

## Capabilities

### New Capabilities

- `outdoor-voxel-terrain`: Defines chunked voxel-style outdoor terrain rendering and data handling for block elevation workflows.
- `outdoor-terrain-palette-variants`: Defines user-selectable outdoor terrain color variant palettes and their application across terrain tools.

### Modified Capabilities

- `outdoor-terrain-sculpting`: Changes sculpt semantics to voxel-aligned elevation edits with chunk-aware updates and consistent placement support.
- `outdoor-ground-texture-paint`: Changes outdoor ground painting requirements to work with terrain palettes and voxel terrain face/material resolution.
- `outdoor-content-pack-assets`: Expands required outdoor asset ingestion/registration to include missing hill/cliff terrain pieces and additional color variants for trees/rocks/bushes.
- `outdoor-map-mode`: Updates outdoor tool behavior requirements to include voxel elevation flow, palette controls, and default green-grass base terrain behavior.

## Impact

- Affected systems: `src/store/useDungeonStore.ts`, outdoor terrain rendering/components, outdoor editor tool panels, content pack registration/metadata, and serialization/migrations.
- Data compatibility: outdoor terrain serialization format and migrations will be affected; legacy outdoor maps must load safely with deterministic defaults.
- Performance considerations: chunked rebuilds, face culling, and dirty-region updates are required to keep outdoor editing responsive.
