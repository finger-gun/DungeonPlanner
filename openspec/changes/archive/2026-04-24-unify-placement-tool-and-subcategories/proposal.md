## Why

DungeonPlanner now has enough props, openings, and surface-variant assets that the current split across multiple tools and flat prop browsing slows down encounter prep. Consolidating placement around one asset-oriented workflow and adding subcategories will make it faster for GMs to find the right asset, keep editing behavior more predictable, and reduce tool switching during map dressing.

## What Changes

- Introduce a unified asset placement workflow that groups props, openings, and decorative surface-variant assets under one browser-driven tool experience.
- Add prop subcategories so large asset libraries can be browsed by room-dressing intent instead of a single flat list.
- Add an asset category for openings so doors and stairs are browsed alongside other placeable scene assets while keeping their specialized behavior.
- Preserve specialized placement behaviors such as wall replacement for doors, floor linking for stairs, and efficient surface painting/variation workflows where they remain faster than single-object placement.
- Update asset metadata and browser presentation rules so wall-mounted, floor, surface, and replacement assets can be surfaced coherently from the same placement UI.
- Define migration rules for existing tool selections and editor state so current dungeons and editing sessions continue to load safely.

**In scope**
- Placement-tool UX consolidation for props, openings, and surface-variant asset selection
- Prop and asset browser categorization/subcategorization rules
- Behavior rules for how unified browsing maps to existing placement interactions

**Out of scope**
- Reworking unrelated room-editing, camera, or play-mode systems
- Re-authoring content pack art assets
- Large serialization format changes beyond what is strictly required for tool state compatibility

## Capabilities

### New Capabilities
- `unified-asset-placement`: A single asset-placement workflow that lets users browse and place props, openings, and decorative surface assets while preserving specialized placement behavior.
- `asset-browser-subcategories`: Asset-browser categorization and subcategorization rules for large prop/opening libraries, including user-facing grouping for faster discovery.

### Modified Capabilities
- None.

## Impact

- Affected areas include editor tool selection UI, asset browser/panels, placement-mode routing in `src/components/canvas/`, content-pack metadata in `src/content-packs/`, and editor state in `src/store/useDungeonStore.ts`.
- UX impact should improve editing speed and readability by reducing tool switching and making large prop libraries easier to navigate.
- Compatibility risk is moderate around persisted tool-selection/editor UI state; dungeon geometry/object serialization should remain stable unless a minimal migration is needed for saved placement-mode state.
