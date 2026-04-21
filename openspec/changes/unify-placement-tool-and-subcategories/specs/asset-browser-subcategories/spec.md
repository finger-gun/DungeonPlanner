## ADDED Requirements

### Requirement: Asset browser supports top-level categories and subcategories
The asset browser MUST organize placeable assets into user-facing top-level categories and subcategories so users can browse large libraries by scene-dressing intent.

#### Scenario: User can narrow a large prop library by category
- **WHEN** a user opens the unified asset browser with a large number of placeable assets available
- **THEN** the browser presents top-level categories that reduce the visible asset set
- **AND** selecting a category updates the visible assets to that category only

#### Scenario: User can narrow within a category by subcategory
- **WHEN** a user selects a top-level category that contains many assets
- **THEN** the browser presents subcategories or equivalent secondary grouping for that category
- **AND** selecting a subcategory narrows the visible assets further

### Requirement: Browser groupings are driven by asset metadata
The system MUST determine asset browser category and subcategory membership from asset metadata or metadata-derived defaults rather than hard-coded UI-only asset lists.

#### Scenario: Content pack metadata controls browser placement
- **WHEN** the browser loads assets from content packs
- **THEN** each supported asset is assigned to a category and subcategory based on its metadata

#### Scenario: Missing metadata falls back safely
- **WHEN** an asset lacks explicit subcategory metadata but is still supported in the browser
- **THEN** the system assigns it to a safe default grouping instead of hiding it or crashing the browser

### Requirement: Browser organization must not hide critical placement context
The asset browser MUST communicate enough placement context for users to distinguish major asset families such as openings, wall-mounted assets, and floor/surface assets while browsing.

#### Scenario: Openings remain distinguishable from props in the shared browser
- **WHEN** a user browses the shared asset library
- **THEN** doors and stairs appear in an openings-oriented grouping or clearly labeled category
- **AND** the user can identify them without opening each asset individually

#### Scenario: Wall-mounted assets remain recognizable while browsing
- **WHEN** a user browses decor or similar categories that include both floor and wall assets
- **THEN** the browser exposes enough labeling, grouping, or filtering to distinguish wall-mounted assets from floor-mounted assets
