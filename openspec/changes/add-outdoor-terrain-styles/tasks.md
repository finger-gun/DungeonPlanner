## 1. Terrain style assets and pipeline

- [ ] 1.1 Expand the maintained stepped terrain asset pipeline from `Color1` to the curated supported `Color1`..`Color8` terrain styles.
- [ ] 1.2 Add derived flat-ground runtime textures for each supported terrain style so flat outdoor ground and stepped tops share the same authored look.
- [ ] 1.3 Add or update tests that fail when required terrain-style assets or sidecars are missing from maintained project paths.

## 2. Store state, serialization, and migration

- [ ] 2.1 Replace legacy outdoor material-paint state with map-level default terrain style plus per-cell terrain-style override state in `src/store/useDungeonStore.ts`.
- [ ] 2.2 Update serialization and migration logic so new terrain-style state round-trips correctly and legacy outdoor material-paint data clears safely to the default terrain style.
- [ ] 2.3 Add store and serialization tests covering default style resolution, style paint/reset behavior, and migration from legacy outdoor surface paint.

## 3. Outdoor editor UX

- [ ] 3.1 Rename the outdoor paint workflow from `Surface Paint` to `Terrain Style Paint` and present the curated terrain-style brush options.
- [ ] 3.2 Add UI for selecting the map-level default outdoor terrain style and clarify that erase/reset returns cells to the default style.
- [ ] 3.3 Update editor-panel copy and tests so sculpting and painting read as one coherent terrain-style workflow.

## 4. Terrain rendering and sculpt behavior

- [ ] 4.1 Update derived outdoor terrain records so each rendered top/cliff segment resolves a dominant terrain style from the map default plus cell overrides.
- [ ] 4.2 Render flat ground, stepped tops, and top caps with soft feathered transitions between neighboring terrain styles.
- [ ] 4.3 Render cliff faces and tall cliffs using the dominant terrain style of the higher cell at elevation boundaries.
- [ ] 4.4 Ensure sculpted terrain preserves the painted terrain style of affected cells so new tops and cliffs remain visually coherent after raise/lower edits.
- [ ] 4.5 Add renderer/derived-terrain tests covering top-surface style transitions and higher-cell cliff ownership.

## 5. Validation

- [ ] 5.1 Run `pnpm run test` for terrain-style painting, serialization, and stepped terrain regression coverage.
- [ ] 5.2 Run `pnpm run build` after the terrain-style pipeline, store, UI, and rendering changes are complete.
