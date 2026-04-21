## MODIFIED Requirements

### Requirement: Curated outdoor forest assets are available for placement
The system SHALL expose a curated outdoor asset set containing trees, rocks, bushes, and terrain-oriented hill/cliff pieces in the asset catalog for outdoor map authoring, including supported color variant families.

#### Scenario: Outdoor asset categories are present
- **WHEN** the user opens asset selection for an outdoor map
- **THEN** curated tree, rock, bush, and terrain-piece assets are available for placement

#### Scenario: Color variants are available for supported outdoor assets
- **WHEN** the user selects a supported outdoor asset family with color variants
- **THEN** the available configured color variants can be used by outdoor tools and placement workflows

### Requirement: Outdoor asset files are sourced from maintained project paths
The system SHALL reference outdoor asset files from non-temporary project paths and SHALL include required sidecar dependencies for `.gltf` assets across all ingested outdoor variants.

#### Scenario: Registered asset resolves all required files
- **WHEN** the system loads a registered outdoor `.gltf` asset
- **THEN** required sidecar files (such as `.bin` and shared textures) resolve from committed project locations

#### Scenario: Ingested variant assets are not sourced from temporary folders
- **WHEN** new outdoor terrain/color variants are added to the content pack registry
- **THEN** runtime asset references resolve from maintained repository asset paths
- **AND** temporary import source folders are not used as runtime origins

### Requirement: Outdoor assets support metadata-driven gameplay blocking behavior
The system SHALL apply metadata-defined movement and line-of-sight blocking behavior for outdoor assets where such metadata is configured.

#### Scenario: Blocking asset influences traversal and visibility
- **WHEN** the user places an outdoor asset with blocking metadata
- **THEN** movement and visibility logic treat the affected space as blocked according to configured metadata
