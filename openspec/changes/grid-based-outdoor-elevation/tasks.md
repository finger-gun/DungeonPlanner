## 1. Terrain Data and Sculpt Semantics

- [ ] 1.1 Update outdoor elevation state handling in `src/store/useDungeonStore.ts` so sculpted outdoor heights resolve to discrete grid-stepped levels.
- [ ] 1.2 Define and apply a deterministic quantization rule for raise/lower operations so brush interactions remain fluid while output stays step-aligned.
- [ ] 1.3 Add/adjust serialization versioning and migration in `src/store/serialization.ts` to normalize legacy smooth outdoor elevation data into stepped levels on load using round-to-nearest quantization.

## 2. Terrain Rendering and Texture Application

- [ ] 2.1 Update outdoor terrain mesh generation in canvas components to emit explicit side faces at step boundaries.
- [ ] 2.2 Implement a face-material resolver for stepped terrain (default top/side parity) and add a grass override (`top=grass`, `side=dirt`) with a soft top-edge side-face blend.
- [ ] 2.3 Keep demand-frame invalidation behavior correct after sculpt edits so step changes repaint immediately without introducing continuous frame work.

## 3. Grid Interaction and Placement Consistency

- [ ] 3.1 Update hover/targeting resolution over stepped terrain so editor interactions still map predictably to intended grid cells.
- [ ] 3.2 Verify and adjust prop/character support placement logic so ground-supported objects snap to valid stepped surfaces without manual Y correction.
- [ ] 3.3 Handle boundary cases where terrain edits occur under existing objects to avoid persistent floating/buried outcomes.

## 4. Verification

- [ ] 4.1 Add or update unit tests for stepped quantization, serialization migration, and placement support behavior.
- [ ] 4.2 Add or update integration/e2e coverage for outdoor sculpting interactions and visual/readability regressions on stepped terrain.
- [ ] 4.3 Run `pnpm run test` and `pnpm run build`, then run `pnpm run verify` if broader regression confidence is needed before merge.
