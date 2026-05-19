## Why

DungeonPlanner now has a capable spline/procedural wall pipeline, but core editing, placement, LOS, movement, and passage behavior still depend on the old cardinal `wallKey` wall model. That split blocks reliable diagonal and rounded walls, forces fragile bridges between systems, and keeps user-facing behaviors like doors, wall props, and room traversal from matching the geometry that is actually rendered.

This change removes the legacy wall system as an authoritative runtime model and makes spline/procedural walls the single source of truth for indoor wall behavior. The result is faster-to-understand editing, more predictable placement on curved and diagonal walls, and gameplay behavior that matches the visible room shape.

## What Changes

- Replace the legacy indoor wall runtime model (`wallKey`, grid-derived wall segments, open-wall segment sets, cardinal wall queries) with spline/procedural wall graph data as the canonical wall source.
- Migrate editing and placement workflows so wall selection, wall painting/variants, openings, shared passages, and wall-mounted props operate on spline segments and cutouts instead of grid wall keys.
- Add spline-native geometry queries for nearest wall sampling, wall crossing tests, room containment, and cutout lookup so doors, props, LOS, movement, and occlusion all use the same wall geometry.
- Rework wall openings and door placement so authored openings can sit correctly on straight, diagonal, and rounded spline walls.
- Update movement and visibility behavior so traversal and LOS respect rounded/diagonal walls and room interiors instead of approximating only cardinal boundaries.
- Add migration/update paths for persisted dungeons that still carry legacy wall-oriented data.
- Remove obsolete legacy wall code once dependent systems have been migrated.

### In Scope

- Indoor wall authoring, selection, rendering, openings, shared walls, wall-mounted prop snapping, LOS, movement gating, fog/light occlusion inputs, and related serialization/migration.
- Cleanup and deletion of legacy wall modules once spline-native replacements are in place.
- UX updates needed to preserve editing speed and readable placement behavior while using spline segments instead of cardinal wall keys.

### Out of Scope

- Outdoor terrain or outdoor walling systems.
- Replacing the spline wall renderer with a different rendering architecture.
- New door gameplay states beyond making existing openings/doors work correctly on spline walls.
- Unrelated asset browser or authentication work outside wall-targeted placement behavior.

## Capabilities

### New Capabilities
- `procedural-wall-authoring`: Define spline/procedural walls as the canonical indoor wall system for editing, openings, shared boundaries, and serialization.
- `procedural-wall-gameplay-queries`: Define spline-native room and wall queries for LOS, movement containment, and wall-driven occlusion behavior.
- `procedural-wall-surface-snapping`: Define smooth wall-targeted placement for doors, wall-mounted props, and other surface assets on straight, diagonal, and rounded walls.

### Modified Capabilities
- `unified-asset-placement`: Door and other wall-targeted asset placement requirements change so valid targets and placement behavior derive from spline wall geometry instead of only cardinal wall replacements.

## Impact

- **Affected systems:** `useDungeonStore`, spline wall graph/query utilities, wall/opening placement flows, prop snapping, LOS and movement systems, fog/light occlusion inputs, rendering caches, serialization, and editor inspectors.
- **Affected code:** `Grid.tsx`, `propPlacement.ts`, `playVisibility*.ts`, `playMovement.ts`, `splineWallGraph.ts`, `splineWalls.ts`, `wallOpeningDerived.ts`, `floorRenderDerived.ts`, plus legacy wall helpers targeted for deletion.
- **UX impact:** Wall placement and inspection should become more consistent with visible geometry; doors and wall props should attach cleanly to curved/angled walls; movement/LOS should better match actual room boundaries.
- **Compatibility risk:** Existing saves may still contain legacy wall-key based opening or wall-surface data and require migration on load before legacy wall code can be fully removed.
