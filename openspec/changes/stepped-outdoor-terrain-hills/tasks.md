## 1. Terrain state and migration

- [x] 1.1 Replace the outdoor terrain state model with discrete signed terrain levels while preserving outdoor editor/store integration.
- [x] 1.2 Add serialization and migration coverage so existing outdoor terrain and painted surface data load safely into the stepped terrain model.
- [x] 1.3 Update store-level terrain anchoring logic so outdoor placed objects and generated surroundings remain supported after stepped terrain edits.

## 2. Terrain asset ingestion

- [x] 2.1 Copy the required `Color1` hill/cliff/top terrain assets and sidecar files from the forest temp pack into maintained project asset paths.
- [x] 2.2 Register the stepped terrain kit assets with content-pack helpers/metadata needed for rendering and validation.
- [x] 2.3 Add tests that fail when required stepped terrain asset files or sidecars are missing from maintained project paths.

## 3. Stepped outdoor rendering and tools

- [x] 3.1 Replace the continuous outdoor plane renderer with stepped top/cliff terrain rendering derived from neighboring terrain levels.
- [x] 3.2 Update the outdoor sculpt tool so raise/lower strokes edit deterministic stepped terrain levels and render raised hills plus lowered pits with cliffs.
- [x] 3.3 Rework outdoor ground painting into stepped top-surface painting with default green grass tops and terrain-aligned edits after sculpting.
- [x] 3.4 Update outdoor editor panel copy and controls so sculpting and ground painting match the stepped terrain mental model.

## 4. Validation

- [x] 4.1 Add or update unit tests for stepped terrain derivation, lowered-pit behavior, surface painting, and migration from legacy outdoor terrain.
- [x] 4.2 Run `pnpm run test` for targeted regression coverage after the stepped terrain changes land.
- [x] 4.3 Run `pnpm run build` after the stepped terrain renderer, store changes, and asset registrations are complete.
- [ ] 4.4 Run `pnpm run verify` if the final implementation changes touch multiple outdoor editing and rendering flows.
