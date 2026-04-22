## Context

DungeonPlanner's current outdoor terrain stack is built around a continuous heightfield. The store keeps float heights per cell, the renderer samples those heights across a single plane, and ground painting projects blended textures across that surface. This works for soft hills, but it fights both the editing grid and the newly available KayKit forest hill assets, which are authored as stepped grass tops, cliff sides, and modular corners.

The desired look is closer to a signed stepped terrain field than a smooth landscape: raised ground becomes plateaus and hills with outer cliffs, lowered ground becomes pits and trenches with inner cliffs, and every editable terrain cell remains easy to target from the existing outdoor brush workflow. The key design challenge is changing the terrain source of truth and renderer without regressing outdoor placement support, paint workflows, or save/load compatibility.

## Goals / Non-Goals

**Goals:**
- Represent outdoor terrain as discrete signed levels per grid cell rather than interpolated float heights.
- Preserve the current outdoor brush-driven editing model while making sculpting more predictable and tactical.
- Render stepped outdoor terrain from the KayKit hill kit so exposed tops and cliffs match the new art direction.
- Keep outdoor props, generated surroundings, and characters supportable on sculpted terrain without manual Y-axis authoring.
- Preserve outdoor save/load compatibility through explicit migration behavior.

**Non-Goals:**
- Introducing a full voxel occupancy engine for caves, overhangs, or arbitrary underground excavation.
- Changing indoor maps, room editing, or unrelated play-mode systems.
- Shipping the full 8-color terrain palette in the first pass.
- Making terrain elevation affect movement, line of sight, or combat rules in this change.

## Decisions

### 1. Use signed integer terrain levels as the outdoor terrain source of truth
Outdoor terrain state should move from interpolated float heights to per-cell signed integer levels. `0` remains the baseline ground plane, positive values create raised terrain, and negative values create lowered terrain.

**Why:** This matches the editing grid, supports readable tactical terrain, and maps naturally to hill tops and cliffs in the new KayKit terrain kit.

**Alternatives considered:**
- Keep float heights and only restyle the surface. Rejected because the smooth interpolation still produces ambiguous tactical edges.
- Store full 3D voxel occupancy. Rejected because the requested gameplay only needs column-based raising and lowering, not caves or overhangs.

### 2. Derive terrain rendering from neighbor level differences
The renderer should treat terrain as a stepped scalar field and derive visible geometry from neighboring cell levels. Every cell renders one visible top surface at its own level, and every edge with a level difference renders cliff geometry spanning the exposed vertical drop. Raised terrain produces outward cliffs; lowered terrain produces inward cliffs around the hole.

**Why:** A derived-face model supports hills, terraces, trenches, and pits from one data representation.

**Alternatives considered:**
- Continue rendering a single deformed plane. Rejected because it cannot express the requested cliff-and-plateau look.
- Author separate hill and pit object systems. Rejected because pits are naturally represented as negative terrain levels in the same model.

### 3. Keep brush-driven sculpting, but change sculpt semantics to deterministic steps
Outdoor sculpting should keep the existing brush/stroke interaction model in the editor, but each sculpt action should change targeted cells by discrete terrain-level steps instead of applying weighted float deformation.

**Why:** Users already understand the current brush interaction, and only the terrain semantics need to change.

**Alternatives considered:**
- Replace sculpting with only prefab hill placement. Rejected because it would remove dynamic terrain editing.
- Keep soft falloff brushes. Rejected because they conflict with stepped terrain readability.

### 4. Reframe ground texture paint as stepped top-surface paint
Outdoor ground painting should apply to the visible top surface of each terrain cell at its current stepped level. Unpainted terrain should default to the green grass hill-top appearance from the terrain kit. Cliff walls are derived from terrain level differences and use the matching cliff asset family rather than plane-based blended overlays.

**Why:** The old texture-splat plane no longer exists as the primary outdoor surface. Painting needs to follow the stepped terrain tops, including lowered pit floors.

**Alternatives considered:**
- Preserve the old blended texture-mask workflow on top of stepped terrain. Rejected because it clashes with the modular hill kit look and retains the wrong mental model.

### 5. Use modular hill/cliff pieces as the canonical terrain renderer in v1
The stepped terrain renderer should be built around the modular `Hill_Top_*`, `Hill_Cliff_*`, and `Hill_Cliff_Tall_*` assets from the forest pack. Larger prebuilt `Hill_*` objects can remain a future optimization or stamp system, but they should not be the source of truth for sculpted terrain.

**Why:** Modular parts scale to arbitrary terrain shapes, while larger hill prefabs fit only specific rectangles and heights.

**Alternatives considered:**
- Build the system entirely from large hill prefabs. Rejected because it cannot represent arbitrary sculpted terrain shapes.

### 6. Keep outdoor placement height-aware, but do not make elevation tactical in this change
Ground-supported object placement, dragging, and generated surroundings should continue to anchor to the rendered terrain top for their support cell. However, movement, line-of-sight, and other tactical systems should remain unchanged unless they already depend on explicit blocked cells or placed asset metadata.

**Why:** This preserves authoring consistency without turning the terrain rewrite into a broader gameplay-rules change.

**Alternatives considered:**
- Add elevation-aware traversal and LOS now. Rejected because it expands scope significantly and can ship later once stepped terrain authoring is stable.

### 7. Migrate saved outdoor terrain data conservatively
Existing saved outdoor terrain and surface paint data should load safely into the new model. Prior heightfield data should be converted to the stepped terrain representation using migration-safe rounding/defaulting rules, and existing painted cells should map to stepped top-surface assignments where possible.

**Why:** This change alters terrain semantics, so explicit compatibility handling is safer than relying on implicit defaults.

**Alternatives considered:**
- Drop old outdoor sculpt data and always flatten on load. Rejected because it discards user-authored maps unnecessarily.

## Risks / Trade-offs

- **[Terrain renderer becomes too heavy]** → Mitigation: derive terrain in chunks or instanced groups rather than one React component per visible face.
- **[Old outdoor maps migrate unpredictably]** → Mitigation: constrain migration to deterministic level conversion rules and add serialization coverage for legacy outdoor saves.
- **[Generated surroundings end up embedded in cliffs]** → Mitigation: reanchor or regenerate outdoor generated objects after terrain edits using support-cell rules.
- **[Ground painting semantics become confusing]** → Mitigation: present it as top-surface painting in the UI and keep the default grass look when no explicit surface is assigned.
- **[Asset ingestion is incomplete]** → Mitigation: copy only the required `Color1` hill/cliff assets and sidecars into maintained project paths first, with tests for resolution coverage.

## Migration Plan

1. Introduce the new stepped outdoor terrain state model and keep load-time compatibility with existing outdoor data.
2. Register the required KayKit hill/cliff/top assets from maintained project paths and wire them into the stepped terrain renderer.
3. Replace the continuous outdoor plane renderer with stepped top/cliff rendering driven from terrain levels.
4. Update sculpting and outdoor surface painting so editor interactions target stepped terrain cells instead of a blended plane.
5. Add or update tests for migration, rendering derivation rules, placement reanchoring, and outdoor paint behavior.

## Open Questions

- Should future follow-ups expose additional terrain palettes beyond `Color1` as a map-wide setting, a brush option, or an asset-browser selection?
- Should large prefab `Hill_*` objects later be used as optimization chunks, authoring stamps, or both?
