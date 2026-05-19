## Context

DungeonPlanner currently runs two indoor wall models in parallel:

1. A newer spline/procedural wall graph and compute-backed render path that can already draw rounded and diagonal walls and structural cutouts.
2. A legacy grid/cardinal wall model built around `wallKey`, painted-cell boundary derivation, open-wall segment sets, and axis-aligned placement/query helpers.

The second model still drives too many behaviors: wall-targeted placement, openings, shared passages, movement gating, LOS, fog/light occlusion inputs, and parts of editor selection/render derivation. That split makes the product unreliable exactly where the new wall system matters most: diagonal/rounded walls, coherent door placement, readable play-state boundaries, and removing code that no longer matches the rendered geometry.

This change must preserve the current fast editing loop, keep spline walls CPU-authoritative in store state, and keep existing dungeons loadable through migration. The refactor is cross-cutting because the same wall semantics must now drive editing, rendering, and gameplay queries.

## Goals / Non-Goals

**Goals:**
- Make spline/procedural wall graph data the single authoritative indoor wall model.
- Replace legacy wall-key/grid-boundary queries with shared spline-native geometry queries for selection, placement, LOS, movement, and occlusion.
- Move door/window/shared-passage placement to segment-relative positioning so openings work on straight, diagonal, and rounded walls.
- Make wall-mounted props snap to the nearest eligible spline wall surface with tangent/normal-aware orientation.
- Remove obsolete legacy wall modules once migration and save compatibility are in place.

**Non-Goals:**
- Replacing the current spline wall renderer with a different rendering backend.
- Reworking outdoor map-mode systems.
- Adding new door gameplay mechanics beyond correct structural placement/cutout behavior.
- Changing unrelated asset browser or multiplayer/session systems.

## Decisions

### 1. Spline wall graph becomes the only authoritative indoor wall source

**Decision:** Indoor wall topology, cutouts, shared passages, wall variants, and wall-targeted placement will be stored against spline graph segments/cutouts instead of `wallKey`.

**Why:** The rendered wall geometry is already spline-native. Making anything else authoritative guarantees divergence between editing, visuals, and gameplay.

**Alternatives considered:**
- **Keep dual models indefinitely:** rejected because it preserves every current diagonal/rounded-wall bug and duplicates logic.
- **Make GPU wall buffers authoritative:** rejected because editor state, undo, serialization, and deterministic tests belong on the CPU/store side.

### 2. Introduce a shared spline wall query layer for placement and gameplay

**Decision:** Add a reusable query module that answers closest-segment, cutout lookup, line-crossing, and room-containment questions from spline geometry.

**Why:** Placement, LOS, movement, and shared-wall logic all need the same geometric answers. A single query layer prevents each system from inventing incompatible approximations.

**Alternatives considered:**
- **Leave geometry logic embedded in each subsystem:** rejected because LOS, movement, and placement would drift and stay hard to test.
- **Query rendered meshes directly:** rejected because gameplay/editor semantics should not depend on view-layer mesh instances.

### 3. Openings move to segment-relative placement with migration from wallKey

**Decision:** Openings will be stored and edited using spline segment identifiers plus local placement data (arc-length/ratio and width metadata). Legacy `wallKey` opening data will be migrated on load and removed from authoritative runtime flows.

**Why:** Doors and windows need stable ownership on curved and angled walls. `wallKey` cannot represent those surfaces.

**Alternatives considered:**
- **Project `wallKey` onto spline segments forever:** rejected because the current bridge already fails on non-axis-aligned segments and becomes less valid as rooms diverge from the original grid.
- **Store only world-space opening transforms:** rejected because segment-relative data is easier to edit, validate, migrate, and rebuild into structural cutouts.

### 4. Movement and LOS use room/intersection queries derived from spline boundaries

**Decision:** Movement and visibility will stop treating grid-adjacent cell boundaries as authoritative walls. Instead they will use spline room containment and wall-crossing tests, with movement allowed only for cells that are at least 75% inside the traversable room interior.

**Why:** Rounded and diagonal rooms make grid-boundary approximations visibly wrong. The user explicitly wants LOS and movement to honor actual wall geometry.

**Alternatives considered:**
- **Keep the existing grid DDA model and patch special cases:** rejected because it still cannot correctly model curved walls.
- **Move directly to physics/mesh raycasts for all gameplay:** rejected for now because the store already has enough geometry to answer these questions more cheaply and deterministically.

### 5. Rendering and dirty tracking become graph-only for indoor walls

**Decision:** Indoor wall rendering caches and dirty propagation will stop branching between painted/grid walls and graph walls. Indoor wall rendering becomes graph-only after migration, with load-time graph seeding/migration handling old data.

**Why:** The dual-path rendering/cache logic is a major source of complexity and fallback mismatches.

**Alternatives considered:**
- **Keep painted-cell fallback forever:** rejected because it preserves obsolete code and makes it harder to remove legacy systems safely.

## Risks / Trade-offs

- **[Migration complexity]** Legacy dungeons may still contain wall-key-based openings or wall surface data that no longer map cleanly to current spline topology. → **Mitigation:** Add load-time migration that seeds/repairs spline graph ownership before runtime systems run, and retain explicit migration tests.
- **[Query performance]** Spline intersection and containment checks are more expensive than cardinal wall-key lookups. → **Mitigation:** Precompute/cache room polygons, sampled segment bounds, and per-floor query indexes; share one query layer across systems.
- **[Tooling regressions]** Wall editing and opening placement UX could slow down if segment targeting feels less predictable than wall-key snapping. → **Mitigation:** Preserve hover previews, prioritize closest eligible segments, and keep placement behavior deterministic.
- **[Shared-wall semantics]** Replacing inter-room grid boundaries with segment-native relationships may expose ambiguous ownership between neighboring rooms. → **Mitigation:** Model shared passages/cutouts as explicit segment/cutout state and derive adjacency from graph topology rather than grid heuristics.
- **[Long refactor tail]** Removing legacy modules too early can strand hidden consumers. → **Mitigation:** Migrate by subsystem, add replacement coverage first, and only delete legacy modules after references are removed.

## Migration Plan

1. Add/load migration paths that ensure indoor wall surfaces and openings resolve onto spline segments/cutouts before editor/gameplay systems consume them.
2. Introduce shared spline query utilities and migrate openings + wall-targeted placement first, because those currently block diagonal/rounded placement.
3. Migrate gameplay queries (LOS, movement, fog/light occlusion inputs) to the shared spline query layer.
4. Convert rendering/dirty tracking/editor selection to graph-only indoor wall flows.
5. Remove unused legacy wall modules, legacy state fields, and old test fixtures once no runtime consumers remain.

Rollback strategy during development is code-level rather than runtime-flag-based: each subsystem migration should keep its own regression coverage so a bad slice can be reverted independently before cleanup lands.

## Open Questions

- Whether movement occupancy should use a fixed five-sample 75% heuristic or a denser cached room-coverage mask for tighter curved-wall behavior.
- Whether shared walls between adjacent rooms should remain single-segment structures with multi-room metadata or be expressed as mirrored room-owned segments with coordinated cutouts.
- Whether wall-targeted snapping should expose user controls for cycling among nearby eligible spline segments in dense layouts.
