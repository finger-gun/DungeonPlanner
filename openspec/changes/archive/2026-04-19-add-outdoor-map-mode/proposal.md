## Why

DungeonPlanner currently supports indoor, room-first authoring, which limits GMs who need fast outdoor encounter prep. Adding an outdoor mode now unlocks a major adjacent use case while reusing the existing high-speed paint/place workflow and asset pipeline.

## What Changes

- Add map-type selection during "New Dungeon" creation: `indoor` (existing behavior) or `outdoor` (new behavior).
- Introduce outdoor-first authoring where open terrain is implicit and constraints are explicit (blocked-cell brush + boundary assets).
- Add static time-of-day controls (slider/select) for outdoor scenes to support day/night look presets.
- Add curated KayKit Forest assets (trees, rocks, bushes) to the content pack system for outdoor map building.
- Apply metadata-driven blocking and LOS behavior for relevant outdoor props and boundary assets.
- Update save/load model to persist map mode and outdoor-specific scene/editing data with backward-compatible migration behavior.
- In scope:
  - Outdoor map mode creation flow, editor behavior, rendering controls, and asset registration for trees/rocks/bushes.
  - Play-mode consistency for blocking/LOS where metadata declares blocking behavior.
- Out of scope:
  - Real-time day/night animation cycles.
  - Weather systems, biome generation, terrain height sculpting, or procedural foliage scatter.
  - Indoor/outdoor mixed mode in a single map.

## Capabilities

### New Capabilities
- `outdoor-map-mode`: Outdoor map creation and editing model, including open-by-default space, constraint painting, and boundary shaping.
- `outdoor-environment-lighting`: Static time-of-day scene controls for outdoor readability and presentation.
- `outdoor-content-pack-assets`: Outdoor forest asset registration and metadata contracts for trees, rocks, and bushes.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `src/store/useDungeonStore.ts` (map mode state, outdoor editing state, serialization wiring).
  - Editor UI panels and create-new flow (`src/components/editor/*`).
  - Scene lighting/rendering (`src/components/canvas/Scene.tsx` and related environment controls).
  - Content pack registry/assets (`src/content-packs/*`, `src/assets/models/*`).
  - Serialization/migration (`src/store/serialization.ts` and tests).
- APIs/systems:
  - Persisted dungeon JSON format changes require versioned migration support.
  - Existing indoor saves must load without behavior changes.
- Dependencies:
  - Reuse existing R3F/Three, Zustand, and content-pack infrastructure; no required external runtime dependency changes.
