## Why

Outdoor maps currently support terrain blocking and auto-prop generation, but the ground itself is still a single flat color plane. Adding outdoor-only textured ground painting with automatic blending improves map readability and visual quality for GMs and players while preserving fast editing workflows.

## What Changes

- Add an outdoor-only ground texture paint workflow that lets users paint terrain surface types (for example grass, dirt, rock) onto the outdoor ground.
- Add automatic blending at texture boundaries so adjacent painted terrain types transition smoothly instead of hard seams.
- Add outdoor-only UI controls for selecting terrain surface brushes, with no behavior changes in indoor mode.
- Persist outdoor surface paint data in dungeon saves so painted texture layouts round-trip across sessions.
- Keep existing outdoor blocked-cell/inaccessible area behavior separate from texture paint so users can style ground independently from traversal rules.
- **In scope:** outdoor mode rendering, outdoor paint UX, persisted outdoor texture paint data, compatibility with existing outdoor tool flow.
- **Out of scope:** indoor texturing changes, terrain elevation/hills/valleys, replacing room/wall/floor indoor systems.
- UX implications: preserve current editing speed (drag paint/erase), keep camera/tool behavior predictable, and improve scene readability through material variation and blended transitions.

## Capabilities

### New Capabilities

- `outdoor-ground-texture-paint`: Outdoor users can paint textured ground surface types with automatic blend transitions and saved paint state.

### Modified Capabilities

- None.

## Impact

- Affected systems: `src/store/useDungeonStore.ts` (outdoor paint state/actions), outdoor editor panels, and outdoor ground rendering in `src/components/canvas/Scene.tsx` (or extracted outdoor ground renderer/material).
- Affected data format: dungeon serialization (`src/store/serialization.ts`) will need a version bump and migration-safe defaults for older files that lack outdoor texture paint data.
- Asset/runtime impact: outdoor texture assets and sampling logic will be introduced for outdoor ground rendering; no API or server contract changes expected.
