## 1. Map mode and state model

- [x] 1.1 Add `mapMode` (`indoor` | `outdoor`) to `useDungeonStore` state and initialize it through new-dungeon flow.
- [x] 1.2 Add outdoor constraint state/actions (blocked-cell painting and boundary/blocking composition) while preserving indoor room-first behavior.
- [x] 1.3 Gate tool behavior and editor hints/panels by `mapMode` so outdoor maps start open and indoor maps keep current semantics.

## 2. Serialization and migration safety

- [x] 2.1 Extend dungeon serialization format to persist `mapMode` and outdoor environment/editing fields.
- [x] 2.2 Add migration defaults for legacy saves (missing `mapMode` resolves to `indoor`) and ensure backward-compatible deserialization.
- [x] 2.3 Add/adjust serialization tests for old-save compatibility and round-trip persistence of outdoor map state.

## 3. Outdoor environment controls

- [x] 3.1 Add static outdoor time-of-day state and store actions for author-controlled visual presets/values.
- [x] 3.2 Update scene rendering to apply outdoor time-of-day lighting/atmospheric parameters without real-time cycling.
- [x] 3.3 Add editor controls for outdoor time-of-day and keep indoor lighting UX compatible.

## 4. Outdoor asset onboarding and metadata

- [x] 4.1 Move curated KayKit Forest tree/rock/bush `.gltf` assets (plus required `.bin` and textures) from temp into `src/assets/models/` permanent paths.
- [x] 4.2 Register curated outdoor assets in content-pack modules and expose them in the prop catalog for outdoor authoring.
- [x] 4.3 Define and apply metadata-driven blocking/LOS behavior for selected outdoor assets.

## 5. Integration, regression checks, and quality gates

- [x] 5.1 Add/update unit tests for map-mode creation flow, outdoor constraint behavior, and metadata-driven blocking composition.
- [x] 5.2 Add/update UI tests for create-new mode selection and outdoor control visibility/behavior.
- [ ] 5.3 Run `pnpm run test` and `pnpm run build`; run `pnpm run verify` if cross-surface changes require full-gate confidence.
  - Verify was run and is currently blocked by pre-existing repo-wide lint errors outside this change scope.
