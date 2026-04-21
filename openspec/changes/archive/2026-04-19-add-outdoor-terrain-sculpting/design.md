## Context

Outdoor maps currently support blocked terrain painting, surrounding props, and blended ground texture painting, but the ground surface itself is still effectively a flat plane. The requested change introduces authored hills and valleys in outdoor mode without sacrificing the current fast grid-based editing flow or breaking placement of props and characters.

This is a cross-cutting change because it touches editor state, pointer/raycast behavior, outdoor rendering, object placement, and serialization. The design also needs to preserve compatibility with the newly added outdoor ground texture paint workflow so sculpting does not create a second disconnected outdoor terrain system.

## Goals / Non-Goals

**Goals:**
- Add outdoor-only terrain sculpting for raising and lowering ground into smooth height variation.
- Keep the map logically grid-based so existing paint, selection, and placement flows remain understandable and predictable.
- Allow props and characters to continue being placed on outdoor terrain after sculpting, with stable support points.
- Keep outdoor ground texture paint aligned to the sculpted terrain surface.
- Persist sculpted terrain data with migration-safe defaults for older saves.

**Non-Goals:**
- Indoor terrain sculpting.
- Overhangs, caves, tunnels, voxel excavation, or arbitrary mesh editing.
- Physics simulation or gameplay rules based on slope angle.
- Full asset-specific terrain conforming for every prop type in the first version.

## Decisions

### 1) Represent outdoor terrain as a grid-aligned heightfield
- **Decision:** Store outdoor terrain elevation as sampled height data on the outdoor grid/terrain lattice instead of freeform mesh edits.
- **Rationale:** A heightfield preserves the existing 2D cell model while allowing smooth hills and valleys. It keeps brush editing fast, serializable, and deterministic, and it matches the current outdoor plane-centric architecture better than arbitrary mesh editing.
- **Alternatives considered:**
  - Per-cell elevation only: rejected because it produces stepped plateaus or hard seams unless heavily postprocessed.
  - Freeform mesh sculpting: rejected because it breaks grid predictability, complicates persistence, and makes placement/raycast logic much riskier.

### 2) Keep logical cell addressing in X/Z and derive rendered height from terrain samples
- **Decision:** Continue using existing X/Z grid coordinates as the logical authoring model, and derive world Y plus surface normal from the sculpted terrain when rendering previews, ground hits, and placements.
- **Rationale:** This preserves current tool semantics and reduces the amount of editor state that must become height-aware. Users still think in terms of cells and brush strokes, while the renderer and hit-testing adapt to 3D terrain shape.
- **Alternatives considered:**
  - Replace cell addressing with full 3D vertex editing: rejected because it would make common authoring tasks slower and less predictable.
  - Bake terrain height directly into every tool's local state: rejected because it duplicates logic and increases drift risk.

### 3) Re-anchor outdoor floor-supported objects to terrain instead of treating Y as fixed
- **Decision:** For outdoor floor-supported props and characters, treat terrain height as the authoritative support surface so their rendered/committed Y position can be derived from terrain at the support point. Keep default orientation predictable by leaving characters upright and only sampling height initially.
- **Rationale:** If sculpting changes after objects are placed, fixed Y coordinates would leave objects floating or buried. Terrain-aware anchoring keeps placement usable as users iterate on the landscape.
- **Alternatives considered:**
  - Freeze all existing object Y positions: rejected because it makes terrain editing destructive to earlier placement work.
  - Fully align all objects to terrain normals: rejected for first release because steep tilting can hurt readability and asset compatibility.

### 4) Keep outdoor texture paint and blocked terrain data as separate overlays on the same terrain surface
- **Decision:** Continue storing sculpt, texture-paint, and blocked-cell data separately, but map all three onto the same outdoor terrain coordinate space.
- **Rationale:** Sculpting changes shape, texture paint changes visual material, and blocked cells change traversability. Keeping them separate preserves editing flexibility and avoids coupling gameplay constraints to visuals.
- **Alternatives considered:**
  - Merge sculpt and texture paint into a single terrain layer object: rejected because it conflates independent authoring concerns.

### 5) Rebuild outdoor mesh and invalidate demand rendering only when terrain data changes
- **Decision:** Update the outdoor terrain mesh/material inputs from store data and call `invalidate()` only on terrain-affecting edits.
- **Rationale:** The canvas uses `frameloop="demand"`, so terrain editing must explicitly trigger rerenders while avoiding unnecessary perpetual frame work.
- **Alternatives considered:**
  - Continuous terrain recomputation in `useFrame`: rejected because static maps should not incur ongoing frame costs.

## Risks / Trade-offs

- **[Risk]** Terrain mesh generation or height sampling may become expensive on large outdoor maps.  
  **Mitigation:** Keep the first version grid-aligned, cache derived geometry/material inputs, and update only when terrain state changes.

- **[Risk]** Existing placement logic may assume a flat outdoor plane and regress when support height varies.  
  **Mitigation:** Centralize terrain height sampling for placement previews and committed placement, and add regression tests for props/characters on sculpted cells.

- **[Risk]** Save format changes may break older outdoor maps or omit new terrain fields.  
  **Mitigation:** Add a serialization version bump with empty-heightfield defaults for older files.

- **[Risk]** Steep terrain may make the grid harder to read or cursor targeting feel jumpy.  
  **Mitigation:** Preserve logical X/Z brush semantics, keep grid visualization terrain-aware, and defer advanced tilt/normal alignment until basic usability is solid.

## Migration Plan

1. Add new optional outdoor terrain height data to the serialized map format.
2. Bump serialization version and default older saves to a flat heightfield.
3. Gate sculpting UI and height-aware rendering/placement to outdoor mode only.
4. Rollback strategy: ignore sculpt data and render the outdoor map as a flat surface if the feature must be disabled.

## Open Questions

- What brush set ships in v1 beyond raise/lower: smooth, flatten, or both?
- What terrain resolution should be used relative to the current outdoor grid to balance sculpt detail and performance?
- Should some props opt into slope alignment later, or should all outdoor objects remain upright for readability in v1?
