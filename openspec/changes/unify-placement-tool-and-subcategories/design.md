## Context

DungeonPlanner currently splits asset placement across props, openings, and surface-oriented editing flows. That separation made sense while the asset library was small, but it now forces users to think in implementation terms instead of placement intent, especially when doors, stairs, banners, props, and decorative surface variants are all discovered from different tools or panels.

The codebase already has many of the underlying pieces needed for a unified experience: content-pack metadata, connector-driven placement, specialized opening behavior, and asset-specific editor routing. The main design challenge is consolidating browsing and selection without regressing fast workflows such as brush-like surface variation or door placement that replaces wall segments.

## Goals / Non-Goals

**Goals:**
- Provide one asset-oriented placement entry point for props, openings, and decorative surface assets.
- Add browser categories and subcategories that help users find assets by scene-dressing intent rather than raw asset type.
- Preserve specialized placement behaviors by deriving them from asset metadata instead of separate top-level tools.
- Keep serialized dungeon/object data stable unless a small migration is required for editor UI state only.
- Support incremental migration so existing content packs and editor code can move to the new model without a one-shot rewrite.

**Non-Goals:**
- Replacing room painting/editing workflows that are not asset-driven.
- Flattening every interaction into identical click behavior if a brush or replacement gesture is faster.
- Re-authoring existing dungeon models or changing rendering architecture.
- Introducing a large new persistence model for the asset browser beyond what is needed for selected category/filter/tool state.

## Decisions

### 1. Use one placement surface with metadata-driven behavior
The UI should expose one asset placement tool (or renamed equivalent) that opens a unified browser for props, openings, and decorative surface assets. Placement behavior will still vary by asset metadata and category: floor props place on floor connectors, wall assets mount to wall connectors, stairs retain floor-linking logic, and doors retain wall-replacement logic.

**Why:** This matches user intent ("place an asset") while preserving domain-specific behavior already implemented in placement logic.

**Alternatives considered:**
- Keep separate Props/Openings/Surface tools and only add shortcuts between them. Rejected because it keeps the browsing model fragmented.
- Convert everything to generic prop placement. Rejected because openings and surface painting have special rules that should remain explicit.

### 2. Model browser navigation as category + subcategory + filters
The asset browser should separate broad user-facing groups (for example Furniture, Storage, Decor, Treasure, Structure, Openings, Surfaces) from smaller subcategories and orthogonal filters/tags (for example wall-mounted, light, surface, large). Categories define primary navigation; filters refine within a category.

**Why:** Users browse first by intent, then by traits. A small top-level taxonomy avoids clutter while filters prevent category explosion.

**Alternatives considered:**
- A single deep nested category tree. Rejected because it becomes hard to scan and maintain.
- Search-only discovery. Rejected because browsing is still important for creative map dressing.

### 3. Keep fast interaction modes for surface variants
The unified tool should present assets from one browser, but not force all assets through the same interaction model. Surface variants and tile swaps can still expose paint/brush behavior when selected, while openings can still use wall-targeting semantics and floor assets can use point placement.

**Why:** The user benefit comes from unifying discovery and selection, not from removing faster editing gestures.

**Alternatives considered:**
- Single click-to-place interaction for every asset. Rejected because it slows down repeated surface edits.

### 4. Extend content-pack metadata instead of hard-coding UI groupings
Asset metadata should carry the information needed for unified browsing and behavior routing, including browser category/subcategory, placement family, and optional tags. Runtime/UI code should derive behavior from metadata rather than maintaining separate hard-coded asset lists.

**Why:** This keeps content packs self-describing and scales as more assets are added.

**Alternatives considered:**
- Maintain a central UI-only asset mapping table. Rejected because it duplicates content-pack knowledge and drifts easily.

### 5. Treat migration as editor-state compatibility, not dungeon-data migration
Placed dungeon objects, openings, and surfaces should keep their existing serialized representation whenever possible. Migration should be limited to ephemeral editor state such as selected tool, last-selected browser category, or persisted panel preferences if those are stored.

**Why:** The change is primarily UX/editor-structure work, not a geometry/data-format redesign.

**Alternatives considered:**
- Rewrite all placement records under one new serialized asset instance model. Rejected as too risky and unnecessary for the intended UX gain.

## Risks / Trade-offs

- **[Unified tool becomes too overloaded]** → Mitigation: keep room editing separate, use clear categories, and preserve distinct interaction affordances per asset family.
- **[Surface painting becomes slower after consolidation]** → Mitigation: retain brush-style behavior for surface-variant assets selected from the unified browser.
- **[Metadata rollout is inconsistent across content packs]** → Mitigation: add defaults, validation, and tests that fail when asset browser metadata is missing for supported asset families.
- **[Opening behavior becomes ambiguous when browsed beside props]** → Mitigation: show category-specific preview/placement cues and route behavior from asset metadata rather than panel state alone.
- **[Saved editor UI state becomes invalid]** → Mitigation: map legacy selected tools to the new unified placement tool and fall back to safe default categories on load.

## Migration Plan

1. Introduce browser metadata and unified placement-mode routing behind the existing editor state.
2. Map legacy tool selections for props/openings/surface variants onto the new unified placement entry point.
3. Preserve existing placement engines for doors, stairs, wall-mounted assets, and surface variants while reusing one browser and selection model.
4. Add content-pack metadata coverage and tests before removing legacy tool-only assumptions.
5. If persisted editor UI state exists, migrate old tool identifiers to the new unified tool identifier with safe defaults.

## Open Questions

- What final top-level category names should be exposed in the first version, especially for “Surfaces” versus “Decor” and “Structure” versus “Furniture”?
- Should recent/favorite assets ship in the same change or remain a follow-up once the browser taxonomy is in place?
- How much of the current surface-mode UI should be embedded in the unified panel versus shown as contextual controls after selecting a surface asset?
