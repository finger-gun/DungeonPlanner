## 1. Unified placement workflow

- [x] 1.1 Add editor state and selection routing for a unified asset placement tool that can represent props, openings, and decorative surface assets.
- [x] 1.2 Update tool-selection UI and panels so opening and surface-variant asset browsing moves into the unified placement entry point.
- [x] 1.3 Preserve specialized placement routing for doors, stairs, wall-mounted assets, and surface-variant assets inside the unified workflow.

## 2. Asset browser taxonomy

- [x] 2.1 Extend content-pack/browser metadata to define top-level categories, subcategories, and placement-relevant tags for supported assets.
- [x] 2.2 Implement browser category and subcategory navigation for the unified asset browser with safe defaults for assets missing explicit grouping metadata.
- [x] 2.3 Surface enough placement context in the browser UI to distinguish openings, wall-mounted assets, and floor/surface assets while browsing.

## 3. Compatibility and migration

- [x] 3.1 Map legacy prop/opening/surface tool selections to the unified placement workflow without breaking editor startup or restored UI state.
- [x] 3.2 Verify existing placed props, openings, and surface variants remain compatible without requiring geometry/object serialization changes.
- [x] 3.3 Add or update tests that cover unified tool routing, browser grouping behavior, and safe fallbacks for legacy or missing metadata.

## 4. Validation

- [x] 4.1 Run targeted unit tests for placement routing, browser grouping, and editor state restoration.
- [x] 4.2 Run `pnpm run build` after the unified workflow and browser changes are complete.
- [x] 4.3 Run `pnpm run verify` if the final implementation changes cross multiple editor flows and needs full regression coverage.
