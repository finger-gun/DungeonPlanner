# outdoor-content-pack-assets

## Purpose

Define requirements for curated outdoor content-pack asset availability, file sourcing, and metadata-driven blocking behavior.
## Requirements
### Requirement: Curated outdoor forest assets are available for placement
The system SHALL expose a curated outdoor asset set for outdoor map authoring that includes forest dressing assets and all supported stepped terrain style kits required for authored outdoor terrain rendering.

#### Scenario: Outdoor asset categories are present
- **WHEN** the user opens asset selection or the editor resolves stepped outdoor terrain rendering for an outdoor map
- **THEN** the curated outdoor asset set includes the required tree, rock, bush, hill-top, and cliff assets for each supported terrain style

### Requirement: Outdoor asset files are sourced from maintained project paths
The system SHALL reference outdoor asset files from non-temporary project paths and SHALL include required sidecar dependencies for `.gltf` terrain assets for every supported stepped terrain style.

#### Scenario: Registered terrain-style asset resolves all required files
- **WHEN** the system loads a registered outdoor terrain `.gltf` asset used by stepped terrain rendering for any supported terrain style
- **THEN** required sidecar files such as `.bin` files and shared textures resolve from committed project locations
- **AND** the runtime does not depend on files under `forrest-assets-tmp/`

### Requirement: Outdoor assets support metadata-driven gameplay blocking behavior
The system SHALL apply metadata-defined movement and line-of-sight blocking behavior for outdoor assets where such metadata is configured.

#### Scenario: Blocking asset influences traversal and visibility
- **WHEN** the user places an outdoor asset with blocking metadata
- **THEN** movement and visibility logic treat the affected space as blocked according to configured metadata

### Requirement: Outdoor stepped terrain SHALL use a consistent default terrain palette
The system SHALL render the first stepped outdoor terrain release from a consistent default terrain palette so grass tops and cliff walls remain visually cohesive.

#### Scenario: Default stepped terrain uses the curated Color1 palette
- **WHEN** the renderer builds stepped outdoor terrain without an explicit palette override
- **THEN** it uses the curated default `Color1` hill/cliff asset set for visible terrain tops and cliffs

### Requirement: Outdoor stepped terrain SHALL support curated authored terrain styles
The system SHALL support the curated authored stepped terrain styles `Color1` through `Color8` as user-selectable outdoor terrain styles.

#### Scenario: Terrain style brush exposes all supported styles
- **WHEN** the user opens the outdoor terrain-style paint controls
- **THEN** the supported stepped terrain styles `Color1` through `Color8` are available as selectable paint options

### Requirement: Each supported terrain style SHALL provide coordinated top and cliff assets
The system SHALL use a coordinated asset kit for each supported terrain style so top surfaces, edge caps, cliffs, and tall cliffs share the authored look of that style.

#### Scenario: Painted terrain resolves a coordinated style kit
- **WHEN** the renderer resolves a terrain cell painted with a supported terrain style
- **THEN** stepped top surfaces and cliff meshes use the matching authored asset kit for that style

### Requirement: Each supported terrain style SHALL provide a maintained flat-ground runtime texture
The system SHALL provide a maintained runtime texture representation for the top surface of each supported terrain style so flat ground and top-surface transitions can match the authored stepped terrain kit.

#### Scenario: Flat unraised terrain matches the selected style
- **WHEN** an outdoor terrain cell resolves to a supported terrain style without raised or lowered stepped geometry
- **THEN** the visible flat ground uses the maintained runtime texture derived for that terrain style
