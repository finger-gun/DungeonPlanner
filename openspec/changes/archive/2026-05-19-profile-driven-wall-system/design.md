## Context

DungeonPlanner already has the right authoring primitive for this work: `editor/src/store/useDungeonStore.ts` stores wall topology in `splineWallGraph`, and wall openings already resolve against sampled spline spans through `editor/src/store/openingPlacement.ts`. The current render path in `editor/src/rendering/gpu/SplineWallComputePrototype.ts` is still fundamentally a single wall body with cutouts layered on top, which is why it becomes brittle when doors, curved spans, and custom framing rules start to vary.

The requested end state is not "better wall cutouts"; it is a wall family system built from one editable centerline that can generate different side profiles, different materials, semantic inserts like pillars, and style-aware opening behavior. The design must keep authoring fast, preserve predictable camera/tool behavior, and avoid reintroducing manual mesh management as a core workflow. Because the wall system is still pre-production, the new serialized model can replace the current one without maintaining backward compatibility for old dungeon saves.

Stakeholders:
- Game Masters need quick wall authoring and fast style iteration.
- Players need clearer scenes with readable silhouettes and consistent openings.
- Content authors need a contract for adding wall styles without special-case renderer work per asset.

## Goals / Non-Goals

**Goals:**
- Keep `splineWallGraph` as the single authored wall path while generating richer wall geometry from it.
- Support side-specific wall layer stacks so the two sides of the same wall can have different profiles, materials, and trims.
- Introduce data-driven wall style definitions that describe geometry, materials, joins, inserts, and opening compatibility.
- Generate semantic anchor points for pillars, posts, trims, and cover pieces from path meaning rather than manual placement hacks.
- Make openings attach through explicit wall-family rules so framed doors, sleeve windows, and structural openings can coexist.
- Preserve editing speed by keeping one wall authoring workflow and moving complexity into style data plus derived render jobs.

**Non-Goals:**
- Supporting arbitrary legacy wall assets as drop-in profile-driven styles.
- Procedurally solving every corner and bend perfectly with no fallback cover assets.
- Reworking unrelated asset-browser or general placement workflows in the first phase.
- Preserving backward compatibility for old pre-production dungeon saves.

## Decisions

### 1. Keep `splineWallGraph` as authored topology and build a new derived wall-family layer on top

**Decision:** `splineWallGraph` remains the source of truth for wall centerlines, adjacency, and opening attachment. The new system adds side-aware style assignments keyed per graph segment side plus derived wall assembly jobs rather than replacing wall authoring with placed meshes or hand-authored wall sections.

**Rationale:** The current graph already preserves the editing behavior the product needs: paint/edit rooms quickly, derive shared walls, and attach openings to sampled spans. Replacing that with mesh-level authoring would slow editing and make shared-wall behavior harder, not easier.

**Alternatives considered:**
- **Replace walls with manually placed modular wall meshes:** rejected because it hurts editing speed and makes shared walls/openings harder to keep consistent.
- **Extend the current single-mesh cutout system indefinitely:** rejected because the current prism-plus-cutout model does not scale to different side profiles, layered trims, or varied opening contracts.

### 2. Represent wall appearance as wall-style definitions, not as single wall assets

**Decision:** Add a new top-level content-pack concept for wall styles (for example `wallStyles`) instead of overloading `ContentPackAsset`, `ContentPackRoomSet`, or `ContentPackWallMaterialSet`. In the first implementation slice, a wall style must cover the structural core, room-owned faces, and pillar/cover insert rules. Trim, crown, and base layers remain planned extensions rather than required first-slice features. A wall style defines:
- layer stacks for the structural core and each visible side
- 2D cross-section profiles per layer
- material bindings / UV rules per layer
- join preferences per side/layer
- semantic insert rules
- opening compatibility rules

**Rationale:** A profile-driven wall is a procedural family, not one placeable mesh. `ContentPackRoomSet` is a preset bundle, and `ContentPackWallMaterialSet` is material-only; neither is the right abstraction for layered procedural wall generation. Because the goal is to replace the old wall systems rather than bridge them indefinitely, the new wall-style model should become the canonical wall definition instead of sitting behind legacy preset abstractions.

**Alternatives considered:**
- **Reuse `ContentPackAsset` with richer `metadata`:** rejected because the current asset contract assumes a single renderable object/component, while a wall style is a generator configuration plus references to supporting assets.
- **Encode the new system inside `roomSets`:** rejected because room sets are presentation presets, not durable wall-generation contracts.

### 3. Use side-aware wall assemblies instead of splitting a finished wall mesh

**Decision:** Generate coordinated wall assemblies from one sampled centerline with explicit side A / side B layer stacks, but resolve those visible stacks through a room-owned face model. Each room owns the finish that faces into that room along its boundary. When a boundary section is shared, the adjacent room owns the opposing inward-facing finish on that same structural wall section. When no adjacent room exists for a section, the originating room owns the outward-facing exterior finish for that section. The renderer therefore resolves wall faces per boundary section from adjacency and exposure rather than assuming every wall is globally one inside face and one outside face. If the two room-facing sides of a shared section use different styles, the shared structural core style is resolved through a separate structural-core assignment for that shared segment rather than being implicitly taken from either visible side.

**Rationale:** This matches the requested "castle outside / living room inside" model while preserving a clean mental model for authoring: a room always owns its inside. It also handles shared walls between different room types and mixed runs where some sections are shared while others are exposed to the outside, without cutting a completed mesh in half after the fact.

**Alternatives considered:**
- **Generate one full wall mesh and split it later:** rejected because corner joins, UV continuity, and opening behavior become harder and less deterministic.
- **Duplicate entire walls per room side:** rejected because shared boundaries would z-fight or drift and would duplicate structural geometry unnecessarily.

### 4. Build a two-stage geometry pipeline: path analysis first, layer sweeps second

**Decision:** Introduce a derived pipeline with two explicit stages:
1. **Wall path analysis**: sample the centerline into stable frames and semantic anchors, classify corners/bends, resolve exposed sides, and project openings onto the analyzed path.
2. **Wall assembly generation**: sweep 2D profiles for each participating layer, resolve joins per side, add inserts/cover pieces, and emit final render jobs.

In phase one, this generation should be CPU-driven and cacheable, reusing the current invalidation/render-cache approach rather than trying to generalize the existing compute-collapse shader path immediately.

**Rationale:** The current compute prototype is optimized around a simple wall body plus cutout data. Profile sweeps, side-specific joins, and style-defined inserts need a higher-level assembly model first. CPU generation is easier to reason about and debug while the wall family contract is still changing.

**Alternatives considered:**
- **Generalize the current compute-collapse path to arbitrary profiles immediately:** rejected because the current data model and failure modes are already centered on cutout collapse assumptions.
- **Perform all sweep generation in custom shaders from day one:** rejected because it raises implementation/debug complexity before the geometry contract is stable.

### 5. Make joins and cover pieces first-class style rules

**Decision:** Joins are not an afterthought. Each wall style can declare preferred join behavior per side/layer (for example mitered, beveled, capped, or cover-piece assisted), and the path analysis stage must emit semantic anchors at:
- start/end caps
- convex and concave corners
- curvature changes above a threshold
- optional repeated spacing intervals
Pillars, posts, trims, and cover assets are then placed from these anchors through style rules. Insert ownership is side-aware in the first slice: each styled visible side resolves its own inserts from its own style rules, rather than forcing insert ownership through the shared structural core.

**Rationale:** Different side profiles will eventually create shapes that cannot always join cleanly procedurally. Making cover pieces a supported answer from the start is more robust than treating them as a failure case.

**Alternatives considered:**
- **Require purely procedural joins everywhere:** rejected because some profile combinations will still look bad at bends or corners.
- **Place pillars manually as regular props:** rejected because the user explicitly wants architectural inserts to follow wall semantics automatically.

### 6. Openings must integrate through wall-family rules, not generic hole cutting

**Decision:** Openings will resolve through style-defined opening modes and layer participation rules. The wall system should support at least three opening behaviors:
- **Framed opening**: structural cut with decorative layers terminated and hidden by a frame asset
- **Sleeve opening**: structural cut plus style-aware reveal/sleeve geometry
- **Structural opening**: explicit visible jamb/reveal generation for styles that expose wall thickness

The existing opening sampling work in `openingPlacement.ts` and `ContentPackOpeningContext` becomes the basis for a richer opening context shared between the wall assembly and opening asset renderers.

**Rationale:** Doors and windows do not all want the same treatment. The system needs an explicit contract for what the wall provides versus what the asset provides.

**Alternatives considered:**
- **Continue asset-specific exceptions in wall cutout code:** rejected because that recreates the current maintenance problem.
- **Use one universal hole-cutting mode for all openings:** rejected because framed doors, sleeve windows, and exposed structural openings have different geometry needs.

### 7. Keep editor interaction centered on one wall tool and style assignment workflow

**Decision:** The first-phase editor workflow keeps a single wall authoring interaction and adds wall-style assignment/select controls at the graph-segment-side level instead of introducing separate authoring tools for interior walls, exterior walls, trims, or inserts. Side differences come from the style definition and side-aware rendering, not from manually editing both sides independently.

**Rationale:** The product vision favors speed and clarity. Users should draw/edit one wall path, then assign or swap styles on the exact boundary faces that matter for shared and exposed sections without managing multiple overlapping wall objects. Segment-side assignment gives the control needed for mixed adjacency while still keeping wall drawing itself simple.

**Alternatives considered:**
- **Independent per-side wall painting tools:** rejected because it slows the main authoring loop and makes shared walls harder to understand.
- **Manual insert placement only:** rejected because it breaks consistency and adds repetitive work.

## Risks / Trade-offs

- **[Different side profiles produce ugly intersections at corners or bends]** → Mitigation: require explicit join strategies per style and allow mandatory cover-piece anchors where procedural joins are not acceptable.
- **[Shared walls between differently styled rooms create conflicting expectations for the same boundary]** → Mitigation: derive ownership per room-facing boundary section and render one shared structural wall with independently resolved face stacks.
- **[CPU sweep generation increases rebuild cost compared with the current simple wall body]** → Mitigation: cache analyzed wall runs, rebuild only affected chains, and preserve `frameloop=\"demand\"` invalidation behavior.
- **[Opening assets still do not fit every wall style cleanly]** → Mitigation: add opening compatibility metadata so styles and assets opt into supported opening modes explicitly.
- **[Pre-production schema churn could destabilize other editor code]** → Mitigation: isolate the new schema to wall-style definitions, side assignments, and derived wall assembly modules before removing obsolete wall fields.

## Migration Plan

1. Add the new wall-style data model to content packs and store state, including per-graph-segment-side style assignments and a serializer version bump for the new schema.
2. Implement the path-analysis and wall-assembly pipeline behind a dedicated renderer/module boundary so it can be exercised against the existing editor interactions before old assumptions are removed.
3. Route opening integration through wall-family-aware descriptors and replace style-incompatible cutout assumptions with explicit opening modes.
4. Update the editor UI to assign wall styles per graph segment side and expose only the first-slice controls for core, room-owned faces, and pillars without changing the base wall drawing workflow.
5. Remove obsolete legacy wall-surface, room-set, and single-wall-material assumptions once the new renderer covers baseline dungeon walls rather than maintaining a parallel bridge path.

Rollback strategy: because this system is still pre-production, rollback is code-level only. If the new model proves inadequate, revert the branch/module change rather than carrying loader compatibility for older save data.

## Open Questions

- None currently. The current direction is: per-graph-segment-side style assignment, separate structural-core assignment on shared segments when opposing sides differ, side-owned semantic inserts, first-slice scope limited to structural core + room-owned faces + pillars, one shared opening capability with explicit modes, and removal of old wall systems rather than bridging them.
