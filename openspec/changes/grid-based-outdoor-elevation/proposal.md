## Why

Outdoor terrain elevation currently produces smooth, natural slopes that conflict with DungeonPlanner's square-grid movement and placement model. Aligning elevation changes to grid-stepped geometry improves movement readability and authoring predictability for both GMs and players.

## What Changes

- Replace continuous outdoor terrain height transitions with grid-aligned stepped up/down elevation behavior so vertical changes follow cell boundaries.
- Keep elevation editing fast by preserving brush-based workflows while snapping resulting elevation surfaces to the grid.
- Render stepped terrain with visible top and side faces using a face-material resolver that defaults to the same material on all faces, with an initial grass override (`top=grass`, `side=dirt`) and a soft transition at the top of side faces.
- Ensure grid interaction (hover, paint, placement, pathing interpretation) remains consistent on stepped elevation.
- Keep existing indoor map behavior unchanged.
- **In scope**: outdoor terrain sculpt/elevation behavior, outdoor terrain rendering for side faces, serialization compatibility for stepped elevation data, and grid-consistent interaction semantics.
- **Out of scope**: non-grid terrain smoothing modes, player-facing per-face texture/material authoring controls, indoor terrain elevation, and new movement-rule systems beyond existing grid semantics.

## Capabilities

### New Capabilities
- `outdoor-grid-stepped-elevation`: Define outdoor terrain elevation that is quantized to grid-stepped levels with textured top/side faces.

### Modified Capabilities
- `outdoor-terrain-sculpting`: Change sculpting requirements from continuous smooth terrain outcomes to grid-aligned stepped outcomes while preserving stable grid-aware authoring and persistence expectations.
- `outdoor-ground-texture-paint`: Extend terrain texture rendering requirements so stepped side faces can resolve material by face with default parity and a grass-specific side override.

## Impact

- Affected systems: outdoor terrain sculpt tools, terrain mesh generation/rendering, placement/targeting over elevated terrain, and dungeon serialization/migrations for outdoor elevation data.
- UX impact: clearer tactical readability and more predictable move/placement interpretation on elevated outdoor maps, with minimal change to authoring flow.
- Compatibility risk: existing saves created with smooth elevation may require migration or normalization to stepped levels on load; fallback behavior must preserve successful loading of older files.
