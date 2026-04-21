## Context

DungeonPlanner currently assumes indoor authoring semantics: users paint floor cells to create rooms, walls are inferred from room boundaries, and openings connect wall segments. The proposal introduces a second authoring model (outdoor) with opposite defaults (open by default, constrained by explicit blockers), static time-of-day controls, and curated forest assets.

This is a cross-cutting change touching creation flow, store state, scene rendering, serialization, and content-pack metadata. Existing indoor maps and workflows must remain unchanged and backward compatible.

## Goals / Non-Goals

**Goals:**
- Add explicit map mode selection at map creation (`indoor` or `outdoor`).
- Provide outdoor editing semantics for infinite-open terrain with explicit constraints from blocked-cell paint and boundary/object placement.
- Add static outdoor time-of-day controls that affect light/fog/sky presentation.
- Register a curated outdoor asset subset (trees, rocks, bushes) with metadata-driven movement/LOS behavior.
- Preserve indoor behavior and existing saved-map compatibility.

**Non-Goals:**
- Real-time day/night animation or simulation.
- Weather, terrain height sculpting, procedural generation, or biome systems.
- Mixed indoor/outdoor mode within one map in this change.

## Decisions

### 1. Introduce explicit `mapMode` in store and persisted format
**Decision:** Add `mapMode: 'indoor' | 'outdoor'` to the dungeon model and persist it.

**Rationale:** The two editing models have different defaults and tool semantics; making mode explicit avoids fragile inference from content.

**Alternatives considered:**
- Infer mode from data shape (rejected: ambiguous, brittle for edge cases).
- Separate save formats for indoor/outdoor (rejected: duplicates infrastructure and complicates tooling).

### 2. Outdoor geometry uses sparse constraint storage, not explicit "open area"
**Decision:** Outdoor space remains implicit; only constraints are stored (blocked cells and object/boundary occupancy).

**Rationale:** Supports infinite-open terrain without large grids, aligns with performant sparse maps, and keeps serialization compact.

**Alternatives considered:**
- Finite full-canvas bitmap (rejected: forces map bounds and wastes storage for mostly-open maps).

### 3. Unify traversal/LOS blocking through composable occupancy rules
**Decision:** Final blocked state is computed from explicit blocked cells, boundary occupancy, and asset metadata (`blocksLineOfSight` / movement-blocking metadata).

**Rationale:** Provides deterministic behavior and keeps editor preview consistent with play-mode rules.

**Alternatives considered:**
- Boundary-only blocking (rejected: prevents props such as trees/rocks from participating in gameplay semantics).
- Brush-only blocking (rejected: loses art-directed physical boundaries).

### 4. Add static outdoor time-of-day controls as scene settings
**Decision:** Add a static control (slider/select) to choose a time-of-day preset/value, persisted per map.

**Rationale:** Delivers immediate presentation value with low runtime complexity and predictable visuals.

**Alternatives considered:**
- Live day/night cycle (rejected for v1: higher rendering/perf complexity and UX ambiguity for encounter prep).

### 5. Asset onboarding uses curated subset under permanent source path
**Decision:** Move selected KayKit Forest `.gltf` + `.bin` + shared textures from temp into `src/assets/models/` and register only curated trees/rocks/bushes.

**Rationale:** Keeps repository assets intentional and maintainable while reusing existing content-pack loading conventions.

**Alternatives considered:**
- Import full forest pack immediately (rejected: too much catalog noise and metadata tuning overhead for first release).

## Risks / Trade-offs

- [State complexity increases with dual semantics] → Mitigation: gate tool behavior by `mapMode` and keep shared actions for unchanged systems (layers, selection, object placement framework).
- [Serialization compatibility regressions for existing maps] → Mitigation: add versioned migration with default `mapMode='indoor'` when absent and regression tests for old fixtures.
- [Blocking rule conflicts between brush/boundary/props] → Mitigation: document precedence and centralize blocked-cell resolution in one derived-state utility.
- [Outdoor lighting presets can reduce readability in some scenes] → Mitigation: clamp ranges and provide a default preset tuned for gameplay clarity.
- [Asset bloat/performance from high-count foliage] → Mitigation: start with curated subset and add category-level throttling/limits in follow-up if needed.

## Migration Plan

1. Extend persisted dungeon schema with `mapMode` and outdoor environment/edit fields.
2. Add migration logic to populate defaults for old saves (`mapMode='indoor'` and equivalent defaults for new outdoor-only fields).
3. Keep indoor toolchain as default path so existing projects load and edit identically.
4. Add/update tests for deserialize/serialize round-trips across legacy and new versions.
5. Rollback strategy: maintain migration guards and feature-gated UI; if issues are found, disable outdoor map creation while preserving read compatibility.

## Open Questions

- Should movement blocking and LOS blocking remain one shared metadata flag in v1 or be split immediately into separate flags?
- Should outdoor boundary assets be represented as standard props with metadata, or as a dedicated boundary object type for stricter tool UX?
- Should time-of-day be a continuous slider only, or slider + named presets ("Dawn", "Day", "Dusk", "Night") in v1 UI?
