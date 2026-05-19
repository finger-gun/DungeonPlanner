## Why

DungeonPlanner's current spline wall pipeline can support targeted wall and opening fixes, but it is not a durable foundation for richly styled walls with different interior and exterior profiles, layered materials, and repeatable architectural features like pillars. This change is needed now so Game Masters can style walls quickly and consistently, and players get clearer, more readable scenes, without the editor accumulating more asset-specific wall hacks.

## What Changes

- Add a profile-driven wall family model that generates walls from one editable centerline while supporting separate structural, interior, exterior, and optional trim layers.
- Add wall style assets that define per-layer 2D profiles, materials, UV rules, curvature constraints, join preferences, and opening behavior.
- Add semantic placement rules for pillars, posts, and related cover pieces at starts, ends, corners, bend transitions, and optional repeated intervals.
- Add support for distinct interior and exterior wall treatments that stay aligned to the same wall path instead of splitting a finished mesh after generation.
- Add wall-family-aware opening rules so doors and windows integrate through style-defined behavior instead of one-off geometry surgery.
- Preserve the existing editing expectation that walls are authored from a single path, keeping camera movement and tool interaction predictable while expanding visual variety.

### In Scope

- Layered wall generation from a shared spline centerline
- Independent interior and exterior profiles and materials
- Data-driven wall style definitions
- Rule-driven pillar, post, and cover-piece placement
- Style-aware opening integration for the new wall model
- Serialized wall-style assignment and compatibility planning

### Out of Scope

- Reauthoring every existing wall, door, and window asset in the first phase
- Guaranteeing perfect procedural joins for every arbitrary profile combination without fallback cover pieces
- Replacing unrelated editor workflows such as general asset browsing or non-wall placement tools
- Locking in renderer implementation details beyond the requirements needed for specs and design

## Capabilities

### New Capabilities

- `layered-profile-walls`: Generate wall assemblies from a shared centerline using coordinated structural, interior, exterior, and optional trim/profile layers.
- `wall-style-assets`: Define wall families as data assets with per-layer profiles, materials, UV behavior, curvature limits, interior/exterior variants, and join/opening preferences.
- `semantic-wall-inserts`: Place pillars, posts, and related cover or trim pieces from wall-path semantics such as endpoints, corners, curvature changes, and configured intervals.
- `profile-aware-openings`: Attach doors and windows to a wall family using style-defined reveal, frame, and compatibility rules instead of asset-specific wall-cut exceptions.

### Modified Capabilities

- None.

## Impact

- Affects wall data in `src/store/useDungeonStore.ts`, spline wall generation and rendering, opening placement rules, content-pack metadata, editor wall-style controls, and test coverage around wall authoring and rendering.
- Because the wall system is still pre-production, serialized wall data can change as needed to support the new model; backward compatibility with older dungeon saves is not required for this phase.
- Improves editing speed by keeping one editable wall path while allowing style swaps, improves scene readability through clearer interior/exterior treatment and repeatable landmarks, and preserves predictable camera/tool behavior by avoiding stacks of manually managed wall meshes.
