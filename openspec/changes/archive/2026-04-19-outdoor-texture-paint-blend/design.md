## Context

Outdoor mode currently paints inaccessible terrain cells (`blockedCells`) and auto-generates surrounding props, but the rendered ground remains a single-color plane. The change introduces outdoor-only textured ground painting with auto-blended boundaries while preserving existing editing speed and keeping indoor behavior unchanged.

The architecture constraint is that editor state lives in `src/store/useDungeonStore.ts`, outdoor rendering currently happens in `Scene.tsx` (`OutdoorGround`), and save compatibility depends on versioned serialization in `src/store/serialization.ts`.

## Goals / Non-Goals

**Goals:**
- Add an outdoor-only surface paint model for ground texture type assignment by cell/brush stroke.
- Render outdoor ground with blended transitions between adjacent texture types.
- Keep blocked/inaccessible terrain behavior independent from surface texturing.
- Persist and restore outdoor texture paint state with migration-safe defaults.
- Preserve existing camera/tool behavior and pointer interaction semantics.

**Non-Goals:**
- Indoor ground/wall/floor texturing changes.
- Terrain elevation, hills, valleys, or non-planar grid geometry.
- Changes to multiplayer/server APIs.

## Decisions

### 1) Separate outdoor surface paint state from blocked terrain state
- **Decision:** Introduce dedicated outdoor ground surface paint data in store state rather than reusing `blockedCells`.
- **Rationale:** `blockedCells` controls traversal/access and auto-prop placement. Coupling visual materials to accessibility would force unwanted gameplay behavior when users only want visual variation.
- **Alternatives considered:**
  - Reuse `blockedCells` as texture source: rejected because it conflates semantics and reduces editing flexibility.
  - Reuse `paintedCells`: rejected because indoor semantics differ and this feature is explicitly outdoor-only.

### 2) Outdoor-only render gate and tool gate
- **Decision:** Only evaluate/render outdoor texture paint and controls when `mapMode === 'outdoor'`.
- **Rationale:** Prevents regressions in indoor workflows and reduces runtime complexity.
- **Alternatives considered:**
  - Unified cross-mode material system: rejected for current scope and risk; indoor has separate floor/wall systems.

### 3) World/cell-anchored blend computation
- **Decision:** Compute blend weights from outdoor paint data in a stable grid/world-aligned manner (not artist UV seams), then sample terrain textures in a blended outdoor ground material.
- **Rationale:** Produces deterministic blending across sessions and keeps data future-compatible with potential non-flat terrain work.
- **Alternatives considered:**
  - Hard per-cell material switching: rejected due to visible seams.
  - Mesh-UV painted splat editing: rejected for complexity and fragility.

### 4) Serialize outdoor texture paint with explicit migration defaults
- **Decision:** Extend dungeon file format with optional outdoor surface paint fields; default to empty paint on older versions.
- **Rationale:** Required for round-trip persistence and backward compatibility.
- **Alternatives considered:**
  - Ephemeral/non-persistent paint: rejected; would violate expected save/load behavior.

### 5) Keep brush interaction model consistent with current room/terrain paint
- **Decision:** Reuse existing drag-to-paint / right-drag-to-erase interaction patterns and map-mode guarded tool panels.
- **Rationale:** Maintains editing speed and user muscle memory.
- **Alternatives considered:**
  - New dedicated tool mode: deferred; would add toolbar complexity.

## Risks / Trade-offs

- **[Risk]** Blend logic or texture sampling increases render cost in large outdoor scenes.  
  **Mitigation:** Start with a bounded material set and profile; optimize weight generation and texture resolution if needed.

- **[Risk]** Added persisted fields break compatibility for older saves or tests.  
  **Mitigation:** Version bump with migration-safe defaults and explicit serialization tests.

- **[Risk]** Outdoor pointer/placement interactions conflict with the new paint data flow.  
  **Mitigation:** Keep paint actions isolated to room tool outdoor branch; avoid touching unrelated placement code paths.

- **[Risk]** Asset pipeline mismatch (maps present but not optimized/runtime-friendly).  
  **Mitigation:** Start with a minimal supported map set and normalize texture loading strategy for WebGPU/WebGL fallback.

## Migration Plan

1. Add new optional serialized fields for outdoor surface paint state.
2. Bump serialization version and provide defaults for older files (empty paint map).
3. Ship with feature gated to outdoor mode only.
4. Rollback strategy: ignore new fields and fall back to current flat outdoor ground if material/paint rendering is disabled.

## Open Questions

- Which exact initial terrain material set should ship first (e.g., short grass, dry dirt, rough stone, wet dirt)?
- Should auto-blend edge width be fixed initially or user-adjustable in outdoor settings?
- Should texture paint be layer-aware from day one or global to active floor outdoor context?
