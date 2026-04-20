## Context

Outdoor terrain sculpting currently supports smooth elevation changes, which can look natural but introduces ambiguity for a square-grid tactics workflow. The product goal for this change is to preserve the current fast outdoor editing flow while making verticality map to clear, cell-aligned steps that players can read and GMs can reason about when moving tokens and placing props.

This change touches the terrain authoring state, terrain mesh generation, interaction targeting over elevated surfaces, and save/load compatibility for maps authored before stepped behavior.

## Goals / Non-Goals

**Goals:**
- Make outdoor elevation outcomes grid-stepped (up/down in cell-aligned increments) rather than smooth interpolation.
- Preserve current brush-driven editing UX and interaction responsiveness.
- Render stepped terrain with top and side faces using a future-proof face-material resolver (default same material on all faces, with targeted overrides).
- Keep targeting/placement behavior predictable on elevated terrain and compatible with current grid semantics.
- Preserve backward compatibility for existing saved outdoor maps.

**Non-Goals:**
- Supporting optional smooth/hybrid terrain modes in this change.
- Introducing per-face texture controls or separate side-material authoring.
- Changing indoor map editing or indoor geometry rules.
- Redefining movement/pathfinding rules beyond clarifying grid-aligned elevation representation.

## Decisions

### 1) Quantize outdoor terrain heights to discrete grid-aligned levels
- **Decision:** Represent outdoor elevation as stepped levels tied to grid cells, with sculpt actions resolving to level changes instead of continuous values.
- **Rationale:** This aligns vertical geometry with existing square-grid interaction and tactical readability.
- **Alternative considered:** Keep smooth heights and add a visualization overlay. Rejected because interaction ambiguity remains and user intent is strict grid alignment.

### 2) Preserve brush workflow, change only result semantics
- **Decision:** Keep current raise/lower brush interaction model, but apply quantization at edit/write time so resulting terrain is stepped.
- **Rationale:** Minimizes retraining cost and protects editing speed.
- **Alternative considered:** Replace sculpt tools with per-cell click increment controls. Rejected as slower and less fluid for map shaping.

### 3) Generate explicit side faces and resolve material by face
- **Decision:** Update terrain mesh generation so step transitions create visible side faces, and introduce a face-material resolver API with default top/side parity plus a built-in grass override (`top=grass`, `side=dirt`) and a soft blend band near the top of side faces.
- **Rationale:** Delivers better grass elevation visuals now while keeping implementation extensible for future materials without changing core terrain rendering architecture.
- **Alternative considered:** Keep strict single-material behavior on all faces. Rejected because grass cliffs look visually incorrect and reduce readability.

### 4) Normalize legacy smooth elevation data at load boundaries
- **Decision:** On load, convert older smooth/out-of-step outdoor elevation values to stepped levels using deterministic round-to-nearest quantization and versioned migration.
- **Rationale:** Keeps existing saves loadable and prevents runtime inconsistency between old data and new interaction semantics.
- **Alternative considered:** Directional floor/ceil based on inferred brush intent. Rejected to keep migration logic predictable and simple.

### 5) Use dynamic local step increments for steep features
- **Decision:** Use dynamic, grid-aligned step stacking for sculpted elevation so tight high-elevation areas can resolve into multiple staggered step levels rather than a single tall pillar.
- **Rationale:** Preserves tactical grid readability while avoiding visually unnatural one-cell columns when creators build small but high features.
- **Alternative considered:** Fixed global increment only. Rejected because it over-produces pillar-like results in small, steep regions.

## Risks / Trade-offs

- **[Risk] Quantization changes existing map silhouettes** → **Mitigation:** Use deterministic rounding rules and document expected visual shifts for pre-change files.
- **[Risk] More geometry from side faces affects rendering cost** → **Mitigation:** Build only visible step walls and keep demand-driven render invalidation behavior unchanged.
- **[Risk] Placement edge cases on step boundaries** → **Mitigation:** Define a single support-resolution rule per cell and cover with requirement scenarios/tests.
- **[Trade-off] Less natural terrain aesthetics** → **Mitigation:** Prioritize tactical clarity and grid readability for core product use.

## Migration Plan

1. Add/confirm serialization version handling for outdoor elevation representation.
2. Implement load-time migration for pre-change outdoor elevation values into stepped levels.
3. Maintain fallback defaults for files without outdoor elevation payloads.
4. Keep migration deterministic so repeated load/save does not drift elevation values.

## Open Questions

None currently.
