# outdoor-content-pack-assets

## Purpose

Define requirements for curated outdoor content-pack asset availability, file sourcing, and metadata-driven blocking behavior.

## Requirements

### Requirement: Curated outdoor forest assets are available for placement
The system SHALL expose a curated outdoor asset set containing trees, rocks, and bushes in the asset catalog for outdoor map authoring.

#### Scenario: Outdoor asset categories are present
- **WHEN** the user opens asset selection for an outdoor map
- **THEN** curated tree, rock, and bush assets are available for placement

### Requirement: Outdoor asset files are sourced from maintained project paths
The system SHALL reference outdoor asset files from non-temporary project paths and SHALL include required sidecar dependencies for `.gltf` assets.

#### Scenario: Registered asset resolves all required files
- **WHEN** the system loads a registered outdoor `.gltf` asset
- **THEN** required sidecar files (such as `.bin` and shared textures) resolve from committed project locations

### Requirement: Outdoor assets support metadata-driven gameplay blocking behavior
The system SHALL apply metadata-defined movement and line-of-sight blocking behavior for outdoor assets where such metadata is configured.

#### Scenario: Blocking asset influences traversal and visibility
- **WHEN** the user places an outdoor asset with blocking metadata
- **THEN** movement and visibility logic treat the affected space as blocked according to configured metadata
