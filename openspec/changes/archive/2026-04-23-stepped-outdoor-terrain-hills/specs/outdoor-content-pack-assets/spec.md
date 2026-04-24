## MODIFIED Requirements

### Requirement: Curated outdoor forest assets are available for placement
The system SHALL expose a curated outdoor asset set for outdoor map authoring that includes forest dressing assets and the terrain hill/cliff kit required for stepped outdoor terrain rendering.

#### Scenario: Outdoor asset categories are present
- **WHEN** the user opens asset selection or the editor resolves outdoor terrain rendering for an outdoor map
- **THEN** the curated outdoor asset set includes the required tree, rock, bush, hill-top, and cliff assets needed for the supported outdoor workflows

### Requirement: Outdoor asset files are sourced from maintained project paths
The system SHALL reference outdoor asset files from non-temporary project paths and SHALL include required sidecar dependencies for `.gltf` assets, including the stepped terrain hill/cliff kit copied from the temporary forest asset source.

#### Scenario: Registered outdoor terrain asset resolves all required files
- **WHEN** the system loads a registered outdoor terrain `.gltf` asset used by stepped terrain rendering
- **THEN** required sidecar files such as `.bin` files and shared textures resolve from committed project locations
- **AND** the runtime does not depend on files under `forrest-assets-tmp/`

## ADDED Requirements

### Requirement: Outdoor stepped terrain SHALL use a consistent default terrain palette
The system SHALL render the first stepped outdoor terrain release from a consistent default terrain palette so grass tops and cliff walls remain visually cohesive.

#### Scenario: Default stepped terrain uses the curated Color1 palette
- **WHEN** the renderer builds stepped outdoor terrain without an explicit palette override
- **THEN** it uses the curated default `Color1` hill/cliff asset set for visible terrain tops and cliffs
