## Why

DungeonPlanner's stepped outdoor terrain currently ships with a single curated terrain style: `Color1`. That gives us a solid default look, but it breaks user expectation once sculpting and painting are combined. Users expect raised plateaus, lowered pits, cliff faces, and flat ground to all reflect the terrain style currently painted in that area, not a globally fixed green kit.

The source forest pack already includes eight coordinated terrain style variants. Each style is more than a top-surface tint; it is a matched authored terrain theme with its own top, cliff, and underside colors. We need to expose those styles as part of outdoor authoring, replace the current surface-material paint model with terrain-style painting, and support soft transitions on top surfaces so neighboring styles do not meet as harsh hard-edged seams.

## What Changes

- Add maintained project support for the curated multi-style outdoor terrain kits (`Color1` through `Color8`) used by stepped outdoor terrain rendering.
- Replace the current outdoor `Surface Paint` workflow with a user-facing `Terrain Style Paint` workflow that paints terrain styles rather than flat material types like dirt or stone.
- Add a map-level default outdoor terrain style for new and unpainted outdoor terrain, initially defaulting to `Color1`.
- Update stepped terrain rendering so top surfaces, edge/corner caps, and cliff meshes resolve from the painted terrain style of the owning terrain cell.
- Add soft feathered transitions on top surfaces between neighboring terrain styles so outdoor biome boundaries remain readable without looking unnaturally hard-edged.
- Preserve a simpler V1 cliff rule where cliff faces use the dominant terrain style of the higher cell rather than full two-style cliff crossfading.
- Define migration behavior for older outdoor surface-paint data now that the old ground-material paint system is being removed.

**In scope**
- Outdoor-only terrain style selection, painting, persistence, and rendering
- Maintained sourcing and registration for all supported stepped terrain style kits
- Default outdoor terrain style configuration per map
- Soft top-surface transition rendering between neighboring terrain styles
- Sculpt/render behavior so painted terrain styles remain coherent after raise/lower edits

**Out of scope**
- Full cliff-face crossfading between two terrain styles in the same cliff segment
- Reintroducing the legacy dirt/stone/wet-dirt outdoor material-paint workflow as a second paint layer
- Indoor terrain, room, or wall rendering changes
- Re-authoring third-party source assets beyond curated import/registration work

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `outdoor-content-pack-assets`: Extend the curated outdoor terrain kit to include all supported authored terrain styles and their derived flat-ground runtime textures.
- `outdoor-ground-texture-paint`: Replace the legacy outdoor ground-texture paint model with outdoor terrain-style painting, map defaults, and feathered top-surface transitions.
- `outdoor-terrain-sculpting`: Ensure stepped terrain sculpting preserves and reveals the painted terrain style of affected cells, including style-owned cliffs.

## Impact

- Affected areas include `src/store/useDungeonStore.ts`, `src/store/serialization.ts`, `src/components/editor/RoomToolPanel.tsx`, `src/components/canvas/OutdoorGround.tsx`, `src/components/canvas/outdoorTerrainDerived.ts`, and the stepped terrain asset registry under `src/content-packs/kaykit/terrain/`.
- Content-pipeline work will expand the maintained outdoor terrain kit beyond `Color1` and add derived runtime textures for flat top-surface blending per supported terrain style.
- Compatibility risk is moderate around old outdoor surface-paint data because the legacy material-paint model is intentionally being replaced.
- UX impact should improve outdoor authoring clarity by making sculpting and painting work as one coherent terrain-style system.
